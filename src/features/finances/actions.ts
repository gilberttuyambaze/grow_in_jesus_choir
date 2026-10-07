'use server'

import { revalidatePath } from 'next/cache'
import { getSessionUser } from '@/lib/auth/session'
import { canCreateRecord, canCreateExpense, canApproveRecord } from '@/lib/permissions'
import { createFinancialRecord, getFinancialCategories, getMemberById, getMemberByUserId, updateRecordStatus } from '@/lib/db'
import { parseCurrencyInput, formatCurrency } from '@/lib/utils/currency'
import { getTodayISODate } from '@/lib/utils/date'
import { deliverBrevoOutbox } from '@/lib/email/brevo'

export async function createRecordAction(formData: FormData) {
  const session = await getSessionUser()
  if (!session) {
    return { success: false, error: 'You must be signed in to add financial records.' }
  }

  if (!canCreateRecord(session.role)) {
    return { success: false, error: 'You do not have permission to create financial records.' }
  }

  const type = formData.get('type') as 'income' | 'expense'
  if (type !== 'income' && type !== 'expense') {
    return { success: false, error: 'Please choose whether money was received or spent.' }
  }

  if (type === 'expense' && !canCreateExpense(session.role)) {
    return { success: false, error: 'Only choir leaders may record expenses.' }
  }

  const amountRaw = typeof formData.get('amount') === 'string' ? formData.get('amount') as string : ''
  if (amountRaw.length > 30) return { success: false, error: 'Please enter a valid amount greater than 0.' }
  const amount = parseCurrencyInput(amountRaw)
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    return { success: false, error: 'Please enter a valid amount greater than 0.' }
  }

  const categoryId = typeof formData.get('categoryId') === 'string' ? (formData.get('categoryId') as string).trim() : ''
  if (!categoryId || categoryId.length > 100) {
    return { success: false, error: 'Please select a financial category.' }
  }

  const description = typeof formData.get('description') === 'string' ? (formData.get('description') as string).trim() : ''
  if (!description || description.length > 500) {
    return { success: false, error: 'Please enter a brief description for this record.' }
  }

  const recordDate = typeof formData.get('recordDate') === 'string'
    ? (formData.get('recordDate') as string).trim()
    : getTodayISODate()
  const parsedDate = /^\d{4}-\d{2}-\d{2}$/.test(recordDate) ? new Date(`${recordDate}T00:00:00.000Z`) : null
  if (!parsedDate || Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== recordDate || recordDate > getTodayISODate()) {
    return { success: false, error: 'Please choose a valid date that is not in the future.' }
  }

  try {
    const requestedMemberId = typeof formData.get('memberId') === 'string'
      ? (formData.get('memberId') as string).trim()
      : ''
    if (requestedMemberId.length > 100) return { success: false, error: 'Selected member could not be found.' }
    let memberId: string | null = null
    if (session.role === 'MEMBER') {
      const ownMember = await getMemberByUserId(session.userId)
      if (!ownMember || ownMember.status !== 'active') {
        return { success: false, error: 'Your account is not linked to an active choir member profile.' }
      }
      memberId = ownMember.id
    } else if (requestedMemberId) {
      const selectedMember = await getMemberById(requestedMemberId)
      if (!selectedMember) return { success: false, error: 'Selected member could not be found.' }
      memberId = selectedMember.id
    }

    const categories = await getFinancialCategories(type)
    if (!categories.some((category) => category.id === categoryId)) {
      return { success: false, error: 'Please select an active category for this record type.' }
    }

    // Member submissions stay pending until a leader approves them.
    const status = session.role === 'MEMBER' ? 'needs_review' : 'recorded'
    const record = await createFinancialRecord({
      type,
      categoryId,
      amount,
      recordDate,
      description,
      memberId,
      recordedById: session.userId,
      status
    })

    revalidatePath('/dashboard')
    revalidatePath('/finances')
    revalidatePath('/activity')
    revalidatePath('/reports')
    return {
      success: true,
      record,
      message: status === 'needs_review' 
        ? `Contribution of ${formatCurrency(amount)} submitted for leader verification.`
        : `Record of ${formatCurrency(amount)} saved successfully.`
    }
  } catch {
    return { success: false, error: 'Failed to save financial record. Please try again.' }
  }
}

export async function reviewRecordAction(
  recordId: string,
  decision: 'approve' | 'reject',
  reason?: string
) {
  const session = await getSessionUser()
  if (!session || !canApproveRecord(session.role)) {
    return { success: false, error: 'Unauthorized: Only leaders may approve or reject records.' }
  }

  if (decision !== 'approve' && decision !== 'reject') {
    return { success: false, error: 'Invalid review decision.' }
  }
  if (typeof recordId !== 'string' || !recordId || recordId.length > 100 ||
      (typeof reason !== 'undefined' && (typeof reason !== 'string' || reason.length > 500))) {
    return { success: false, error: 'Invalid record review details.' }
  }
  const newStatus = decision === 'approve' ? 'recorded' : 'rejected'

  try {
    const updated = await updateRecordStatus({
      recordId,
      status: newStatus,
      actorId: session.userId,
      actorName: session.fullName,
      reason
    })
    if (!updated) return { success: false, error: 'This record is no longer awaiting review.' }

    revalidatePath('/dashboard')
    revalidatePath('/finances')
    revalidatePath('/activity')
    revalidatePath('/reports')
    revalidatePath('/sessions', 'layout')
    revalidatePath('/sessions/[id]', 'page')
    try { await deliverBrevoOutbox(5) } catch { /* The durable outbox is retried by the scheduled Brevo worker. */ }

    return {
      success: true,
      message: decision === 'approve' ? 'Record approved and financial balance updated.' : 'Record rejected.'
    }
  } catch {
    return { success: false, error: 'Failed to update record status.' }
  }
}

export async function voidRecordAction(recordId: string, reason: string) {
  const session = await getSessionUser()
  if (!session || !canApproveRecord(session.role)) {
    return { success: false, error: 'Unauthorized: Only leaders may void financial records.' }
  }

  if (typeof recordId !== 'string' || !recordId || recordId.length > 100) {
    return { success: false, error: 'Invalid record identifier.' }
  }
  if (typeof reason !== 'string' || !reason.trim() || reason.length > 500) {
    return { success: false, error: 'Please provide a reason for voiding this record.' }
  }

  try {
    const updated = await updateRecordStatus({
      recordId,
      status: 'voided',
      actorId: session.userId,
      actorName: session.fullName,
      reason: reason.trim()
    })
    if (!updated) return { success: false, error: 'This record cannot be voided in its current state.' }

    revalidatePath('/dashboard')
    revalidatePath('/finances')
    revalidatePath('/activity')
    revalidatePath('/reports')

    return {
      success: true,
      message: 'Record marked as voided. Financial balances have been updated.'
    }
  } catch {
    return { success: false, error: 'Failed to void record.' }
  }
}
