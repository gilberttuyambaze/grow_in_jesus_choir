'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Clock3, MailPlus, RefreshCw, Send, ShieldCheck, UserRoundPlus, X, LoaderCircle } from 'lucide-react'
import { MemberInvitation } from '@/types'
import { cancelMemberInvitationAction, createMemberInvitationAction, resendMemberInvitationAction } from './actions'
import { formatSessionDateTime } from '@/lib/utils/zoned-time'

const voiceParts = ['Soprano', 'Alto', 'Tenor', 'Bass'] as const

function StatusBadge({ status }: { status: MemberInvitation['status'] }) {
  const styles: Record<MemberInvitation['status'], string> = {
    PENDING: 'bg-amber-50 text-amber-700', SENT: 'bg-cyan-50 text-cyan-700',
    ACCEPTED: 'bg-emerald-50 text-emerald-700', EXPIRED: 'bg-slate-100 text-slate-600',
    CANCELLED: 'bg-rose-50 text-rose-700', FAILED: 'bg-orange-50 text-orange-700'
  }
  return <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${styles[status]}`}>{status}</span>
}

export function InvitationsView({ invitations }: { invitations: MemberInvitation[] }) {
  const router = useRouter()
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState('')
  const [message, setMessage] = React.useState('')
  const [activeId, setActiveId] = React.useState('')
  const [activeAction, setActiveAction] = React.useState<'create' | 'resend' | 'cancel' | null>(null)
  const busyLock = React.useRef(false)

  async function run(action: () => Promise<{ success: boolean; error?: string; message?: string }>) {
    if (busyLock.current) return
    busyLock.current = true
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const result = await action()
      if (!result.success) setError(result.error || 'The invitation could not be updated.')
      else {
        setMessage(result.message || 'Invitation updated.')
        router.refresh()
      }
    } catch {
      setError('The invitation could not be updated. Please try again.')
    } finally {
      busyLock.current = false
      setBusy(false)
      setActiveId('')
      setActiveAction(null)
    }
  }

  async function create(formData: FormData) {
    if (busyLock.current) return
    busyLock.current = true
    setActiveAction('create')
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const result = await createMemberInvitationAction(formData)
      if (!result.success) setError(result.error || 'Could not create this invitation.')
      else {
        setMessage(result.message || 'Invitation saved.')
        const form = document.getElementById('member-invitation-form') as HTMLFormElement | null
        form?.reset()
        router.refresh()
      }
    } catch {
      setError('Could not create this invitation. Please try again.')
    } finally {
      busyLock.current = false
      setBusy(false)
      setActiveAction(null)
    }
  }

  return <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Member invitations</h1>
      <p className="mt-1 text-xs leading-relaxed text-slate-500 sm:text-sm">Invite a new choir member to create a password and activate their own account. Invitations always create the Member role.</p>
    </div>

    {(error || message) && <div role={error ? 'alert' : 'status'} className={`rounded-xl border px-4 py-3 text-sm ${error ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>{error || message}</div>}

    <section className="card-surface grid gap-5 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_260px]">
      <div>
        <div className="mb-4 flex items-center gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700"><UserRoundPlus className="h-4 w-4" /></span><div><h2 className="text-sm font-bold text-slate-900">Invite a member</h2><p className="text-[11px] text-slate-500">Name, email, and voice part are required.</p></div></div>
        <form id="member-invitation-form" action={create} className="grid gap-3 sm:grid-cols-2">
          <div><label htmlFor="invite-name" className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">Full name</label><input id="invite-name" name="fullName" required maxLength={120} autoComplete="name" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100" /></div>
          <div><label htmlFor="invite-email" className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">Email address</label><input id="invite-email" name="email" type="email" required maxLength={254} autoComplete="email" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100" /></div>
          <div><label htmlFor="invite-phone" className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">Phone (optional)</label><input id="invite-phone" name="phone" type="tel" maxLength={40} autoComplete="tel" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100" /></div>
          <div><label htmlFor="invite-voice" className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">Voice part</label><select id="invite-voice" name="voicePart" required defaultValue="Soprano" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100">{voiceParts.map((part) => <option key={part}>{part}</option>)}</select></div>
          <div><label htmlFor="invite-expiry" className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">Link expires in</label><select id="invite-expiry" name="expiryHours" defaultValue="168" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"><option value="24">1 day</option><option value="72">3 days</option><option value="168">7 days</option><option value="336">14 days</option></select></div>
          <div className="sm:col-span-2"><label htmlFor="invite-message" className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">Personal note (optional)</label><textarea id="invite-message" name="message" maxLength={1000} rows={3} className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100" placeholder="Add a short welcome message" /></div>
          <div className="flex flex-col gap-3 border-t border-slate-100 pt-3 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between"><p className="flex items-center gap-2 text-[11px] text-slate-500"><ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />Invite links are single-use and stored as token hashes.</p><button disabled={busy} aria-busy={activeAction === 'create'} className="brand-button inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-white disabled:cursor-wait disabled:opacity-60">{busy && activeAction === 'create' ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <MailPlus className="h-4 w-4" />}{busy && activeAction === 'create' ? 'Creating invitation…' : 'Create invitation'}</button></div>
        </form>
      </div>
      <aside className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 text-xs leading-relaxed text-slate-600"><h3 className="font-bold text-slate-900">How the invite works</h3><ol className="mt-2 list-decimal space-y-1.5 pl-4"><li>The invite is saved in PostgreSQL.</li><li>Brevo sends a branded email with a time-limited link.</li><li>The recipient chooses a password and receives a Member account.</li><li>The invite is consumed and audited in the same transaction.</li></ol><p className="mt-3 text-[10px] text-slate-500">Delivery is marked SENT when Brevo accepts the message; inbox delivery is not confirmed without a provider webhook.</p></aside>
    </section>

    <section className="card-surface min-w-0 p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3"><div><h2 className="text-sm font-bold text-slate-900">Invitation history</h2><p className="mt-1 text-[11px] text-slate-500">Tokens are never displayed. Resending rotates the token and invalidates earlier links.</p></div><span className="text-xs text-slate-400">{invitations.length} shown</span></div>
      {invitations.length === 0 ? <div className="rounded-xl bg-slate-50 p-5 text-center text-xs text-slate-500">No invitations yet.</div> : <div className="space-y-2">{invitations.map((invite) => {
        const canResend = ['PENDING', 'SENT', 'FAILED'].includes(invite.status)
        const isBusy = busy && activeId === invite.id
        return <div key={invite.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 sm:flex-row sm:items-center sm:justify-between sm:p-4">
          <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><strong className="text-xs text-slate-900">{invite.fullName}</strong><StatusBadge status={invite.status} /></div><p className="mt-1 break-all text-xs text-slate-600">{invite.email}</p><p className="mt-1 text-[10px] text-slate-400">{invite.voicePart} · Expires {formatSessionDateTime(invite.expiresAt)}{invite.lastSentAt ? ` · Email accepted ${formatSessionDateTime(invite.lastSentAt)}` : ''}{invite.resendCount ? ` · Resent ${invite.resendCount}×` : ''}</p></div>
          {(canResend || invite.status === 'PENDING' || invite.status === 'SENT' || invite.status === 'FAILED') && <div className="flex shrink-0 gap-2"><button type="button" onClick={() => { setActiveId(invite.id); setActiveAction('resend'); void run(() => resendMemberInvitationAction(invite.id)) }} disabled={busy || !canResend} aria-busy={isBusy && activeAction === 'resend'} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-indigo-200 bg-white px-3 py-2 text-[11px] font-bold text-indigo-700 hover:bg-indigo-50 disabled:cursor-wait disabled:opacity-50">{isBusy && activeAction === 'resend' ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}{isBusy && activeAction === 'resend' ? 'Resending…' : 'Resend'}</button><button type="button" onClick={() => { if (!window.confirm(`Cancel the invitation for ${invite.email}? Its link will stop working.`)) return; setActiveId(invite.id); setActiveAction('cancel'); void run(() => cancelMemberInvitationAction(invite.id)) }} disabled={busy || !canResend} aria-busy={isBusy && activeAction === 'cancel'} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 py-2 text-[11px] font-bold text-rose-700 hover:bg-rose-50 disabled:cursor-wait disabled:opacity-50">{isBusy && activeAction === 'cancel' ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}{isBusy && activeAction === 'cancel' ? 'Cancelling…' : 'Cancel'}</button></div>}
        </div>
      })}</div>}
    </section>
  </div>
}
