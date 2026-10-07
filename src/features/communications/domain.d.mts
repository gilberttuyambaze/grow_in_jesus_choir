export const EMAIL_PATTERN: RegExp
export const INVITATION_TOKEN_PATTERN: RegExp
export function canManageMemberCommunication(role: string): boolean
export function normalizeEmail(email: unknown): string
export function isValidEmail(email: unknown): boolean
export function isInvitationAcceptable(status: string, expiresAt: string | Date, now?: number): boolean
export function deduplicateRecipients<T extends { email: string }>(recipients: T[]): T[]
export function countRecipientRateLimit(input: { countInLastHour: number; massCountInLastHour: number }): {
  allowed: boolean
  reason: 'hourly_limit' | 'mass_send_limit' | null
}
