'use server'

import crypto from 'node:crypto'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getSessionUser, setSession } from '@/lib/auth/session'
import { hashPassword, validateNewPassword } from '@/lib/auth/password'
import { canManageMembers } from '@/lib/permissions'
import type { InvitationRole, UserRole } from '@/types'
import { deliverBrevoOutbox } from '@/lib/email/brevo'
import {
  acceptMemberInvitation,
  cancelMemberInvitation,
  createMemberInvitation,
  getPublicInvitation,
  resendMemberInvitation
} from '@/lib/db/member-workflows'
import { INVITATION_TOKEN_PATTERN, isInvitationAcceptable } from '@/features/communications/domain.mjs'

function actorError(role: UserRole) {
  return canManageMembers(role) ? null : 'Only leaders and admins can manage member invitations.'
}

function isInvitationRole(role: string): role is InvitationRole {
  return role === 'MEMBER' || role === 'LEADER' || role === 'ADMIN'
}

export async function createMemberInvitationAction(formData: FormData) {
  const actor = await getSessionUser()
  if (!actor) return { success: false, error: 'Sign in before inviting a member.' }
  const denied = actorError(actor.role)
  if (denied) return { success: false, error: denied }
  const read = (key: string, max: number) => {
    const value = formData.get(key)
    return typeof value === 'string' && value.trim().length <= max ? value.trim() : null
  }
  const email = read('email', 254)
  const fullName = read('fullName', 120)
  const phone = read('phone', 40)
  const voicePart = read('voicePart', 20)
  const invitedRoleValue = formData.get('invitedRole')
  const invitedRole = typeof invitedRoleValue === 'string' ? invitedRoleValue.trim() : 'MEMBER'
  const message = read('message', 1000)
  const expiryRaw = read('expiryHours', 3)
  const expiryHours = expiryRaw && /^\d+$/.test(expiryRaw) ? Number(expiryRaw) : 168
  if (!email || !fullName || !voicePart || message === null || phone === null) {
    return { success: false, error: 'Complete the required fields and check their length.' }
  }
  if (!isInvitationRole(invitedRole)) {
    return { success: false, error: 'Choose a valid account role.' }
  }
  try {
    await createMemberInvitation({
      email, fullName, phone: phone || null,
      voicePart: voicePart as 'Soprano' | 'Alto' | 'Tenor' | 'Bass',
      invitedRole, message, expiryHours
    }, { id: actor.userId, name: actor.fullName })
    try { await deliverBrevoOutbox(5) } catch { /* The durable outbox is retried by the scheduled worker. */ }
    revalidatePath('/members/invitations')
    revalidatePath('/members')
    return { success: true, message: 'Invitation saved. Delivery status is shown in the invitation list.' }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Could not create the invitation.' }
  }
}

export async function resendMemberInvitationAction(invitationId: string) {
  const actor = await getSessionUser()
  if (!actor) return { success: false, error: 'Sign in before resending an invitation.' }
  const denied = actorError(actor.role)
  if (denied) return { success: false, error: denied }
  if (typeof invitationId !== 'string' || invitationId.length > 100) return { success: false, error: 'Invalid invitation.' }
  try {
    await resendMemberInvitation(invitationId, { id: actor.userId, name: actor.fullName })
    try { await deliverBrevoOutbox(5) } catch { /* The durable outbox is retried by the scheduled worker. */ }
    revalidatePath('/members/invitations')
    return { success: true, message: 'Invitation renewed and queued for delivery.' }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Could not resend this invitation.' }
  }
}

export async function cancelMemberInvitationAction(invitationId: string) {
  const actor = await getSessionUser()
  if (!actor) return { success: false, error: 'Sign in before cancelling an invitation.' }
  const denied = actorError(actor.role)
  if (denied) return { success: false, error: denied }
  if (typeof invitationId !== 'string' || invitationId.length > 100) return { success: false, error: 'Invalid invitation.' }
  try {
    await cancelMemberInvitation(invitationId, { id: actor.userId, name: actor.fullName })
    revalidatePath('/members/invitations')
    revalidatePath('/members')
    return { success: true, message: 'Invitation cancelled. Its link can no longer be accepted.' }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Could not cancel this invitation.' }
  }
}

export async function acceptMemberInvitationAction(_previous: { error: string }, formData: FormData) {
  const rawToken = formData.get('token')
  const passwordValue = formData.get('password')
  const confirmValue = formData.get('confirmPassword')
  const token = typeof rawToken === 'string' ? rawToken : ''
  const password = typeof passwordValue === 'string' ? passwordValue : ''
  const confirmPassword = typeof confirmValue === 'string' ? confirmValue : ''
  if (!INVITATION_TOKEN_PATTERN.test(token)) return { error: 'This invitation link is invalid or has already been used.' }

  let invitation
  try {
    invitation = await getPublicInvitation(crypto.createHash('sha256').update(token).digest('hex'))
  } catch {
    return { error: 'Invitation service is temporarily unavailable. Try again later.' }
  }
  if (!invitation || !isInvitationAcceptable(invitation.status, invitation.expiresAt)) {
    return { error: invitation?.status === 'EXPIRED' ? 'This invitation has expired. Ask a leader for a new one.' : 'This invitation link is invalid, cancelled, or already used.' }
  }
  if (password !== confirmPassword) return { error: 'The passwords do not match.' }
  const passwordError = validateNewPassword(password)
  if (passwordError) return { error: passwordError }

  let result
  try {
    const passwordHash = await hashPassword(password)
    result = await acceptMemberInvitation({
      tokenHash: crypto.createHash('sha256').update(token).digest('hex'),
      passwordHash
    })
  } catch {
    return { error: 'Your account could not be created. Please try again or contact a choir leader.' }
  }
  if ('error' in result) {
    return { error: result.error === 'EXPIRED'
      ? 'This invitation has expired. Ask a leader for a new one.'
      : 'This invitation could not be accepted. It may have been cancelled or already used.' }
  }
  try {
    await setSession(result)
  } catch {
    redirect('/login?invitation=accepted')
  }
  revalidatePath('/', 'layout')
  redirect('/dashboard')
}
