'use server'

import { revalidatePath } from 'next/cache'
import { getSessionUser } from '@/lib/auth/session'
import { canManageMembers } from '@/lib/permissions'
import {
  getMembersByIds,
  getPendingContributionMembers,
  updateMemberProfile,
  createAuditLog
} from '@/lib/db'
import { createMemberCommunication } from '@/lib/db/member-workflows'
import { deliverBrevoOutbox } from '@/lib/email/brevo'

export async function sendRemindersAction(memberIds?: string[]) {
  const session = await getSessionUser()
  if (!session || !canManageMembers(session.role)) {
    return { success: false, error: 'Unauthorized: Only leaders and admins may send contribution reminders.' }
  }

  try {
    if (memberIds && (memberIds.length > 500 || memberIds.some((id) => typeof id !== 'string' || id.length > 100))) {
      return { success: false, error: 'The selected member list is invalid.' }
    }
    let targetMembers: { id: string; fullName: string; userId: string | null }[] = []

    if (memberIds && memberIds.length > 0) {
      targetMembers = await getMembersByIds([...new Set(memberIds)])
    } else {
      targetMembers = await getPendingContributionMembers()
    }
    const foundTargets = targetMembers.length
    targetMembers = targetMembers.filter((member) => member.userId)

    if (targetMembers.length === 0) {
      return {
        success: true, count: 0,
        message: foundTargets === 0 ? 'All eligible members have already recorded their contributions.' : 'No selected member has a linked account for email communication.'
      }
    }

    const communication = await createMemberCommunication({
      mode: targetMembers.length === 1 ? 'SINGLE_MEMBER' : 'SELECTED_MEMBERS',
      memberIds: targetMembers.map((member) => member.id),
      manualEmail: '',
      manualName: '',
      subject: 'Monthly Choir Contribution Reminder',
      body: 'A friendly reminder to submit your choir contribution for the current month. If you have already contributed, please disregard this message.',
      important: false,
      inAppNotification: true
    }, { id: session.userId, name: session.fullName })
    let configured = true
    try {
      const delivery = await deliverBrevoOutbox(5)
      configured = delivery.configured
    } catch {
      // The queued message remains available to the scheduled delivery worker.
    }

    revalidatePath('/communications')
    revalidatePath('/notifications')
    revalidatePath('/members')
    revalidatePath('/dashboard')

    return {
      success: true,
      count: communication.recipientCount,
      message: configured
        ? `Contribution reminder queued for ${communication.recipientCount} member(s).`
        : `Reminder saved for ${communication.recipientCount} member(s); email remains queued until Brevo is configured.`
    }
  } catch (error: any) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to queue reminders.' }
  }
}

export async function updateMemberProfileAction(formData: FormData) {
  const session = await getSessionUser()
  if (!session) {
    return { success: false, error: 'Unauthorized: Session expired.' }
  }

  const fullNameValue = formData.get('fullName')
  const phoneValue = formData.get('phone')
  if ((fullNameValue !== null && typeof fullNameValue !== 'string') || (phoneValue !== null && typeof phoneValue !== 'string')) {
    return { success: false, error: 'The submitted profile details are invalid.' }
  }
  const fullName = typeof fullNameValue === 'string' ? fullNameValue.trim() : ''
  const phone = typeof phoneValue === 'string' ? phoneValue.trim() : ''
  const phoneDigits = phone.replace(/\D/g, '')
  if (
    !fullName || fullName.length > 120 || /[\u0000-\u001f\u007f]/.test(fullName) ||
    phone.length > 40 || (phone && (!/^[+\d().\s-]+$/.test(phone) || phoneDigits.length < 7 || phoneDigits.length > 15))
  ) {
    return { success: false, error: 'Enter a name and a valid phone number.' }
  }

  try {
    await updateMemberProfile(session.userId, { fullName, phone })

    await createAuditLog({
      actorId: session.userId,
      actorName: session.fullName,
      action: 'PROFILE_UPDATED',
      targetType: 'users',
      targetId: session.userId,
      details: { updatedFields: ['fullName', 'phone'] }
    })

    revalidatePath('/profile')
    revalidatePath('/settings')
    revalidatePath('/dashboard')
    revalidatePath('/members')

    return { success: true, message: 'Profile updated successfully.' }
  } catch (error: any) {
    return { success: false, error: 'Failed to update profile.' }
  }
}
