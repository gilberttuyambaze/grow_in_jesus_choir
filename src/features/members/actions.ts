'use server'

import { revalidatePath } from 'next/cache'
import { getSessionUser } from '@/lib/auth/session'
import { canManageMembers } from '@/lib/permissions'
import {
  getMembersByIds,
  getPendingContributionMembers,
  updateMemberProfile,
  createAuditLog,
  createNotification
} from '@/lib/db'

export async function sendRemindersAction(memberIds?: string[]) {
  const session = await getSessionUser()
  if (!session || !canManageMembers(session.role)) {
    return { success: false, error: 'Unauthorized: Only leaders may send contribution reminders.' }
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

    if (targetMembers.length === 0) {
      return { success: true, count: 0, message: 'All members have already recorded their contributions.' }
    }

    // Queue notification records
    for (const member of targetMembers) {
      if (member.userId) {
        await createNotification({
          userId: member.userId,
          title: 'Monthly Contribution Reminder',
          message: 'A friendly reminder to submit your choir contribution for the current month.',
          type: 'info',
          link: '/dashboard'
        })
      }
    }

    await createAuditLog({
      actorId: session.userId,
      actorName: session.fullName,
      action: 'MEMBER_REMINDERS_DISPATCHED',
      targetType: 'members',
      targetId: 'batch',
      details: {
        count: targetMembers.length,
        recipients: targetMembers.map((m) => m.fullName)
      }
    })

    revalidatePath('/members')
    revalidatePath('/dashboard')
    revalidatePath('/activity')

    return {
      success: true,
      count: targetMembers.length,
      message: `Gentle reminders sent to ${targetMembers.length} choir members.`
    }
  } catch (error: any) {
    return { success: false, error: 'Failed to dispatch reminders.' }
  }
}

export async function updateMemberProfileAction(formData: FormData) {
  const session = await getSessionUser()
  if (!session) {
    return { success: false, error: 'Unauthorized: Session expired.' }
  }

  const phone = typeof formData.get('phone') === 'string' ? (formData.get('phone') as string).trim() : ''
  const fullName = typeof formData.get('fullName') === 'string' ? (formData.get('fullName') as string).trim() : ''
  if (!fullName || fullName.length > 120 || phone.length > 40) {
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
      details: { phone, fullName }
    })

    revalidatePath('/settings')
    revalidatePath('/dashboard')
    revalidatePath('/members')

    return { success: true, message: 'Profile updated successfully.' }
  } catch (error: any) {
    return { success: false, error: 'Failed to update profile.' }
  }
}
