'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Eye, Mail, Send, Users, LoaderCircle } from 'lucide-react'
import { MemberCommunication, MemberCommunicationStatus } from '@/types'
import type { CommunicationAudienceItem } from '@/lib/db/member-workflows'
import { isValidEmail } from './domain.mjs'
import { sendMemberCommunicationAction } from './actions'

type Mode = 'SINGLE_MEMBER' | 'SELECTED_MEMBERS' | 'ALL_MEMBERS' | 'MANUAL_EMAIL'

const modeLabels: Record<Mode, string> = {
  SINGLE_MEMBER: 'One member', SELECTED_MEMBERS: 'Selected members',
  ALL_MEMBERS: 'All active members', MANUAL_EMAIL: 'Manual email address'
}

function DeliveryStatus({ status }: { status: MemberCommunicationStatus }) {
  const styles: Record<MemberCommunicationStatus, string> = {
    QUEUED: 'bg-amber-50 text-amber-700', SENDING: 'bg-indigo-50 text-indigo-700',
    SENT: 'bg-emerald-50 text-emerald-700', PARTIAL: 'bg-orange-50 text-orange-700', FAILED: 'bg-rose-50 text-rose-700'
  }
  return <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${styles[status]}`}>{status}</span>
}

export function CommunicationsView({ audience, history }: {
  audience: CommunicationAudienceItem[]
  history: MemberCommunication[]
}) {
  const router = useRouter()
  const [mode, setMode] = React.useState<Mode>('SINGLE_MEMBER')
  const [memberIds, setMemberIds] = React.useState<string[]>([])
  const [manualEmail, setManualEmail] = React.useState('')
  const [manualName, setManualName] = React.useState('')
  const [subject, setSubject] = React.useState('')
  const [body, setBody] = React.useState('')
  const [important, setImportant] = React.useState(false)
  const [inAppNotification, setInAppNotification] = React.useState(false)
  const [allConfirmed, setAllConfirmed] = React.useState(false)
  const [preview, setPreview] = React.useState(false)
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState('')
  const [notice, setNotice] = React.useState('')
  const [expanded, setExpanded] = React.useState<string | null>(null)
  const sendingLock = React.useRef(false)

  const eligibleAudience = React.useMemo(() => audience.filter((item) => item.validEmail), [audience])
  const invalidAudienceCount = audience.length - eligibleAudience.length
  const selectedRecipients = mode === 'ALL_MEMBERS'
    ? eligibleAudience
    : eligibleAudience.filter((item) => memberIds.includes(item.id))
  const previewRecipients = mode === 'MANUAL_EMAIL'
    ? manualEmail.trim() && isValidEmail(manualEmail) ? [{ id: 'manual', fullName: manualName.trim() || 'Email recipient', email: manualEmail.trim().toLowerCase() }] : []
    : selectedRecipients
  const previewCount = mode === 'ALL_MEMBERS' ? eligibleAudience.length : previewRecipients.length
  const canPreview = subject.trim().length > 0 && subject.length <= 160 && body.trim().length > 0 && body.length <= 10000 && previewCount > 0 && previewCount <= 500 &&
    (mode !== 'ALL_MEMBERS' || (allConfirmed && audience.length <= 500))

  function setRecipientMode(value: Mode) {
    setMode(value)
    setMemberIds([])
    setAllConfirmed(false)
    setPreview(false)
    setError('')
  }

  function toggleMember(id: string) {
    setPreview(false)
    setMemberIds((previous) => mode === 'SINGLE_MEMBER'
      ? [id]
      : previous.includes(id) ? previous.filter((value) => value !== id) : [...previous, id])
  }

  async function send() {
    if (sendingLock.current) return
    sendingLock.current = true
    setBusy(true)
    setError('')
    setNotice('')
    try {
      const result = await sendMemberCommunicationAction({
        mode, memberIds: mode === 'ALL_MEMBERS' || mode === 'MANUAL_EMAIL' ? [] : memberIds,
        manualEmail, manualName, subject, body, important, inAppNotification,
        confirmed: true,
        allMembersConfirmed: mode !== 'ALL_MEMBERS' || allConfirmed
      })
      if (!result.success) {
        setError(result.error || 'The message could not be queued.')
        setPreview(false)
        return
      }
      setNotice(`${result.message}${result.invalidCount ? ` ${result.invalidCount} member account(s) were skipped because their email address is invalid.` : ''}`)
      setSubject('')
      setBody('')
      setMemberIds([])
      setManualEmail('')
      setManualName('')
      setPreview(false)
      setAllConfirmed(false)
      setImportant(false)
      setInAppNotification(false)
      router.refresh()
    } catch {
      setError('The message could not be queued. Please try again.')
    } finally {
      sendingLock.current = false
      setBusy(false)
    }
  }

  return <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Member communications</h1>
      <p className="mt-1 text-xs leading-relaxed text-slate-500 sm:text-sm">Send a branded email to one member, selected members, all active member accounts, or a validated email address.</p>
    </div>
    {(error || notice) && <div role={error ? 'alert' : 'status'} className={`rounded-xl border px-4 py-3 text-xs ${error ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>{error || notice}</div>}
    {busy && <div role="status" aria-live="polite" className="flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-800">
      <LoaderCircle className="h-4 w-4 animate-spin" />
      Queueing your communication for {previewCount} recipient{previewCount === 1 ? '' : 's'}…
    </div>}

    <section className="card-surface space-y-5 p-4 sm:p-6">
      <div className="flex items-center gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700"><Mail className="h-4 w-4" /></span><div><h2 className="text-sm font-bold text-slate-900">Compose a message</h2><p className="text-[11px] text-slate-500">The preview shows the exact text and recipient count before confirmation.</p></div></div>
      <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
        <div><label htmlFor="comm-mode" className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-slate-500">Recipients</label><select id="comm-mode" value={mode} onChange={(event) => setRecipientMode(event.target.value as Mode)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100">{Object.entries(modeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-[10px] leading-relaxed text-slate-500"><div className="flex items-center gap-1.5 font-bold text-slate-700"><Users className="h-3.5 w-3.5" /> {mode === 'ALL_MEMBERS' ? eligibleAudience.length : mode === 'MANUAL_EMAIL' ? previewRecipients.length : memberIds.length} recipient(s)</div><p className="mt-1">Each member receives an individual email. Addresses are not shared with other recipients.</p>{mode === 'ALL_MEMBERS' && invalidAudienceCount > 0 && <p className="mt-1 text-amber-700">{invalidAudienceCount} account(s) have invalid email and will be skipped.</p>}{mode === 'ALL_MEMBERS' && audience.length > 500 && <p className="mt-1 font-semibold text-rose-700">All-member sends are limited to 500 active accounts. Select up to 500 members instead.</p>}</div>
        </div>
        <div className="min-w-0">
          {mode === 'MANUAL_EMAIL' ? <div className="grid gap-3 sm:grid-cols-2"><div><label htmlFor="manual-email" className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">Recipient email</label><input id="manual-email" type="email" maxLength={254} value={manualEmail} onChange={(event) => { setManualEmail(event.target.value); setPreview(false) }} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100" placeholder="person@example.org" /></div><div><label htmlFor="manual-name" className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">Name (optional)</label><input id="manual-name" maxLength={120} value={manualName} onChange={(event) => { setManualName(event.target.value); setPreview(false) }} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100" /></div></div> : <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2">{eligibleAudience.length === 0 ? <p className="p-3 text-xs text-slate-500">No active member accounts with valid email addresses.</p> : eligibleAudience.map((item) => <label key={item.id} className="flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 hover:bg-indigo-50"><input type={mode === 'SINGLE_MEMBER' ? 'radio' : 'checkbox'} name="communication-member" checked={memberIds.includes(item.id)} onChange={() => toggleMember(item.id)} className="h-4 w-4 accent-indigo-600" /><span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-slate-800">{item.fullName} <span className="font-normal text-slate-400">· {item.voicePart}</span></span><span className="block truncate text-[10px] text-slate-500">{item.email}</span></span></label>)}</div>}
        </div>
      </div>
      {mode === 'ALL_MEMBERS' && <label className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900"><input type="checkbox" checked={allConfirmed} onChange={(event) => { setAllConfirmed(event.target.checked); setPreview(false) }} className="mt-0.5 h-4 w-4 accent-amber-600" /><span>I confirm this message will be sent individually to all <strong>{eligibleAudience.length}</strong> active member account(s).</span></label>}
      <div className="grid gap-4">
        <div><label htmlFor="comm-subject" className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-slate-500">Subject</label><input id="comm-subject" maxLength={160} value={subject} onChange={(event) => { setSubject(event.target.value); setPreview(false) }} className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100" placeholder="Choir rehearsal update" /></div>
        <div><label htmlFor="comm-body" className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-slate-500">Message</label><textarea id="comm-body" rows={6} maxLength={10000} value={body} onChange={(event) => { setBody(event.target.value); setPreview(false) }} className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm leading-relaxed outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100" placeholder="Write your message in plain text. Formatting is applied by the choir email template." /><span className="mt-1 block text-right text-[10px] text-slate-400">{body.length}/10,000</span></div>
      </div>
      <div className="flex flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50/70 p-3 sm:flex-row sm:flex-wrap sm:gap-5"><label className="flex items-center gap-2 text-xs text-slate-700"><input type="checkbox" checked={important} onChange={(event) => setImportant(event.target.checked)} className="h-4 w-4 accent-indigo-600" />Mark as important</label><label className="flex items-center gap-2 text-xs text-slate-700"><input type="checkbox" checked={inAppNotification} onChange={(event) => setInAppNotification(event.target.checked)} className="h-4 w-4 accent-indigo-600" />Also create in-app notifications</label><span className="text-[10px] text-slate-500">HTML is not accepted. Message text is safely encoded in the branded email.</span></div>
      {preview && <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4 sm:p-5"><div className="flex items-center gap-2 text-xs font-bold text-indigo-900"><Eye className="h-4 w-4" /> Confirm before queueing</div><div className="mt-3 grid gap-4 text-xs"><p><strong>To:</strong> {previewCount} recipient(s) via individual email</p><div className="overflow-hidden rounded-xl border border-slate-200 bg-white"><div className="flex items-center gap-3 border-b-4 border-cyan-400 bg-[#26234f] px-4 py-3 text-white"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-sm font-black text-indigo-700">G</span><span className="font-bold tracking-wide">GROW IN JESUS CHOIR</span><span className="ml-auto text-cyan-200">◇ ◇</span></div><div className="p-4 sm:p-5"><p className="text-[10px] font-bold uppercase tracking-widest text-violet-700">Choir communication</p><h3 className="mt-2 break-words text-lg font-bold text-slate-900">{subject}</h3>{important && <span className="mt-2 inline-flex rounded-full bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-800">Important message</span>}<p className="mt-3 max-h-44 overflow-auto whitespace-pre-wrap break-words text-xs leading-relaxed text-slate-700">{body}</p><p className="mt-4 text-[10px] text-slate-500">With care,<br /><strong>{'Choir leadership'}</strong></p></div><div className="border-t border-slate-100 bg-slate-50 px-4 py-3 text-[10px] text-slate-500">Grow in Jesus Choir · Rwanda</div></div>{previewRecipients.length > 0 && <div><strong>Recipient preview:</strong><div className="mt-1 max-h-28 overflow-auto text-slate-600">{previewRecipients.slice(0, 12).map((item) => <div key={item.id}>{item.fullName} · {item.email}</div>)}{previewRecipients.length > 12 && <div className="mt-1 text-slate-400">and {previewRecipients.length - 12} more…</div>}</div></div>}<p className="text-[10px] text-slate-500">Brevo acceptance will be tracked per recipient. Actual inbox delivery is not confirmed by this system.</p></div></div>}
      <div className="flex flex-col justify-end gap-2 sm:flex-row">{preview ? <><button type="button" disabled={busy} onClick={() => setPreview(false)} className="min-h-11 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 disabled:opacity-50">Edit message</button><button type="button" disabled={busy} aria-busy={busy} onClick={() => void send()} className="brand-button inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold text-white disabled:cursor-wait disabled:opacity-60">{busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}{busy ? 'Queueing…' : `Confirm and send to ${previewCount}`}</button></> : <button type="button" disabled={!canPreview || busy} onClick={() => { setError(''); setPreview(true) }} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-white px-5 py-2.5 text-xs font-bold text-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"><Eye className="h-4 w-4" />Preview message</button>}</div>
    </section>

    <section className="card-surface min-w-0 p-4 sm:p-5"><div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3"><div><h2 className="text-sm font-bold text-slate-900">Communication history</h2><p className="mt-1 text-[11px] text-slate-500">Only leaders and admins can view recipient delivery details.</p></div><span className="text-xs text-slate-400">{history.length} shown</span></div>{history.length === 0 ? <div className="rounded-xl bg-slate-50 p-5 text-center text-xs text-slate-500">No communications yet.</div> : <div className="space-y-2">{history.map((item) => <article key={item.id} className="rounded-2xl border border-slate-200 bg-white"><button type="button" aria-expanded={expanded === item.id} onClick={() => setExpanded((value) => value === item.id ? null : item.id)} className="flex w-full flex-col gap-2 p-3.5 text-left sm:flex-row sm:items-center sm:justify-between sm:p-4"><span className="min-w-0"><span className="flex flex-wrap items-center gap-2"><strong className="truncate text-xs text-slate-900">{item.subject}</strong><DeliveryStatus status={item.status} /></span><span className="mt-1 block text-[10px] text-slate-500">{item.senderName} · {modeLabels[item.recipientsMode]} · {item.createdAt.slice(0, 16).replace('T', ' ')} · {item.recipientCount} recipient(s)</span></span><span className="shrink-0 text-[10px] text-slate-500">Accepted by Brevo {item.sentCount} · Failed {item.failedCount}</span></button>{expanded === item.id && <div className="space-y-3 border-t border-slate-100 p-3.5 sm:p-4"><p className="whitespace-pre-wrap text-xs leading-relaxed text-slate-700">{item.body}</p>{item.invalidCount > 0 && <p className="text-[10px] text-amber-700">Skipped invalid addresses: {item.invalidCount}</p>}<div className="max-h-52 overflow-auto rounded-xl border border-slate-100"><table className="w-full min-w-[440px] text-left text-[10px]"><thead className="sticky top-0 bg-slate-50 text-slate-400"><tr><th className="px-3 py-2">Recipient</th><th className="px-3 py-2">Email</th><th className="px-3 py-2">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{item.recipients.map((recipient) => <tr key={recipient.id}><td className="px-3 py-2 text-slate-700">{recipient.recipientName}</td><td className="px-3 py-2 text-slate-500">{recipient.recipientEmail}</td><td className="px-3 py-2"><span className={recipient.status === 'SENT' ? 'font-bold text-emerald-700' : recipient.status === 'FAILED' ? 'font-bold text-rose-700' : 'font-bold text-amber-700'}>{recipient.status}</span>{recipient.lastError && <p className="max-w-[220px] text-rose-600">{recipient.lastError}</p>}</td></tr>)}</tbody></table></div></div>}</article>)}</div>}</section>
    <div className="flex items-start gap-2 text-[10px] leading-relaxed text-slate-500"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" /><p>Group messages are limited to 500 recipients, 3 group sends per hour, and 20 total communications per sender per hour. Provider acceptance is not a delivery receipt.</p></div>
  </div>
}
