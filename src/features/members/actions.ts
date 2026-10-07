'use server'

import { revalidatePath } from 'next/cache'
import { getSessionUser } from '@/lib/auth/session'
import { canManageMembers } from '@/lib/permissions'
import { getDatabase, createAuditLog, createNotification } from '@/lib/db'

export async function sendRemindersAction(memberIds?: string[]) {
  const session = await getSessionUser()
  if (!session || !canManageMembers(session.role)) {
    return { success: false, error: 'Unauthorized: Only leaders may send contribution reminders.' }
  }

  const db = getDatabase()

  try {
    let targetMembers: { id: string; fullName: string; userId: string | null }[] = []

    if (memberIds && memberIds.length > 0) {
      const placeholders = memberIds.map(() => '?').join(',')
      const stmt = db.prepare(`SELECT id, full_name as fullName, user_id as userId FROM members WHERE id IN (${placeholders})`)
      targetMembers = stmt.all(...memberIds) as any[]
    } else {
      // Find all members who have not recorded an October 2026 contribution
      const stmt = db.prepare(`
        SELECT m.id, m.full_name as fullName, m.user_id as userId
        FROM members m
        WHERE m.id NOT IN (
          SELECT DISTINCT member_id FROM financial_records 
          WHERE member_id IS NOT NULL 
          AND record_date >= '2026-10-01' 
          AND status IN ('recorded', 'needs_review')
        )
      `)
      targetMembers = stmt.all() as any[]
    }

    if (targetMembers.length === 0) {
      return { success: true, count: 0, message: 'All members have already recorded their contributions.' }
    }

    // Queue notification records
    for (const member of targetMembers) {
      if (member.userId) {
        createNotification({
          userId: member.userId,
          title: 'Monthly Contribution Reminder',
          message: 'Gentle reminder: Please submit your October 2026 choir contribution (50,000 RWF).',
          type: 'info',
          link: '/dashboard'
        })
      }
    }

    createAuditLog({
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

