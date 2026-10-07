'use client'

import * as React from 'react'
import Link from 'next/link'
import { CheckCircle2, QrCode } from 'lucide-react'
import { checkInAction } from '@/features/sessions/actions'
import { ChoirSession, UserRole } from '@/types'
import { formatSessionDateTime } from '@/lib/utils/zoned-time'

export function SessionCheckInCard({ session, token, role, hasMemberProfile }: {
  session: ChoirSession
  token: string
  role: UserRole
  hasMemberProfile: boolean
}) {
  const [busy, setBusy] = React.useState(false)
  const checkInLock = React.useRef(false)
  const [error, setError] = React.useState('')
  const [message, setMessage] = React.useState('')

  async function confirmCheckIn() {
    if (checkInLock.current) return
    checkInLock.current = true
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const result = await checkInAction(session.id, token)
      if (result.success) setMessage(result.message || 'Attendance recorded.')
      else setError(result.error || 'Could not record attendance.')
    } catch {
      setError('Could not record attendance. Please try again.')
    } finally {
      checkInLock.current = false
      setBusy(false)
    }
  }

  const disabledReason = role === 'AUDITOR'
    ? 'Auditor accounts are read-only.'
    : !hasMemberProfile
    ? 'This login is not linked to an active member profile.'
    : null

  return <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-xl items-center justify-center p-4 sm:p-8">
    <section className="glass-panel w-full rounded-[28px] border border-white/80 p-5 shadow-[0_22px_70px_rgba(42,47,96,0.16)] sm:p-8">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700"><QrCode className="h-6 w-6" /></div>
      <p className="text-center text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-600">Attendance check-in</p>
      <h1 className="mt-2 text-center text-xl font-bold text-slate-900 sm:text-2xl">{session.title}</h1>
      <p className="mt-2 text-center text-xs text-slate-500">{formatSessionDateTime(session.startsAt)} · {session.location || 'Choir session'}</p>
      <div className="mt-5 rounded-2xl border border-indigo-100 bg-white/60 p-4 text-center text-xs leading-relaxed text-slate-600">
        This confirms attendance for the signed-in account only. The session is {session.status.toLowerCase()} and check-in must be within its configured window.
      </div>
      {error && <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{error}</div>}
      {message && <div className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-700"><CheckCircle2 className="h-4 w-4" /> {message}</div>}
      {disabledReason ? <p className="mt-4 text-center text-xs text-rose-700">{disabledReason}</p> : !message && <button onClick={() => void confirmCheckIn()} disabled={busy} className="brand-button mt-5 w-full rounded-xl px-4 py-3 text-sm font-bold text-white disabled:cursor-wait disabled:opacity-60">{busy ? 'Confirming…' : 'Confirm my attendance'}</button>}
      <p className="mt-5 text-center text-[10px] text-slate-400">Signed in as your own choir account · <Link href="/sessions" className="font-semibold text-indigo-600 hover:text-indigo-800">View sessions</Link></p>
    </section>
  </main>
}
