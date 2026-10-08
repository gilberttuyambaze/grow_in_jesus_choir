import 'server-only'

import crypto from 'node:crypto'
import type { PoolClient } from 'pg'
import { getPgPool } from '@/lib/db'
import {
  MemberCommunication,
  MemberCommunicationMode,
  MemberInvitation,
  InvitationRole,
  User
} from '@/types'
import { renderCommunicationEmail, renderInvitationEmail } from '@/lib/email/brand-templates.mjs'
import {
  countRecipientRateLimit,
  deduplicateRecipients,
  isValidEmail,
  normalizeEmail
} from '@/features/communications/domain.mjs'

const INVITATION_HOURS = new Set([24, 72, 168, 336])
const MAX_COMMUNICATION_RECIPIENTS = 500
const MAX_SELECTED_MEMBER_IDS = 500

function id() {
  return crypto.randomUUID()
}

function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

function avatarInitials(fullName: string) {
  return fullName.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
}

function appBaseUrl() {
  const value = (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || '').trim()
  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new Error('Set APP_URL or NEXT_PUBLIC_APP_URL to the public application URL before sending email.')
  }
  if (!['http:', 'https:'].includes(url.protocol) || (process.env.NODE_ENV === 'production' && url.protocol !== 'https:')) {
    throw new Error('The public application URL must use HTTPS in production.')
  }
  return url.origin
}

function formatExpiry(value: string | Date) {
  return new Intl.DateTimeFormat('en-RW', {
    timeZone: process.env.APP_TIME_ZONE?.trim() || 'Africa/Kigali',
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value))
}

async function audit(client: PoolClient, input: {
  actorId?: string | null
  actorName: string
  action: string
  targetType: string
  targetId: string
  details?: Record<string, unknown>
}) {
  await client.query(
    `INSERT INTO audit_logs (id, actor_id, actor_name, action, target_type, target_id, details)
     VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)`,
    [id(), input.actorId || null, input.actorName, input.action, input.targetType, input.targetId,
      JSON.stringify(input.details || {})]
  )
}

async function expireInvitations(client: PoolClient, actor?: { id: string; name: string }) {
  const expired = await client.query(
    `UPDATE member_invitations
     SET status = 'EXPIRED', token_hash = NULL, updated_at = NOW(), last_error = NULL
     WHERE status IN ('PENDING', 'SENT', 'FAILED') AND expires_at <= NOW()
     RETURNING id, email, invited_by_id AS "invitedById", invited_by_name AS "invitedByName"`
  )
  for (const invitation of expired.rows) {
    await client.query(
      `UPDATE email_outbox SET status = 'CANCELLED', claim_token = NULL, claimed_at = NULL
       WHERE invitation_id = $1 AND status IN ('QUEUED', 'SENDING')`,
      [invitation.id]
    )
    await audit(client, {
      actorId: actor?.id || invitation.invitedById,
      actorName: actor?.name || invitation.invitedByName,
      action: 'MEMBER_INVITATION_EXPIRED',
      targetType: 'member_invitation',
      targetId: invitation.id,
      details: { email: invitation.email, result: 'EXPIRED' }
    })
  }
}

function queueInvitationEmail(client: PoolClient, input: {
  invitationId: string
  generation: number
  email: string
  fullName: string
  subject: string
  message: string
  html: string
}) {
  return client.query(
    `INSERT INTO email_outbox
       (id, event_key, recipient_email, recipient_name, subject, message, html_content, invitation_id, invitation_generation)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (event_key) DO NOTHING`,
    [id(), `member-invitation:${input.invitationId}:${input.generation}`, input.email, input.fullName,
      input.subject, input.message, input.html, input.invitationId, input.generation]
  )
}

