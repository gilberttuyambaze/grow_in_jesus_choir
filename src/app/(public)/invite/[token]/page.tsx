import crypto from 'node:crypto'
import { InvitationAcceptForm } from '@/features/invitations/InvitationAcceptForm'
import { getPublicInvitation } from '@/lib/db/member-workflows'

export const dynamic = 'force-dynamic'
export const metadata = { robots: { index: false, follow: false }, referrer: 'no-referrer' as const }

export default async function AcceptInvitationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) {
    return <InvalidInvitation message="This invitation link is invalid or has already been used." />
  }
  let invitation
  try {
    invitation = await getPublicInvitation(crypto.createHash('sha256').update(token).digest('hex'))
  } catch {
    return <InvalidInvitation message="Invitation service is temporarily unavailable. Please try again later." />
  }
  if (!invitation || invitation.status === 'ACCEPTED' || invitation.status === 'CANCELLED') {
    return <InvalidInvitation message="This invitation link is invalid, cancelled, or already used." />
  }
  if (invitation.status === 'EXPIRED') {
    return <InvalidInvitation message="This invitation has expired. Ask a choir leader for a new invitation." />
  }
  const expiresAtLabel = new Intl.DateTimeFormat('en-RW', {
    timeZone: process.env.APP_TIME_ZONE?.trim() || 'Africa/Kigali',
    dateStyle: 'medium', timeStyle: 'short'
  }).format(new Date(invitation.expiresAt))
  return <InvitationAcceptForm token={token} invitation={{ ...invitation, expiresAtLabel }} />
}

function InvalidInvitation({ message }: { message: string }) {
  return <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-lg items-center justify-center p-4"><section className="glass-panel w-full rounded-3xl border border-white/80 p-6 text-center shadow-xl sm:p-8"><h1 className="text-xl font-bold text-slate-900">Invitation unavailable</h1><p className="mt-3 text-sm leading-relaxed text-slate-600">{message}</p><a href="/login" className="brand-button mt-5 inline-flex rounded-xl px-5 py-3 text-xs font-bold text-white">Go to sign in</a></section></main>
}
