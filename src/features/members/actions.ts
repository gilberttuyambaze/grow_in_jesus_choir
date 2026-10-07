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
    let targetMembers: { id: string; fullName: string; userId: string | null }[] = []

    if (memberIds && memberIds.length > 0) {
      targetMembers = await getMembersByIds(memberIds)
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
          message: 'Gentle reminder: Please submit your October 2026 choir contribution (50,000 RWF).',
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
    return { success: false, error: error.message || 'Failed to dispatch reminders.' }
  }
}

export async function updateMemberProfileAction(formData: FormData) {
  const session = await getSessionUser()
  if (!session) {
    return { success: false, error: 'Unauthorized: Session expired.' }
  }

  const phone = (formData.get('phone') as string)?.trim()
  const fullName = (formData.get('fullName') as string)?.trim()

  try {
    await updateMemberProfile(session.userId, { fullName, phone })

    await createAuditLog({
      actorId: session.userId,
      actorName: fullName || session.fullName,
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
    return { success: false, error: error.message || 'Failed to update profile.' }
  }
}