export async function createMemberInvitation(input: {
  email: string
  fullName: string
  phone: string | null
  voicePart: 'Soprano' | 'Alto' | 'Tenor' | 'Bass'
  invitedRole: InvitationRole
  message: string
  expiryHours: number
}, actor: { id: string; name: string }): Promise<MemberInvitation> {
  const email = normalizeEmail(input.email)
  if (!isValidEmail(email)) throw new Error('Enter a valid email address.')
  if (!input.fullName.trim() || input.fullName.trim().length > 120) throw new Error('Enter a name under 120 characters.')
  if (!['Soprano', 'Alto', 'Tenor', 'Bass'].includes(input.voicePart)) throw new Error('Choose a valid voice part.')
  if (!['MEMBER', 'LEADER', 'ADMIN'].includes(input.invitedRole)) throw new Error('Choose a valid account role.')
  if (input.phone && input.phone.length > 40) throw new Error('Keep the phone number under 40 characters.')
  if (input.message.length > 1000) throw new Error('Keep the invitation message under 1,000 characters.')
  if (!INVITATION_HOURS.has(input.expiryHours)) throw new Error('Choose an allowed invitation expiration period.')

  const baseUrl = appBaseUrl()
  const client = await getPgPool().connect()
  const invitationId = id()
  const token = crypto.randomBytes(32).toString('base64url')
  const tokenHash = hashToken(token)
  try {
    await client.query('BEGIN')
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`member-invitation-actor:${actor.id}`])
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`member-invitation-email:${email}`])
    await expireInvitations(client, actor)

    const existingUser = await client.query('SELECT id FROM users WHERE LOWER(email) = $1 FOR UPDATE', [email])
    if (existingUser.rowCount) throw new Error('An account already uses this email address.')
    const existingInvitation = await client.query(
      `SELECT id FROM member_invitations WHERE LOWER(email) = $1
       AND status IN ('PENDING', 'SENT', 'FAILED') FOR UPDATE`,
      [email]
    )
    if (existingInvitation.rowCount) throw new Error('An active invitation already exists for this email. Use its Resend action.')

    const emailLimit = await client.query(
      `SELECT COUNT(*)::int AS count FROM member_invitations
       WHERE LOWER(email) = $1 AND created_at >= NOW() - INTERVAL '24 hours'`, [email]
    )
    if (Number(emailLimit.rows[0].count) >= 5) throw new Error('This email has reached the invitation limit. Try again later.')
    const actorLimit = await client.query(
      `SELECT COUNT(*)::int AS count FROM audit_logs
       WHERE actor_id = $1 AND action IN ('MEMBER_INVITATION_CREATED', 'MEMBER_INVITATION_RESENT')
         AND created_at >= NOW() - INTERVAL '1 hour'`, [actor.id]
    )
    if (Number(actorLimit.rows[0].count) >= 20) throw new Error('You have reached the hourly invitation limit. Try again later.')

    const inserted = await client.query(
      `INSERT INTO member_invitations
         (id, email, full_name, phone, voice_part, invited_role, message, token_hash,
          invited_by_id, invited_by_name, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW() + ($11 * INTERVAL '1 hour'))
       RETURNING expires_at::text AS "expiresAt", created_at::text AS "createdAt"`,
      [invitationId, email, input.fullName.trim(), input.phone?.trim() || null, input.voicePart, input.invitedRole,
        input.message.trim(), tokenHash, actor.id, actor.name, input.expiryHours]
    )
    const acceptUrl = `${baseUrl}/invite/${token}`
    const expiresAt = formatExpiry(inserted.rows[0].expiresAt)
    const subject = 'You’re invited to join Grow in Jesus Choir'
    const textMessage = [
      `Hello ${input.fullName.trim()}, ${actor.name} invited you to join Grow in Jesus Choir as a ${input.invitedRole.toLowerCase()}.`,
      input.message.trim() || '',
      `Accept your invitation and choose a password: ${acceptUrl}`,
      `This link expires ${expiresAt} and can only be used once.`
    ].filter(Boolean).join('\n\n')
    const html = renderInvitationEmail({
      baseUrl, fullName: input.fullName.trim(), inviterName: actor.name, message: input.message,
      acceptUrl, expiresAt
    })
    await queueInvitationEmail(client, {
      invitationId, generation: 1, email, fullName: input.fullName.trim(), subject,
      message: textMessage, html
    })
    await audit(client, {
      actorId: actor.id, actorName: actor.name, action: 'MEMBER_INVITATION_CREATED',
      targetType: 'member_invitation', targetId: invitationId,
      details: { email, fullName: input.fullName.trim(), voicePart: input.voicePart, invitedRole: input.invitedRole, expiresAt: inserted.rows[0].expiresAt }
    })
    await client.query('COMMIT')
    return {
      id: invitationId, email, fullName: input.fullName.trim(), phone: input.phone,
      voicePart: input.voicePart, invitedRole: input.invitedRole, status: 'PENDING', invitedByName: actor.name,
      message: input.message.trim(), expiresAt: inserted.rows[0].expiresAt,
      createdAt: inserted.rows[0].createdAt, lastSentAt: null, resendCount: 0
    }
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function getMemberInvitations(limit = 100): Promise<MemberInvitation[]> {
  const client = await getPgPool().connect()
  try {
    await client.query('BEGIN')
    await expireInvitations(client)
    const result = await client.query(
      `SELECT id, email, full_name AS "fullName", phone, voice_part AS "voicePart",
              invited_role AS "invitedRole", status,
              invited_by_name AS "invitedByName", message, expires_at::text AS "expiresAt",
              created_at::text AS "createdAt", last_sent_at::text AS "lastSentAt", resend_count AS "resendCount"
       FROM member_invitations ORDER BY created_at DESC LIMIT $1`,
      [Math.min(200, Math.max(1, Math.floor(limit)))]
    )
    await client.query('COMMIT')
    return result.rows.map((row) => ({ ...row, resendCount: Number(row.resendCount) }))
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function resendMemberInvitation(invitationId: string, actor: { id: string; name: string }): Promise<boolean> {
  const baseUrl = appBaseUrl()
  const client = await getPgPool().connect()
  const token = crypto.randomBytes(32).toString('base64url')
  try {
    await client.query('BEGIN')
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`member-invitation-actor:${actor.id}`])
    await expireInvitations(client, actor)
    const result = await client.query(
      `SELECT id, email, full_name AS "fullName", message, invited_role AS "invitedRole",
              status, delivery_generation AS generation,
              resend_count AS "resendCount", last_sent_at AS "lastSentAt", updated_at AS "updatedAt",
              expires_at > NOW() AS "isUnexpired"
       FROM member_invitations WHERE id = $1 FOR UPDATE`,
      [invitationId]
    )
    if (!result.rowCount) throw new Error('Invitation not found.')
    const invitation = result.rows[0]
    if (!['PENDING', 'SENT', 'FAILED'].includes(invitation.status) || !invitation.isUnexpired) {
      throw new Error('Only active, unexpired invitations can be resent.')
    }
    if (new Date(invitation.updatedAt).getTime() > Date.now() - 60_000) throw new Error('Wait at least one minute before resending this invitation.')
    if (Number(invitation.resendCount) >= 5) throw new Error('This invitation has reached its resend limit.')
    const recent = await client.query(
      `SELECT COUNT(*)::int AS email_count FROM audit_logs
       WHERE action = 'MEMBER_INVITATION_RESENT' AND LOWER(details->>'email') = LOWER($1)
         AND created_at >= NOW() - INTERVAL '24 hours'`, [invitation.email]
    )
    if (Number(recent.rows[0].email_count) >= 5) throw new Error('This email has reached the daily resend limit.')
    const actorLimit = await client.query(
      `SELECT COUNT(*)::int AS count FROM audit_logs
       WHERE actor_id = $1 AND action IN ('MEMBER_INVITATION_CREATED', 'MEMBER_INVITATION_RESENT')
         AND created_at >= NOW() - INTERVAL '1 hour'`, [actor.id]
    )
    if (Number(actorLimit.rows[0].count) >= 20) throw new Error('You have reached the hourly invitation limit. Try again later.')

    const generation = Number(invitation.generation) + 1
    const updated = await client.query(
      `UPDATE member_invitations SET token_hash = $2, status = 'PENDING', expires_at = NOW() + INTERVAL '7 days',
          delivery_generation = $3, resend_count = resend_count + 1, last_error = NULL, failed_at = NULL,
          last_sent_at = NULL, updated_at = NOW()
       WHERE id = $1 RETURNING expires_at::text AS "expiresAt"`,
      [invitationId, hashToken(token), generation]
    )
    await client.query(
      `UPDATE email_outbox SET status = 'CANCELLED', claim_token = NULL, claimed_at = NULL
       WHERE invitation_id = $1 AND status IN ('QUEUED', 'SENDING')`,
      [invitationId]
    )
    const acceptUrl = `${baseUrl}/invite/${token}`
    const expiresAt = formatExpiry(updated.rows[0].expiresAt)
    const subject = 'Your Grow in Jesus Choir invitation'
    const textMessage = `Hello ${invitation.fullName}, ${actor.name} renewed your invitation to join Grow in Jesus Choir as a ${invitation.invitedRole.toLowerCase()}.\n\nChoose your password here: ${acceptUrl}\n\nThis link expires ${expiresAt} and can only be used once.`
    const html = renderInvitationEmail({
      baseUrl, fullName: invitation.fullName, inviterName: actor.name, message: invitation.message,
      acceptUrl, expiresAt
    })
    await queueInvitationEmail(client, {
      invitationId, generation, email: invitation.email, fullName: invitation.fullName,
      subject, message: textMessage, html
    })
    await audit(client, {
      actorId: actor.id, actorName: actor.name, action: 'MEMBER_INVITATION_RESENT',
      targetType: 'member_invitation', targetId: invitationId,
      details: { email: invitation.email, generation }
    })
    await client.query('COMMIT')
    return true
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function cancelMemberInvitation(invitationId: string, actor: { id: string; name: string }): Promise<boolean> {
  const client = await getPgPool().connect()
  try {
    await client.query('BEGIN')
    const result = await client.query(
      `UPDATE member_invitations
       SET status = 'CANCELLED', token_hash = NULL, cancelled_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND status IN ('PENDING', 'SENT', 'FAILED') AND expires_at > NOW()
       RETURNING id, email`,
      [invitationId]
    )
    if (!result.rowCount) throw new Error('This invitation is no longer cancellable.')
    await client.query(
      `UPDATE email_outbox SET status = 'CANCELLED', claim_token = NULL, claimed_at = NULL
       WHERE invitation_id = $1 AND status IN ('QUEUED', 'SENDING')`,
      [invitationId]
    )
    await audit(client, {
      actorId: actor.id, actorName: actor.name, action: 'MEMBER_INVITATION_CANCELLED',
      targetType: 'member_invitation', targetId: invitationId,
      details: { email: result.rows[0].email, result: 'CANCELLED' }
    })
    await client.query('COMMIT')
    return true
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function getPublicInvitation(tokenHash: string): Promise<{
  id: string
  email: string
  fullName: string
  voicePart: string
  invitedRole: InvitationRole
  expiresAt: string
  status: string
} | null> {
  const client = await getPgPool().connect()
  try {
    await client.query('BEGIN')
    const result = await client.query(
      `SELECT id, email, full_name AS "fullName", voice_part AS "voicePart",
              invited_role AS "invitedRole", status,
              expires_at AS "expiresAt", expires_at <= NOW() AS "isExpired",
              invited_by_id AS "invitedById", invited_by_name AS "invitedByName"
       FROM member_invitations WHERE token_hash = $1 FOR UPDATE`,
      [tokenHash]
    )
    if (!result.rowCount) {
      await client.query('COMMIT')
      return null
    }
    const invite = result.rows[0]
    if (invite.isExpired && ['PENDING', 'SENT', 'FAILED'].includes(invite.status)) {
      await client.query(
        `UPDATE member_invitations SET status = 'EXPIRED', token_hash = NULL, updated_at = NOW() WHERE id = $1`,
        [invite.id]
      )
      await client.query(
        `UPDATE email_outbox SET status = 'CANCELLED', claim_token = NULL, claimed_at = NULL
         WHERE invitation_id = $1 AND status IN ('QUEUED', 'SENDING')`, [invite.id]
      )
      await client.query(
        `UPDATE email_outbox SET status = 'CANCELLED', claim_token = NULL, claimed_at = NULL
         WHERE invitation_id = $1 AND status IN ('QUEUED', 'SENDING')`, [invite.id]
      )
      await audit(client, {
        actorId: invite.invitedById, actorName: invite.invitedByName,
        action: 'MEMBER_INVITATION_EXPIRED', targetType: 'member_invitation', targetId: invite.id,
        details: { email: invite.email, result: 'EXPIRED' }
      })
      await client.query('COMMIT')
      return { id: invite.id, email: invite.email, fullName: invite.fullName, voicePart: invite.voicePart,
        invitedRole: invite.invitedRole, expiresAt: invite.expiresAt.toISOString(), status: 'EXPIRED' }
    }
    await client.query('COMMIT')
    return {
      id: invite.id,
      email: invite.email,
      fullName: invite.fullName,
      voicePart: invite.voicePart,
      invitedRole: invite.invitedRole,
      expiresAt: invite.expiresAt.toISOString(),
      status: invite.status
    }
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function acceptMemberInvitation(input: {
  tokenHash: string
  passwordHash: string
}): Promise<User | { error: 'EXPIRED' | 'INVALID' }> {
  const client = await getPgPool().connect()
  try {
    await client.query('BEGIN')
    const result = await client.query(
      `SELECT id, email, full_name AS "fullName", phone, voice_part AS "voicePart",
              invited_role AS "invitedRole", status,
              expires_at AS "expiresAt", expires_at <= NOW() AS "isExpired",
              invited_by_id AS "invitedById", invited_by_name AS "invitedByName"
       FROM member_invitations WHERE token_hash = $1 FOR UPDATE`,
      [input.tokenHash]
    )
    if (!result.rowCount) {
      await client.query('COMMIT')
      return { error: 'INVALID' }
    }
    const invite = result.rows[0]
    if (!['PENDING', 'SENT', 'FAILED'].includes(invite.status)) {
      await client.query('COMMIT')
      return { error: 'INVALID' }
    }
    if (invite.isExpired) {
      await client.query(
        `UPDATE member_invitations SET status = 'EXPIRED', token_hash = NULL, updated_at = NOW() WHERE id = $1`,
        [invite.id]
      )
      await client.query(
        `UPDATE email_outbox SET status = 'CANCELLED', claim_token = NULL, claimed_at = NULL
         WHERE invitation_id = $1 AND status IN ('QUEUED', 'SENDING')`, [invite.id]
      )
      await audit(client, {
        actorId: invite.invitedById, actorName: invite.invitedByName,
        action: 'MEMBER_INVITATION_EXPIRED', targetType: 'member_invitation', targetId: invite.id,
        details: { email: invite.email, result: 'EXPIRED' }
      })
      await client.query('COMMIT')
      return { error: 'EXPIRED' }
    }
    const existingUser = await client.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1) FOR UPDATE', [invite.email])
    if (existingUser.rowCount) {
      await client.query('COMMIT')
      return { error: 'INVALID' }
    }
    const role = await client.query('SELECT id FROM roles WHERE name = $1', [invite.invitedRole])
    if (!role.rowCount) throw new Error(`The ${invite.invitedRole} role is not configured.`)
    const userId = id()
    const memberId = id()
    await client.query(
      `INSERT INTO users (id, email, password_hash, role_id, full_name, avatar_initials, is_active, password_changed_at)
       VALUES ($1, $2, $3, $4, $5, $6, TRUE, NOW())`,
      [userId, invite.email, input.passwordHash, role.rows[0].id, invite.fullName, avatarInitials(invite.fullName)]
    )
    await client.query(
      `INSERT INTO members (id, user_id, full_name, phone, voice_part, status)
       VALUES ($1, $2, $3, $4, $5, 'active')`,
      [memberId, userId, invite.fullName, invite.phone, invite.voicePart]
    )
    await client.query(
      `UPDATE member_invitations SET status = 'ACCEPTED', token_hash = NULL,
          accepted_at = NOW(), accepted_user_id = $2, accepted_member_id = $3, updated_at = NOW()
       WHERE id = $1`,
      [invite.id, userId, memberId]
    )
    await client.query(
      `INSERT INTO notifications (id, user_id, title, message, type, link, event_key)
       VALUES ($1, $2, 'Welcome to Grow in Jesus Choir', $4, 'success', '/dashboard', $3)
       ON CONFLICT (event_key) WHERE event_key IS NOT NULL DO NOTHING`,
       [id(), userId, `member-invitation-accepted:${invite.id}`,
         `Your ${invite.invitedRole.toLowerCase()} account is ready. Welcome to the choir workspace.`]
    )
    await audit(client, {
      actorId: userId, actorName: invite.fullName, action: 'MEMBER_INVITATION_ACCEPTED',
      targetType: 'member_invitation', targetId: invite.id,
      details: { email: invite.email, userId, memberId, invitedRole: invite.invitedRole, result: 'ACCEPTED' }
    })
    const user: User = {
      id: userId, email: invite.email, role: invite.invitedRole, fullName: invite.fullName,
      avatarInitials: avatarInitials(invite.fullName), createdAt: new Date().toISOString()
    }
    await client.query('COMMIT')
    return user
  } catch (error) {
    await client.query('ROLLBACK')
    if ((error as { code?: string })?.code === '23505') return { error: 'INVALID' }
    throw error
  } finally {
    client.release()
  }
}

export interface CommunicationAudienceItem {
  id: string
  fullName: string
  voicePart: string
  email: string
  validEmail: boolean
}

export async function getCommunicationAudience(): Promise<CommunicationAudienceItem[]> {
  const result = await getPgPool().query(
    `SELECT m.id, m.full_name AS "fullName", m.voice_part AS "voicePart", u.email
     FROM members m JOIN users u ON u.id = m.user_id
     JOIN roles r ON r.id = u.role_id
     WHERE m.status = 'active' AND u.is_active = TRUE AND r.name = 'MEMBER'
     ORDER BY m.full_name ASC`
  )
  return result.rows.map((row) => ({ ...row, validEmail: isValidEmail(row.email) }))
}

export async function createMemberCommunication(input: {
  mode: MemberCommunicationMode
  memberIds: string[]
  manualEmail: string
  manualName: string
  subject: string
  body: string
  important: boolean
  inAppNotification: boolean
}, actor: { id: string; name: string }): Promise<{ id: string; recipientCount: number; invalidCount: number }> {
  const subject = input.subject.trim()
  const body = input.body.trim()
  if (!subject || subject.length > 160) throw new Error('Enter a subject under 160 characters.')
  if (!body || body.length > 10000) throw new Error('Enter a message under 10,000 characters.')
  if (!['SINGLE_MEMBER', 'SELECTED_MEMBERS', 'ALL_MEMBERS', 'MANUAL_EMAIL'].includes(input.mode)) throw new Error('Choose a valid recipient group.')
  const memberIds = [...new Set(input.memberIds.filter((value) => typeof value === 'string' && value.length <= 100))]
  if (memberIds.length > MAX_SELECTED_MEMBER_IDS) throw new Error('Select no more than 500 members at once.')
  if (input.mode === 'SINGLE_MEMBER' && memberIds.length !== 1) throw new Error('Select one member for a single-member message.')
  if (input.mode === 'SELECTED_MEMBERS' && memberIds.length === 0) throw new Error('Select at least one member.')
  if (input.mode === 'ALL_MEMBERS' && memberIds.length > 0) throw new Error('The all-members message cannot include a client-supplied recipient list.')
  if (input.mode === 'MANUAL_EMAIL' && !isValidEmail(input.manualEmail)) throw new Error('Enter a valid recipient email address.')

  const baseUrl = appBaseUrl()
  const client = await getPgPool().connect()
  const communicationId = id()
  try {
    await client.query('BEGIN')
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [actor.id])

    let rawRecipients: Array<{ id: string | null; fullName: string; email: string; userId: string | null }> = []
    let invalidCount = 0
    if (input.mode === 'MANUAL_EMAIL') {
      rawRecipients = [{ id: null, fullName: input.manualName.trim().slice(0, 120) || 'Email recipient', email: normalizeEmail(input.manualEmail), userId: null }]
    } else {
      const audience = input.mode === 'ALL_MEMBERS'
        ? await client.query(
          `SELECT m.id, m.full_name AS "fullName", u.email, u.id AS "userId"
           FROM members m JOIN users u ON u.id = m.user_id JOIN roles r ON r.id = u.role_id
           WHERE m.status = 'active' AND u.is_active = TRUE AND r.name = 'MEMBER'
           ORDER BY m.full_name ASC LIMIT $1`,
          [MAX_COMMUNICATION_RECIPIENTS + 1]
        )
        : await client.query(
          `SELECT m.id, m.full_name AS "fullName", u.email, u.id AS "userId"
           FROM members m JOIN users u ON u.id = m.user_id JOIN roles r ON r.id = u.role_id
           WHERE m.id = ANY($1::text[]) AND m.status = 'active' AND u.is_active = TRUE AND r.name = 'MEMBER'
           ORDER BY m.full_name ASC`,
          [memberIds]
        )
      if (input.mode === 'ALL_MEMBERS' && (audience.rowCount ?? audience.rows.length) > MAX_COMMUNICATION_RECIPIENTS) {
        throw new Error(`All-member messages are limited to ${MAX_COMMUNICATION_RECIPIENTS} active accounts. Select a smaller group.`)
      }
      if (input.mode !== 'ALL_MEMBERS' && audience.rowCount !== memberIds.length) {
        throw new Error('One or more selected recipients are inactive, unavailable, or not eligible for member communication.')
      }
      const valid = audience.rows.filter((row) => isValidEmail(row.email))
      invalidCount = audience.rows.length - valid.length
      if (input.mode !== 'ALL_MEMBERS' && invalidCount) {
        throw new Error('A selected member account has an invalid email address. Correct the account before sending.')
      }
      rawRecipients = valid.map((row) => ({ id: row.id, fullName: row.fullName, email: normalizeEmail(row.email), userId: row.userId }))
    }
    const recipients = deduplicateRecipients(rawRecipients.map((recipient) => ({ ...recipient, memberId: recipient.id })))
    if (recipients.length === 0) throw new Error('There are no eligible recipients with valid email addresses.')
    if (recipients.length > MAX_COMMUNICATION_RECIPIENTS) throw new Error('Messages are limited to 500 recipients. Select a smaller group.')

    const recent = await client.query(
      `SELECT COUNT(*)::int AS total_count,
              COUNT(*) FILTER (WHERE recipients_mode = 'ALL_MEMBERS' OR recipient_count > 1)::int AS mass_count
       FROM member_communications WHERE sender_id = $1 AND created_at >= NOW() - INTERVAL '1 hour'`,
      [actor.id]
    )
    const rate = countRecipientRateLimit({
      countInLastHour: Number(recent.rows[0].total_count),
      massCountInLastHour: Number(recent.rows[0].mass_count)
    })
    if (!rate.allowed) throw new Error(rate.reason === 'mass_send_limit'
      ? 'You have reached the hourly limit for group messages.'
      : 'You have reached the hourly communication limit. Try again later.')

    await client.query(
      `INSERT INTO member_communications
         (id, sender_id, sender_name, recipients_mode, subject, body, status, in_app_notification,
          important, recipient_count, invalid_count)
       VALUES ($1, $2, $3, $4, $5, $6, 'QUEUED', $7, $8, $9, $10)`,
      [communicationId, actor.id, actor.name, input.mode, subject, body, input.inAppNotification,
        input.important, recipients.length, invalidCount]
    )
    const html = renderCommunicationEmail({ baseUrl, subject, body, senderName: actor.name, important: input.important })
    for (const recipient of recipients) {
      const recipientId = id()
      await client.query(
        `INSERT INTO member_communication_recipients
           (id, communication_id, member_id, recipient_email, recipient_name, status)
         VALUES ($1, $2, $3, $4, $5, 'QUEUED')`,
        [recipientId, communicationId, recipient.memberId, recipient.email, recipient.fullName]
      )
      await client.query(
        `INSERT INTO email_outbox
           (id, event_key, recipient_email, recipient_name, subject, message, html_content, communication_recipient_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [id(), `member-communication:${communicationId}:${recipientId}`, recipient.email,
          recipient.fullName, subject, body, html, recipientId]
      )
      if (input.inAppNotification && recipient.userId) {
        await client.query(
          `INSERT INTO notifications (id, user_id, title, message, type, link, event_key)
           VALUES ($1, $2, $3, $4, $5, '/notifications', $6)
           ON CONFLICT (event_key) WHERE event_key IS NOT NULL DO NOTHING`,
          [id(), recipient.userId, input.important ? `Important: ${subject}` : subject, body,
            input.important ? 'alert' : 'info', `communication-notification:${communicationId}:${recipient.userId}`]
        )
      }
    }
    await audit(client, {
      actorId: actor.id, actorName: actor.name, action: 'MEMBER_COMMUNICATION_CREATED',
      targetType: 'member_communication', targetId: communicationId,
      details: {
        recipientsMode: input.mode, subject, recipientCount: recipients.length,
        invalidCount, important: input.important, inAppNotification: input.inAppNotification,
        manualEmail: input.mode === 'MANUAL_EMAIL'
      }
    })
    await client.query('COMMIT')
    return { id: communicationId, recipientCount: recipients.length, invalidCount }
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function getMemberCommunications(limit = 50): Promise<MemberCommunication[]> {
  const headers = await getPgPool().query(
    `SELECT id, sender_name AS "senderName", recipients_mode AS "recipientsMode", subject, body,
            status, important, in_app_notification AS "inAppNotification", recipient_count AS "recipientCount",
            invalid_count AS "invalidCount", sent_count AS "sentCount", failed_count AS "failedCount",
            created_at::text AS "createdAt", completed_at::text AS "completedAt"
     FROM member_communications ORDER BY created_at DESC LIMIT $1`,
    [Math.min(100, Math.max(1, Math.floor(limit)))]
  )
  if (!headers.rowCount) return []
  const ids = headers.rows.map((row) => row.id)
  const recipientResult = await getPgPool().query(
    `SELECT id, communication_id AS "communicationId", member_id AS "memberId",
            recipient_email AS "recipientEmail", recipient_name AS "recipientName", status,
            sent_at::text AS "sentAt", last_error AS "lastError"
     FROM member_communication_recipients WHERE communication_id = ANY($1::text[])
     ORDER BY recipient_name ASC`,
    [ids]
  )
  const recipientMap = new Map<string, MemberCommunication['recipients']>()
  for (const row of recipientResult.rows) {
    const items = recipientMap.get(row.communicationId) || []
    items.push(row)
    recipientMap.set(row.communicationId, items)
  }
  return headers.rows.map((row) => ({
    ...row,
    recipientCount: Number(row.recipientCount), invalidCount: Number(row.invalidCount),
    sentCount: Number(row.sentCount), failedCount: Number(row.failedCount),
    recipients: recipientMap.get(row.id) || []
  }))
}
