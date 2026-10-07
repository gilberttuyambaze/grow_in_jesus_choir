import 'server-only'

import crypto from 'node:crypto'
import { getPgPool } from '@/lib/db'

export interface BrevoOutboxDeliveryResult {
  configured: boolean
  sent: number
  attempted: number
  failed: number
}

const DELIVERY_CONCURRENCY = 5

export async function deliverBrevoOutbox(limit = 25): Promise<BrevoOutboxDeliveryResult> {
  const apiKey = process.env.BREVO_API_KEY?.trim()
  const senderEmail = process.env.BREVO_SENDER_EMAIL?.trim()
  if (!apiKey || !senderEmail) return { configured: false, sent: 0, attempted: 0, failed: 0 }
  const senderName = process.env.BREVO_SENDER_NAME?.trim() || 'Grow in Jesus Choir'
  const bounded = Math.min(100, Math.max(1, Math.floor(Number.isFinite(limit) ? limit : 25)))
  const claimToken = crypto.randomUUID()
  const client = await getPgPool().connect()
  let messages: any[] = []
  try {
    await client.query('BEGIN')
    const expired = await client.query(
      `UPDATE member_invitations
       SET status = 'EXPIRED', token_hash = NULL, updated_at = NOW()
       WHERE status IN ('PENDING', 'SENT', 'FAILED') AND expires_at <= NOW()
       RETURNING id, email, invited_by_id AS "invitedById", invited_by_name AS "invitedByName"`
    )
    for (const invitation of expired.rows) {
      await client.query(
        `UPDATE email_outbox SET status = 'CANCELLED', claim_token = NULL, claimed_at = NULL
         WHERE invitation_id = $1 AND status IN ('QUEUED', 'SENDING')`, [invitation.id]
      )
      await client.query(
        `INSERT INTO audit_logs (id, actor_id, actor_name, action, target_type, target_id, details)
         VALUES ($1, $2, $3, 'MEMBER_INVITATION_EXPIRED', 'member_invitation', $4, $5::jsonb)`,
        [crypto.randomUUID(), invitation.invitedById, invitation.invitedByName, invitation.id,
          JSON.stringify({ email: invitation.email, result: 'EXPIRED' })]
      )
    }
    const claimed = await client.query(
      `WITH available AS (
         SELECT id FROM email_outbox
         WHERE (status = 'QUEUED' OR (status = 'SENDING' AND claimed_at < NOW() - INTERVAL '10 minutes'))
           AND attempt_count < 8
           AND (invitation_id IS NULL OR EXISTS (
             SELECT 1 FROM member_invitations i
             WHERE i.id = email_outbox.invitation_id
               AND i.delivery_generation = email_outbox.invitation_generation
               AND i.status IN ('PENDING', 'SENT', 'FAILED') AND i.expires_at > NOW()
           ))
         ORDER BY created_at ASC
         FOR UPDATE SKIP LOCKED
         LIMIT $1
       )
       UPDATE email_outbox e
       SET status = 'SENDING', claim_token = $2, claimed_at = NOW(), attempt_count = attempt_count + 1
       FROM available a
       WHERE e.id = a.id
       RETURNING e.id, e.recipient_email AS "recipientEmail", e.recipient_name AS "recipientName",
                 e.subject, e.message, e.html_content AS "htmlContent", e.attempt_count AS "attemptCount",
                 e.invitation_id AS "invitationId", e.invitation_generation AS "invitationGeneration",
                 e.communication_recipient_id AS "communicationRecipientId"`,
      [bounded, claimToken]
    )
    messages = claimed.rows
    await client.query(
      `UPDATE member_communication_recipients r SET status = 'SENDING'
       FROM email_outbox e
       WHERE e.claim_token = $1 AND e.communication_recipient_id = r.id`,
      [claimToken]
    )
    await client.query(
      `UPDATE member_communications c SET status = 'SENDING', updated_at = NOW()
       WHERE c.status = 'QUEUED' AND EXISTS (
         SELECT 1 FROM member_communication_recipients r
         WHERE r.communication_id = c.id AND r.status = 'SENDING'
       )`,
    )
    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }

  let sent = 0
  let failed = 0
  for (let offset = 0; offset < messages.length; offset += DELIVERY_CONCURRENCY) {
    const batch = messages.slice(offset, offset + DELIVERY_CONCURRENCY)
    const results = await Promise.allSettled(batch.map(async (message) => {
      try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            accept: 'application/json',
            'api-key': apiKey,
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            sender: { name: senderName, email: senderEmail },
            to: [{ email: message.recipientEmail, name: message.recipientName }],
            subject: message.subject,
            textContent: message.message,
            ...(message.htmlContent ? { htmlContent: message.htmlContent } : {})
          }),
          signal: AbortSignal.timeout(12_000)
        })
        if (!response.ok) {
          const body = (await response.text()).slice(0, 500)
          throw new Error(`Brevo returned HTTP ${response.status}: ${body}`)
        }
        await finalizeOutboxDelivery(message, claimToken, true)
        return true
      } catch (error) {
        const description = error instanceof Error ? error.message.slice(0, 500) : 'Unknown email delivery error.'
        await finalizeOutboxDelivery(message, claimToken, false, description)
        return false
      }
    }))
    sent += results.filter((result) => result.status === 'fulfilled' && result.value).length
    failed += results.filter((result) => result.status === 'fulfilled' && !result.value).length
  }
  return { configured: true, sent, attempted: messages.length, failed }
}

