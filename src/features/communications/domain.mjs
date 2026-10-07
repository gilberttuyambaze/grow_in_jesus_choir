export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const INVITATION_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/

export function canManageMemberCommunication(role) {
  return role === 'LEADER' || role === 'ADMIN'
}

export function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
}

export function isValidEmail(email) {
  const normalized = normalizeEmail(email)
  return normalized.length <= 254 && EMAIL_PATTERN.test(normalized)
}

export function isInvitationAcceptable(status, expiresAt, now = Date.now()) {
  return ['PENDING', 'SENT', 'FAILED'].includes(status) &&
    Number.isFinite(new Date(expiresAt).getTime()) &&
    new Date(expiresAt).getTime() > Number(now)
}

export function deduplicateRecipients(recipients) {
  const seen = new Set()
  return recipients.filter((recipient) => {
    const email = normalizeEmail(recipient.email)
    if (!isValidEmail(email) || seen.has(email)) return false
    seen.add(email)
    return true
  })
}

export function countRecipientRateLimit({ countInLastHour, massCountInLastHour }) {
  return {
    allowed: Number(countInLastHour) < 20 && Number(massCountInLastHour) < 3,
    reason: Number(countInLastHour) >= 20
      ? 'hourly_limit'
      : Number(massCountInLastHour) >= 3
        ? 'mass_send_limit'
        : null
  }
}
