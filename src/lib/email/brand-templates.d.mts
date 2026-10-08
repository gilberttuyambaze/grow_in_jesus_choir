export function escapeHtml(value: unknown): string
export function renderInvitationEmail(input: {
  baseUrl: string
  fullName: string
  inviterName: string
  message?: string
  acceptUrl: string
  expiresAt: string
}): string
export function renderCommunicationEmail(input: {
  baseUrl: string
  subject: string
  body: string
  senderName: string
  important: boolean
}): string
