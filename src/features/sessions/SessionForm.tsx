'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { CalendarDays, X, LoaderCircle, ChevronDown } from 'lucide-react'
import { FinancialCategory, ChoirSession } from '@/types'
import { saveSessionAction } from '@/features/sessions/actions'
import { sessionDateTimeLocalValue } from '@/lib/utils/zoned-time'

interface SessionFormProps {
  categories: FinancialCategory[]
  initialSession?: ChoirSession | null
  defaultType?: 'ATTENDANCE' | 'CONTRIBUTION'
  onClose: () => void
}

const inputClass = 'w-full rounded-xl border border-slate-200 bg-white/90 px-3.5 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100'
const selectClass = 'w-full appearance-none pl-3.5 pr-11 py-2.5 rounded-xl border border-slate-200 bg-white/90 text-sm text-slate-800 shadow-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 cursor-pointer'
const labelClass = 'mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-slate-500'

export function SessionForm({ categories, initialSession, defaultType, onClose }: SessionFormProps) {
  const router = useRouter()
  const [type, setType] = React.useState(initialSession?.type || defaultType || 'ATTENDANCE')
  const [error, setError] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const saveLock = React.useRef(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saveLock.current) return
    saveLock.current = true
    setError('')
    setBusy(true)
    try {
      const result = await saveSessionAction(new FormData(event.currentTarget))
      if (!result.success) {
        setError(result.error || 'Could not save the session.')
        return
      }
      onClose()
      router.push(`/sessions/${result.id}`)
      router.refresh()
    } catch {
      setError('Could not save the session. Please try again.')
    } finally {
      saveLock.current = false
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-950/35 p-0 backdrop-blur-sm sm:items-center sm:p-5" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !busy) onClose()
    }}>
      <section className="max-h-[94dvh] w-full max-w-2xl overflow-y-auto rounded-t-[26px] border border-white bg-white/95 p-5 shadow-2xl backdrop-blur-2xl sm:rounded-[28px] sm:p-7" role="dialog" aria-modal="true" aria-labelledby="session-form-title">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-indigo-700">
              <CalendarDays className="h-3.5 w-3.5" /> Choir sessions
            </div>
            <h2 id="session-form-title" className="text-xl font-bold text-slate-900">{initialSession ? 'Edit session' : 'Create a session'}</h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">Save as a draft, then schedule it when the details are ready.</p>
          </div>
          <button type="button" onClick={onClose} disabled={busy} className="rounded-xl p-2 text-slate-400 hover:bg-white hover:text-slate-700" aria-label="Close session form">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-700">{error}</div>}
        {busy && <div role="status" aria-live="polite" className="mb-4 flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-3 text-sm font-semibold text-indigo-800">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          {initialSession ? 'Saving session changes…' : 'Creating your session…'}
        </div>}

        <form onSubmit={handleSubmit} aria-busy={busy} className="space-y-4">
          {initialSession && <input type="hidden" name="sessionId" value={initialSession.id} />}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="session-title">Title</label>
              <input id="session-title" name="title" required maxLength={160} defaultValue={initialSession?.title || ''} className={inputClass} placeholder="Choir Training — Vocal Practice" />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="session-description">Description</label>
              <textarea id="session-description" name="description" maxLength={2000} rows={2} defaultValue={initialSession?.description || ''} className={`${inputClass} resize-y`} placeholder="What should members know about this session?" />
            </div>
            <div>
              <label className={labelClass} htmlFor="session-type">Type</label>
              <div className="relative">
                <select id="session-type" name="type" value={type} onChange={(event) => setType(event.target.value as typeof type)} className={selectClass}>
                  <option value="ATTENDANCE">Attendance</option>
                  <option value="CONTRIBUTION">Contribution collection</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 stroke-[2.2]" />
              </div>
            </div>
            <div>
              <label className={labelClass} htmlFor="session-visibility">Visibility</label>
              <div className="relative">
                <select id="session-visibility" name="visibility" defaultValue={initialSession?.visibility || 'PUBLIC'} className={selectClass}>
                  <option value="PUBLIC">Public — signed-in users</option>
                  <option value="PRIVATE">Private — leaders and admins</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 stroke-[2.2]" />
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="session-location">Location</label>
              <input id="session-location" name="location" maxLength={200} defaultValue={initialSession?.location || ''} required={type === 'ATTENDANCE'} className={inputClass} placeholder={type === 'ATTENDANCE' ? 'Church Hall' : 'Optional for a collection'} />
            </div>
            <div>
              <label className={labelClass} htmlFor="session-start">Start time <span className="normal-case font-medium">(Africa/Kigali)</span></label>
              <input id="session-start" name="startsAt" type="datetime-local" required defaultValue={initialSession ? sessionDateTimeLocalValue(initialSession.startsAt) : ''} className={inputClass} />
            </div>
            <div>
              <label className={labelClass} htmlFor="session-end">End time <span className="normal-case font-medium">(Africa/Kigali)</span></label>
              <input id="session-end" name="endsAt" type="datetime-local" required defaultValue={initialSession ? sessionDateTimeLocalValue(initialSession.endsAt) : ''} className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass} htmlFor="session-deadline">{type === 'ATTENDANCE' ? 'Last check-in time' : 'Contribution deadline'} <span className="normal-case font-medium">(Africa/Kigali)</span></label>
              <input id="session-deadline" name="deadlineAt" type="datetime-local" required defaultValue={initialSession ? sessionDateTimeLocalValue(initialSession.deadlineAt) : ''} className={inputClass} />
              <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">
                {type === 'ATTENDANCE'
                  ? 'Scans after this time are rejected. A member is not marked absent until a leader closes the session.'
                  : 'Members may submit contributions until this time while the collection is open.'}
              </p>
            </div>
          </div>

          {type === 'ATTENDANCE' ? (
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/55 p-4">
              <h3 className="text-sm font-bold text-slate-800">Attendance rules</h3>
              <p className="mb-3 mt-1 text-[11px] text-slate-500">Penalties are created as pending records.</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className={labelClass} htmlFor="session-grace">On-time grace (minutes)</label>
                  <input id="session-grace" name="attendanceGraceMinutes" type="number" min="0" max="1440" step="1" defaultValue={initialSession?.attendanceGraceMinutes ?? 0} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass} htmlFor="session-late-fee">Late fee (RWF)</label>
                  <input id="session-late-fee" name="lateFee" type="number" min="0" step="1" defaultValue={initialSession?.lateFee ?? 500} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass} htmlFor="session-absent-fee">Absent fee (RWF)</label>
                  <input id="session-absent-fee" name="absentFee" type="number" min="0" step="1" defaultValue={initialSession?.absentFee ?? 1000} className={inputClass} />
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-cyan-100 bg-cyan-50/55 p-4">
              <h3 className="text-sm font-bold text-slate-800">Collection rules</h3>
              <p className="mb-3 mt-1 text-[11px] text-slate-500">Only approved contributions count toward the collection total. A member target enables partial and completed progress labels.</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className={labelClass} htmlFor="session-target">Collection target (RWF)</label>
                  <input id="session-target" name="targetAmount" type="number" min="1" step="1" required defaultValue={initialSession?.targetAmount || ''} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass} htmlFor="session-member-target">Per-member target (optional)</label>
                  <input id="session-member-target" name="memberTargetAmount" type="number" min="0" step="1" defaultValue={initialSession?.memberTargetAmount || ''} className={inputClass} />
                </div>
              </div>
            </div>
          )}

          <div>
            <label className={labelClass} htmlFor="session-category">Income category {type === 'ATTENDANCE' && '(required when penalties are non-zero)'}</label>
            <div className="relative">
              <select id="session-category" name="financialCategoryId" defaultValue={initialSession?.financialCategoryId || ''} required={type === 'CONTRIBUTION'} className={selectClass}>
                <option value="">{type === 'CONTRIBUTION' ? 'Choose an income category' : 'Choose a category for penalties'}</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 stroke-[2.2]" />
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-slate-200/70 pt-4 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} disabled={busy} className="rounded-xl border border-slate-200 bg-white/75 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-white disabled:opacity-60">Cancel</button>
            <button type="submit" disabled={busy} aria-busy={busy} className="inline-flex items-center justify-center gap-2 brand-button rounded-xl px-5 py-2.5 text-sm font-bold text-white disabled:cursor-wait disabled:opacity-60">{busy && <LoaderCircle className="h-4 w-4 animate-spin" />}{busy ? initialSession ? 'Saving…' : 'Creating…' : initialSession ? 'Save changes' : 'Create session draft'}</button>
          </div>
        </form>
      </section>
    </div>
  )
}
