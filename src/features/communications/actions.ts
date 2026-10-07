'use server'

import { revalidatePath } from 'next/cache'
import { getSessionUser } from '@/lib/auth/session'
import { deliverBrevoOutbox } from '@/lib/email/brevo'
import { createMemberCommunication } from '@/lib/db/member-workflows'
import { canManageMemberCommunication, isValidEmail } from './domain.mjs'
import type { MemberCommunicationMode } from '@/types'

export async function sendMemberCommunicationAction(input: {
  mode: string
  memberIds: unknown
  manualEmail: string
  manualName: string
  subject: string
  body: string
  important: boolean
  inAppNotification: boolean
  confirmed: boolean
  allMembersConfirmed: boolean
}) {
  const actor = await getSessionUser()
  if (!actor || !canManageMemberCommunication(actor.role)) {
    return { success: false, error: 'Only leaders and admins can send member communications.' }
  }
  if (!input || typeof input !== 'object') return { success: false, error: 'Enter the communication details.' }
  const modes: MemberCommunicationMode[] = ['SINGLE_MEMBER', 'SELECTED_MEMBERS', 'ALL_MEMBERS', 'MANUAL_EMAIL']
  if (!modes.includes(input.mode as MemberCommunicationMode)) return { success: false, error: 'Choose a valid recipient group.' }
  if (!Array.isArray(input.memberIds) || input.memberIds.length > 500 || input.memberIds.some((value) => typeof value !== 'string' || value.length > 100)) {
    return { success: false, error: 'The selected member list is invalid.' }
  }
  if (typeof input.manualEmail !== 'string' || input.manualEmail.length > 254 ||
      typeof input.manualName !== 'string' || input.manualName.length > 120 ||
      typeof input.subject !== 'string' || input.subject.length > 160 ||
      typeof input.body !== 'string' || input.body.length > 10000 ||
      typeof input.important !== 'boolean' || typeof input.inAppNotification !== 'boolean' ||
      input.confirmed !== true || typeof input.allMembersConfirmed !== 'boolean') {
    return { success: false, error: 'Review the subject, message, and recipient details.' }
  }
  if (input.mode === 'ALL_MEMBERS' && input.allMembersConfirmed !== true) {
    return { success: false, error: 'Confirm the all-members recipient count before sending.' }
  }
  if (input.mode === 'MANUAL_EMAIL' && !isValidEmail(input.manualEmail)) {
    return { success: false, error: 'Enter a valid recipient email address.' }
  }
  try {
    const communication = await createMemberCommunication({
      mode: input.mode as MemberCommunicationMode,
      memberIds: input.memberIds as string[], manualEmail: input.manualEmail,
      manualName: input.manualName, subject: input.subject, body: input.body,
      important: input.important, inAppNotification: input.inAppNotification
    }, { id: actor.userId, name: actor.fullName })
    let configured = true
    try {
      const delivery = await deliverBrevoOutbox(5)
      configured = delivery.configured
    } catch {
      // The communication and its recipient jobs are durable and may be retried by the worker.
    }
    revalidatePath('/communications')
    revalidatePath('/notifications')
    return {
      success: true,
      id: communication.id,
      recipientCount: communication.recipientCount,
      invalidCount: communication.invalidCount,
      message: configured
        ? `Message queued for ${communication.recipientCount} individual recipient(s). Check delivery history for provider status.`
        : `Message saved for ${communication.recipientCount} recipient(s). Configure Brevo to deliver queued email.`
    }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Could not queue this communication.' }
  }
}