async function finalizeOutboxDelivery(
  message: any,
  claimToken: string,
  succeeded: boolean,
  errorMessage = ''
): Promise<void> {
  const client = await getPgPool().connect()
  try {
    await client.query('BEGIN')
    if (succeeded) {
      const outbox = await client.query(
        `UPDATE email_outbox SET status = 'SENT', sent_at = NOW(), claim_token = NULL,
            claimed_at = NULL, last_error = NULL
         WHERE id = $1 AND claim_token = $2 RETURNING id`,
        [message.id, claimToken]
      )
      if (!outbox.rowCount) {
        await client.query('COMMIT')
        return
      }
      if (message.invitationId) {
        const invitation = await client.query(
          `UPDATE member_invitations SET status = 'SENT', last_sent_at = NOW(), last_error = NULL,
              failed_at = NULL, updated_at = NOW()
           WHERE id = $1 AND delivery_generation = $2 AND token_hash IS NOT NULL
             AND status IN ('PENDING', 'FAILED') AND expires_at > NOW()
           RETURNING id, email, invited_by_id AS "invitedById", invited_by_name AS "invitedByName"`,
          [message.invitationId, message.invitationGeneration]
        )
        if (invitation.rowCount) {
          await client.query(
            `INSERT INTO audit_logs (id, actor_id, actor_name, action, target_type, target_id, details)
             VALUES ($1, $2, 'Brevo email service', 'MEMBER_INVITATION_SENT', 'member_invitation', $3, $4::jsonb)`,
            [crypto.randomUUID(), invitation.rows[0].invitedById, invitation.rows[0].id,
              JSON.stringify({ email: invitation.rows[0].email, generation: message.invitationGeneration, result: 'SENT' })]
          )
        }
      }
      if (message.communicationRecipientId) {
        await client.query(
          `UPDATE member_communication_recipients SET status = 'SENT', sent_at = NOW(), last_error = NULL
           WHERE id = $1`,
          [message.communicationRecipientId]
        )
        await refreshCommunicationStatus(client, message.communicationId || await getCommunicationId(client, message.communicationRecipientId))
      }
    } else {
      const terminal = Number(message.attemptCount) >= 8
      const state = terminal ? 'FAILED' : 'QUEUED'
      const outbox = await client.query(
        `UPDATE email_outbox SET status = $3, claim_token = NULL, claimed_at = NULL,
            last_error = $4 WHERE id = $1 AND claim_token = $2 RETURNING id`,
        [message.id, claimToken, state, errorMessage]
      )
      if (!outbox.rowCount) {
        await client.query('COMMIT')
        return
      }
      if (terminal && message.invitationId) {
        const invitation = await client.query(
          `UPDATE member_invitations SET status = 'FAILED', failed_at = NOW(), last_error = $3, updated_at = NOW()
           WHERE id = $1 AND delivery_generation = $2 AND token_hash IS NOT NULL
             AND status IN ('PENDING', 'SENT', 'FAILED')
           RETURNING id, email, invited_by_id AS "invitedById", invited_by_name AS "invitedByName"`,
          [message.invitationId, message.invitationGeneration, errorMessage]
        )
        if (invitation.rowCount) {
          await client.query(
            `INSERT INTO audit_logs (id, actor_id, actor_name, action, target_type, target_id, details)
             VALUES ($1, $2, 'Brevo email service', 'MEMBER_INVITATION_FAILED', 'member_invitation', $3, $4::jsonb)`,
            [crypto.randomUUID(), invitation.rows[0].invitedById, invitation.rows[0].id,
              JSON.stringify({ email: invitation.rows[0].email, generation: message.invitationGeneration, result: 'FAILED' })]
          )
        }
      }
      if (message.communicationRecipientId) {
        await client.query(
          `UPDATE member_communication_recipients SET status = $2, last_error = $3
           WHERE id = $1`,
          [message.communicationRecipientId, state, errorMessage]
        )
        const communicationId = message.communicationId || await getCommunicationId(client, message.communicationRecipientId)
        if (communicationId) await refreshCommunicationStatus(client, communicationId)
      }
    }
    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

async function getCommunicationId(client: any, recipientId: string): Promise<string | null> {
  const result = await client.query(
    `SELECT communication_id AS id FROM member_communication_recipients WHERE id = $1`,
    [recipientId]
  )
  return result.rows[0]?.id || null
}

async function refreshCommunicationStatus(client: any, communicationId: string | null): Promise<void> {
  if (!communicationId) return
  const before = await client.query(`SELECT status FROM member_communications WHERE id = $1 FOR UPDATE`, [communicationId])
  if (!before.rowCount) return
  const counts = await client.query(
    `SELECT COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE status = 'SENT')::int AS sent,
            COUNT(*) FILTER (WHERE status = 'FAILED')::int AS failed,
            COUNT(*) FILTER (WHERE status IN ('QUEUED', 'SENDING'))::int AS pending,
            COUNT(*) FILTER (WHERE status = 'SENDING')::int AS sending
     FROM member_communication_recipients WHERE communication_id = $1`,
    [communicationId]
  )
  const row = counts.rows[0]
  const status = Number(row.pending) > 0
    ? Number(row.sending) > 0 || Number(row.sent) > 0 ? 'SENDING' : 'QUEUED'
    : Number(row.failed) === 0 ? 'SENT' : Number(row.sent) > 0 ? 'PARTIAL' : 'FAILED'
  const updated = await client.query(
    `UPDATE member_communications SET status = $2, sent_count = $3, failed_count = $4,
        completed_at = CASE WHEN $5 = 0 THEN COALESCE(completed_at, NOW()) ELSE NULL END,
        updated_at = NOW() WHERE id = $1
     RETURNING sender_id AS "senderId", sender_name AS "senderName", subject, recipients_mode AS "recipientsMode"`,
    [communicationId, status, row.sent, row.failed, row.pending]
  )
  if (row.pending === 0 && !['SENT', 'PARTIAL', 'FAILED'].includes(before.rows[0].status)) {
    await client.query(
      `INSERT INTO audit_logs (id, actor_id, actor_name, action, target_type, target_id, details)
       VALUES ($1, $2, 'Brevo email service', $3, 'member_communication', $4, $5::jsonb)`,
      [crypto.randomUUID(), updated.rows[0].senderId,
        status === 'SENT' ? 'MEMBER_COMMUNICATION_SENT' : status === 'PARTIAL' ? 'MEMBER_COMMUNICATION_PARTIAL' : 'MEMBER_COMMUNICATION_FAILED',
        communicationId,
        JSON.stringify({ recipientsMode: updated.rows[0].recipientsMode, subject: updated.rows[0].subject,
          recipientCount: Number(row.total), sentCount: Number(row.sent), failedCount: Number(row.failed), status })]
    )
  }
}
