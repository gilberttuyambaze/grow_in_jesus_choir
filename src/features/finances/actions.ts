'use server'

import { revalidatePath } from 'next/cache'
import { getSessionUser } from '@/lib/auth/session'
import { canCreateRecord, canCreateExpense, canApproveRecord } from '@/lib/permissions'
import { createFinancialRecord, updateRecordStatus } from '@/lib/db'
import { parseCurrencyInput, formatCurrency } from '@/lib/utils/currency'
import { getTodayISODate } from '@/lib/utils/date'

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

  const amountRaw = formData.get('amount') as string
  const amount = parseCurrencyInput(amountRaw)
  if (!amount || amount <= 0) {
    return { success: false, error: 'Please enter a valid amount greater than 0.' }
  }

  const categoryId = (formData.get('categoryId') as string)?.trim()
  if (!categoryId) {
    return { success: false, error: 'Please select a financial category.' }
  }

  const description = (formData.get('description') as string)?.trim()
  if (!description) {
    return { success: false, error: 'Please enter a brief description for this record.' }
  }

    const recordDate = (formData.get('recordDate') as string)?.trim() || getTodayISODate()
  const memberId = (formData.get('memberId') as string)?.trim() || null
  const receiptFilename = (formData.get('receiptFilename') as string)?.trim() || undefined

  // If added by a member, it requires leader approval ('needs_review')
  // If added by a leader, it is directly confirmed ('recorded')
  const status = session.role === 'MEMBER' ? 'needs_review' : 'recorded'

  try {
    const record = await createFinancialRecord({
      type,
      categoryId,
      amount,
      recordDate,
      description,
      memberId,
      recordedById: session.userId,
      status,
      receiptFilename
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
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to save financial record.' }
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

  const newStatus = decision === 'approve' ? 'recorded' : 'rejected'

  try {
    await updateRecordStatus({
      recordId,
      status: newStatus,
      actorId: session.userId,
      actorName: session.fullName,
      reason
    })

    revalidatePath('/dashboard')
    revalidatePath('/finances')
    revalidatePath('/activity')
    revalidatePath('/reports')

    return {
      success: true,
      message: decision === 'approve' ? 'Record approved and financial balance updated.' : 'Record rejected.'
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to update record status.' }
  }
}

export async function voidRecordAction(recordId: string, reason: string) {
  const session = await getSessionUser()
  if (!session || !canApproveRecord(session.role)) {
    return { success: false, error: 'Unauthorized: Only leaders may void financial records.' }
  }

  if (!reason || !reason.trim()) {
    return { success: false, error: 'Please provide a reason for voiding this record.' }
  }

  try {
    await updateRecordStatus({
      recordId,
      status: 'voided',
      actorId: session.userId,
      actorName: session.fullName,
      reason: reason.trim()
    })

    revalidatePath('/dashboard')
    revalidatePath('/finances')
    revalidatePath('/activity')
    revalidatePath('/reports')

    return {
      success: true,
      message: 'Record marked as voided. Financial balances have been updated.'
    }
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to void record.' }
  }
}

