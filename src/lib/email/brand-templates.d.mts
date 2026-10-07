export function escapeHtml(value: unknown): string
export function renderInvitationEmail(input: {
  fullName: string
  inviterName: string
  message?: string
  acceptUrl: string
  expiresAt: string
}): string
export function renderCommunicationEmail(input: {
  subject: string
  body: string
  senderName: string
  important: boolean
}): string
