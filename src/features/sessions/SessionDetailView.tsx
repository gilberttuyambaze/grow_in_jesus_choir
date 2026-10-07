'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CalendarClock, Check, CheckCircle2, CircleDollarSign, Clock3, LockKeyhole, MapPin, QrCode, RefreshCw, UserRoundCheck, Users, XCircle, LoaderCircle } from 'lucide-react'
import { ChoirSession, FinancialCategory, SessionOverview, UserRole } from '@/types'
import { canManageMembers } from '@/lib/permissions'
import { formatCurrency } from '@/lib/utils/currency'
import { formatSessionDateTime } from '@/lib/utils/zoned-time'
import {
  closeSessionAction,
  openSessionAction,
  publishSessionAction,
  rotateSessionQrAction,
  submitContributionAction
} from '@/features/sessions/actions'
import { SessionForm } from './SessionForm'
import { QRCode } from './QRCode'

interface SessionDetailViewProps {
  overview: SessionOverview
  userRole: UserRole
  categories: FinancialCategory[]
}

function StatusPill({ value }: { value: string }) {
  const styles: Record<string, string> = {
    PRESENT: 'bg-emerald-50 text-emerald-700',
    LATE: 'bg-amber-50 text-amber-700',
    ABSENT: 'bg-rose-50 text-rose-700',
    NOT_CHECKED_IN: 'bg-slate-100 text-slate-500',
    COMPLETED: 'bg-emerald-50 text-emerald-700',
    PARTIAL: 'bg-indigo-50 text-indigo-700',
    CONTRIBUTED: 'bg-cyan-50 text-cyan-700',
    PENDING: 'bg-amber-50 text-amber-700',
    REJECTED: 'bg-rose-50 text-rose-700',
    NOT_YET: 'bg-slate-100 text-slate-500',
    recorded: 'bg-emerald-50 text-emerald-700',
    needs_review: 'bg-amber-50 text-amber-700',
    rejected: 'bg-rose-50 text-rose-700',
    voided: 'bg-slate-100 text-slate-500'
  }
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide ${styles[value] || 'bg-slate-100 text-slate-600'}`}>{value.replaceAll('_', ' ').toLowerCase()}</span>
}

function Metric({ label, value, hint, tone = 'slate' }: { label: string; value: string | number; hint?: string; tone?: 'slate' | 'green' | 'amber' | 'indigo' | 'rose' }) {
  const styles = {
    slate: 'bg-white/80 border-slate-200 text-slate-900',
    green: 'bg-emerald-50/65 border-emerald-100 text-emerald-800',
    amber: 'bg-amber-50/65 border-amber-100 text-amber-800',
    indigo: 'bg-indigo-50/65 border-indigo-100 text-indigo-800',
    rose: 'bg-rose-50/65 border-rose-100 text-rose-800'
  }
  return <div className={`rounded-2xl border p-3.5 ${styles[tone]}`}><span className="block text-[10px] font-bold uppercase tracking-wide opacity-70">{label}</span><strong className="mt-1 block truncate text-lg">{value}</strong>{hint && <span className="mt-0.5 block truncate text-[10px] opacity-70">{hint}</span>}</div>
}

export function SessionDetailView({ overview, userRole, categories }: SessionDetailViewProps) {
  const { session } = overview
  const router = useRouter()
  const canManage = canManageMembers(userRole)
  const [busy, setBusy] = React.useState(false)
  const [busyAction, setBusyAction] = React.useState<'schedule' | 'open' | 'qr' | 'close' | 'contribution' | null>(null)
  const busyLock = React.useRef(false)
  const [error, setError] = React.useState('')
  const [message, setMessage] = React.useState('')
  const [qrToken, setQrToken] = React.useState('')
  const [origin, setOrigin] = React.useState('')
  const [showEdit, setShowEdit] = React.useState(false)
  const [confirmClose, setConfirmClose] = React.useState(false)
  const [amount, setAmount] = React.useState('')
  const [note, setNote] = React.useState('')
  const [requestKey, setRequestKey] = React.useState(() => crypto.randomUUID())
  const [contributionError, setContributionError] = React.useState('')

  React.useEffect(() => setOrigin(window.location.origin), [])

  async function runAction(actionName: 'schedule' | 'open' | 'qr' | 'close', action: () => Promise<{ success: boolean; error?: string; message?: string; qrToken?: string | null }>) {
    if (busyLock.current) return
    busyLock.current = true
    setBusy(true)
    setBusyAction(actionName)
    setError('')
    setMessage('')
    try {
      const result = await action()
      if (!result.success) {
        setError(result.error || 'The session could not be updated.')
        return
      }
      if (result.qrToken) setQrToken(result.qrToken)
      if (result.message) setMessage(result.message)
      router.refresh()
    } catch {
      setError('The session could not be updated. Please try again.')
    } finally {
      busyLock.current = false
      setBusy(false)
      setBusyAction(null)
    }
  }

  async function submitContribution(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busyLock.current) return
    busyLock.current = true
    setContributionError('')
    setBusy(true)
    setBusyAction('contribution')
    try {
      const result = await submitContributionAction({ sessionId: session.id, amount, requestKey, note })
      if (!result.success) {
        setContributionError(result.error || 'Could not submit your contribution.')
        return
      }
      setMessage(result.message || 'Contribution submitted for review.')
      setAmount('')
      setNote('')
      setRequestKey(crypto.randomUUID())
      router.refresh()
    } catch {
      setContributionError('Could not submit your contribution. Please try again.')
    } finally {
      busyLock.current = false
      setBusy(false)
      setBusyAction(null)
    }
  }

  const qrUrl = qrToken && origin
    ? `${origin}/s/${encodeURIComponent(session.id)}/${encodeURIComponent(qrToken)}`
    : ''
  const ownRow = overview.roster[0]
  const isAuthenticatedMember = userRole !== 'AUDITOR'

  return (
    <div className="space-y-5">
      <Link href="/sessions" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-indigo-700"><ArrowLeft className="h-4 w-4" /> All sessions</Link>
      <section className="relative overflow-hidden rounded-[28px] border border-white/80 bg-gradient-to-br from-white/90 via-indigo-50/45 to-cyan-50/50 p-5 shadow-[0_18px_55px_rgba(68,75,130,0.08)] sm:p-7">
        <div className="pointer-events-none absolute -right-14 -top-24 h-56 w-56 rotate-45 border border-white/90" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-indigo-700">{session.type.toLowerCase()}</span>
              <StatusPill value={session.status} />
              <span className="inline-flex items-center gap-1 rounded-full bg-white/75 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-slate-500"><LockKeyhole className="h-3 w-3" /> {session.visibility.toLowerCase()}</span>
            </div>
            <h1 className="break-words text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{session.title}</h1>
            {session.description && <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">{session.description}</p>}
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
              {session.location && <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {session.location}</span>}
              <span className="inline-flex items-center gap-1.5"><CalendarClock className="h-3.5 w-3.5" /> {formatSessionDateTime(session.startsAt)} – {formatSessionDateTime(session.endsAt)}</span>
            </div>
            <p className="mt-2 text-[11px] text-slate-400">{session.type === 'ATTENDANCE' ? 'Last accepted check-in' : 'Contribution deadline'}: {formatSessionDateTime(session.deadlineAt)}</p>
          </div>
          {canManage && <div className="relative flex flex-wrap gap-2 lg:max-w-[300px] lg:justify-end">
            {(session.status === 'DRAFT' || session.status === 'SCHEDULED') && <button disabled={busy} onClick={() => setShowEdit(true)} className="rounded-xl border border-slate-200 bg-white/80 px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-white disabled:opacity-50">Edit details</button>}
            {session.status === 'DRAFT' && <button disabled={busy} aria-busy={busyAction === 'schedule'} onClick={() => void runAction('schedule', () => publishSessionAction(session.id))} className="inline-flex items-center gap-2 brand-button rounded-xl px-4 py-2.5 text-xs font-bold text-white disabled:cursor-wait disabled:opacity-60">{busyAction === 'schedule' && <LoaderCircle className="h-3.5 w-3.5 animate-spin" />}{busyAction === 'schedule' ? 'Scheduling…' : 'Schedule session'}</button>}
            {session.status === 'SCHEDULED' && <button disabled={busy} aria-busy={busyAction === 'open'} onClick={() => void runAction('open', () => openSessionAction(session.id))} className="inline-flex items-center gap-2 brand-button rounded-xl px-4 py-2.5 text-xs font-bold text-white disabled:cursor-wait disabled:opacity-60">{busyAction === 'open' && <LoaderCircle className="h-3.5 w-3.5 animate-spin" />}{busyAction === 'open' ? 'Opening…' : 'Open session'}</button>}
            {session.status === 'OPEN' && <button disabled={busy} onClick={() => setConfirmClose(true)} className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-60">Close session</button>}
          </div>}
        </div>
        {(error || message) && <div className={`relative mt-4 rounded-xl border px-3.5 py-3 text-xs ${error ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>{error || message}</div>}
      </section>

      {session.type === 'ATTENDANCE' ? (
        <>
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <Metric label="Total members" value={overview.totalMembers} tone="slate" />
            <Metric label="Present" value={overview.presentCount} tone="green" />
            <Metric label="Late" value={overview.lateCount} tone="amber" />
            <Metric label="Absent" value={overview.absentCount} tone="rose" />
            <Metric label="Not checked" value={overview.notCheckedInCount} hint={session.status === 'COMPLETED' ? 'Session finalized' : 'Not absent until closed'} tone="indigo" />
          </section>

          {canManage && session.status === 'OPEN' && (
            <section className="card-surface grid gap-5 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div>
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900"><QrCode className="h-4 w-4 text-indigo-600" /> Attendance QR</div>
                <p className="mt-1 max-w-xl text-xs leading-relaxed text-slate-500">Members must sign in to their own accounts before scanning. The QR identifies this session only; it cannot check in another member.</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button disabled={busy} aria-busy={busyAction === 'qr'} onClick={() => void runAction('qr', () => rotateSessionQrAction(session.id))} className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-white px-3.5 py-2.5 text-xs font-bold text-indigo-700 hover:bg-indigo-50 disabled:cursor-wait disabled:opacity-60">{busyAction === 'qr' ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} {busyAction === 'qr' ? 'Updating QR…' : qrToken ? 'Rotate QR code' : 'Generate QR code'}</button>
                  {qrToken && <span className="self-center text-[10px] text-slate-400">Rotating immediately invalidates the previous QR code.</span>}
                </div>
              </div>
              {qrUrl && <div className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-4">
                <QRCode value={qrUrl} size={224} />
                <span className="mt-2 text-[10px] font-semibold text-slate-500">{session.title}</span>
              </div>}
            </section>
          )}

          {userRole === 'MEMBER' && ownRow && ownRow.attendanceStatus && <section className="card-surface flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5">
            <div><h2 className="text-sm font-bold text-slate-900">Your attendance</h2><p className="mt-1 text-xs text-slate-500">{ownRow.checkedInAt ? formatSessionDateTime(ownRow.checkedInAt) : session.status === 'COMPLETED' ? 'No check-in was recorded before the session closed.' : 'No check-in recorded yet.'}</p></div>
            <StatusPill value={ownRow.attendanceStatus} />
            <div className="w-full border-t border-slate-100 pt-3 text-xs text-slate-600 sm:w-auto sm:border-0 sm:pt-0">Penalty: {ownRow.penaltyAmount ? `${formatCurrency(ownRow.penaltyAmount)} · ${ownRow.penaltyStatus || 'pending'}` : 'None'}</div>
          </section>}

          <section className="card-surface min-w-0 p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3"><div><h2 className="text-sm font-bold text-slate-900">Attendance roster</h2><p className="mt-0.5 text-[11px] text-slate-500">Unconfirmed members remain “Not checked” until the session is finalized.</p></div><span className="text-xs font-semibold text-slate-400">{canManage ? overview.roster.length : ownRow ? 1 : 0} shown</span></div>
            {overview.roster.length === 0 ? <p className="rounded-xl bg-slate-50 p-4 text-xs text-slate-500">Your attendance details will appear here when your account is linked to a session roster.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[600px] text-left text-xs"><thead><tr className="text-[10px] uppercase tracking-wide text-slate-400"><th className="pb-2 font-bold">Member</th><th className="pb-2 font-bold">Voice part</th><th className="pb-2 font-bold">Attendance</th><th className="pb-2 font-bold">Check-in time</th><th className="pb-2 font-bold">Penalty</th></tr></thead><tbody className="divide-y divide-slate-100">{overview.roster.map((entry) => <tr key={entry.memberId}><td className="py-3 pr-3 font-semibold text-slate-800">{entry.memberName}</td><td className="py-3 pr-3 text-slate-500">{entry.voicePart}</td><td className="py-3 pr-3"><StatusPill value={entry.attendanceStatus || 'NOT_CHECKED_IN'} /></td><td className="py-3 pr-3 text-slate-500">{entry.checkedInAt ? formatSessionDateTime(entry.checkedInAt) : '—'}</td><td className="py-3 text-slate-600">{entry.penaltyAmount > 0 ? <>{formatCurrency(entry.penaltyAmount)} <StatusPill value={entry.penaltyStatus || 'needs_review'} /></> : '—'}</td></tr>)}</tbody></table></div>}
          </section>
        </>
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Metric label="Collection target" value={formatCurrency(session.targetAmount || 0)} tone="slate" />
            <Metric label="Approved" value={formatCurrency(overview.approvedAmount)} hint="Counts toward the target" tone="green" />
            <Metric label="Pending review" value={formatCurrency(overview.pendingAmount)} hint="Not in official totals" tone="amber" />
            <Metric label="Remaining" value={formatCurrency(Math.max(0, (session.targetAmount || 0) - overview.approvedAmount))} hint={`${formatCurrency(overview.rejectedAmount)} rejected`} tone="indigo" />
          </section>
          {session.targetAmount && <div className="card-surface p-4 sm:p-5"><div className="mb-2 flex items-center justify-between text-xs"><span className="font-bold text-slate-800">Approved collection progress</span><span className="font-semibold text-indigo-700">{Math.min(100, Math.round(overview.approvedAmount / session.targetAmount * 100))}%</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-violet-600 transition-all" style={{ width: `${Math.min(100, Math.round(overview.approvedAmount / session.targetAmount * 100))}%` }} /></div></div>}
          {session.status === 'OPEN' && isAuthenticatedMember && ownRow && <section className="card-surface p-4 sm:p-5">
            <div className="mb-3 flex items-start justify-between gap-3"><div><h2 className="text-sm font-bold text-slate-900">Submit a contribution</h2><p className="mt-1 text-xs leading-relaxed text-slate-500">Your contribution starts pending. Leaders must review it before it affects official collection totals.</p></div><CircleDollarSign className="h-5 w-5 text-cyan-600" /></div>
            {contributionError && <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{contributionError}</div>}
            <form onSubmit={submitContribution} className="grid gap-3 sm:grid-cols-[180px_minmax(0,1fr)_auto] sm:items-end">
              <div><label htmlFor="contribution-amount" className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-slate-500">Amount (RWF)</label><input id="contribution-amount" value={amount} onChange={(event) => setAmount(event.target.value)} type="number" min="1" step="1" required className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100" placeholder="5000" /></div>
              <div><label htmlFor="contribution-note" className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-slate-500">Note (optional)</label><input id="contribution-note" value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100" placeholder="Receipt or payment reference" /></div>
              <button disabled={busy} aria-busy={busyAction === 'contribution'} type="submit" className="inline-flex items-center justify-center gap-2 brand-button rounded-xl px-4 py-2.5 text-xs font-bold text-white disabled:cursor-wait disabled:opacity-60">{busyAction === 'contribution' && <LoaderCircle className="h-3.5 w-3.5 animate-spin" />}{busyAction === 'contribution' ? 'Submitting…' : 'Submit for review'}</button>
            </form>
            <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-slate-500"><span>Your approved total: <strong className="text-slate-700">{formatCurrency(ownRow.approvedAmount)}</strong></span><span>Pending: <strong className="text-amber-700">{formatCurrency(ownRow.pendingAmount)}</strong></span><StatusPill value={ownRow.contributionStatus || 'NOT_YET'} /></div>
          </section>}
          {canManage && <section className="grid grid-cols-2 gap-3 sm:grid-cols-3"><Metric label="Contributors" value={overview.contributorCount} hint="At least one approved contribution" tone="green" /><Metric label={session.memberTargetAmount ? 'Partial' : 'Members pending'} value={session.memberTargetAmount ? overview.partialCount : overview.pendingContributorCount} tone="indigo" /><Metric label={session.memberTargetAmount ? 'Completed' : 'Not yet'} value={session.memberTargetAmount ? overview.completedCount : overview.notYetCount} tone="slate" /><Metric label="Pending members" value={overview.pendingContributorCount} tone="amber" /><Metric label="Rejected submissions" value={overview.rejectedSubmissionCount} tone="rose" /><Metric label="Total members" value={overview.totalMembers} tone="slate" /></section>}
          {userRole === 'MEMBER' && ownRow && <section className="card-surface flex flex-wrap items-center justify-between gap-3 p-4"><div><h2 className="text-sm font-bold text-slate-900">Your contribution status</h2><p className="mt-1 text-xs text-slate-500">Approved {formatCurrency(ownRow.approvedAmount)} · Pending {formatCurrency(ownRow.pendingAmount)}</p></div><StatusPill value={ownRow.contributionStatus || 'NOT_YET'} /></section>}
          {canManage && <section className="card-surface min-w-0 p-4 sm:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3"><div><h2 className="text-sm font-bold text-slate-900">Contributor progress</h2><p className="mt-0.5 text-[11px] text-slate-500">Member status is based on approved, pending, and rejected ledger entries.</p></div><Link href="/finances?status=needs_review" className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900">Review pending records →</Link></div>
            {overview.roster.length === 0 ? <p className="text-xs text-slate-500">No active members were in the roster snapshot for this session.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[660px] text-left text-xs"><thead><tr className="text-[10px] uppercase tracking-wide text-slate-400"><th className="pb-2 font-bold">Member</th><th className="pb-2 font-bold">Status</th><th className="pb-2 font-bold">Approved</th><th className="pb-2 font-bold">Pending</th><th className="pb-2 font-bold">Rejected entries</th></tr></thead><tbody className="divide-y divide-slate-100">{overview.roster.map((entry) => <tr key={entry.memberId}><td className="py-3 pr-3 font-semibold text-slate-800">{entry.memberName}</td><td className="py-3 pr-3"><StatusPill value={entry.contributionStatus || 'NOT_YET'} /></td><td className="py-3 pr-3 text-slate-700">{formatCurrency(entry.approvedAmount)}</td><td className="py-3 pr-3 text-amber-700">{formatCurrency(entry.pendingAmount)}</td><td className="py-3 text-slate-500">{entry.rejectedCount}</td></tr>)}</tbody></table></div>}
          </section>}
          {userRole === 'AUDITOR' && <div className="card-surface p-4 text-xs text-slate-500">This is a public session summary. Contributor names and private member details are limited to leaders and admins.</div>}
        </>
      )}

      {canManage && session.status === 'OPEN' && confirmClose && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm"><div className="glass-panel w-full max-w-md rounded-3xl border border-white/80 p-6 shadow-2xl"><div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">{session.type === 'ATTENDANCE' ? <XCircle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}</div><h2 className="text-lg font-bold text-slate-900">{session.type === 'ATTENDANCE' ? 'Close and finalize attendance?' : 'Close this collection?'}</h2><p className="mt-2 text-sm leading-relaxed text-slate-600">{session.type === 'ATTENDANCE' ? 'New scans will stop, unchecked roster members will become absent, and configured penalties will be created pending review.' : 'Members will no longer be able to submit contributions. Pending records will remain pending review.'}</p><div className="mt-5 flex justify-end gap-2"><button disabled={busy} onClick={() => setConfirmClose(false)} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 disabled:opacity-50">Keep open</button><button disabled={busy} aria-busy={busyAction === 'close'} onClick={() => { void runAction('close', async () => { setConfirmClose(false); return closeSessionAction(session.id) }) }} className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-rose-700 disabled:cursor-wait disabled:opacity-60">{busyAction === 'close' && <LoaderCircle className="h-3.5 w-3.5 animate-spin" />}{busyAction === 'close' ? 'Closing…' : 'Confirm close'}</button></div></div></div>}

      {showEdit && <SessionForm categories={categories} initialSession={session} onClose={() => setShowEdit(false)} />}
    </div>
  )
}
