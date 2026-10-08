'use client'

import * as React from 'react'
import Link from 'next/link'
import { CalendarClock, CalendarDays, CheckCircle2, ChevronRight, CircleDollarSign, Plus, QrCode, Users, ArrowRight } from 'lucide-react'
import { ChoirSession, FinancialCategory, MemberSessionHistoryItem, UserRole } from '@/types'
import { canManageMembers } from '@/lib/permissions'
import { formatCurrency } from '@/lib/utils/currency'
import { formatSessionDateTime } from '@/lib/utils/zoned-time'
import { SessionForm } from './SessionForm'
import { CrystalBadge } from '@/components/ui/CrystalBadge'

interface SessionsViewProps {
  sessions: ChoirSession[]
  categories: FinancialCategory[]
  userRole: UserRole
  memberHistory: MemberSessionHistoryItem[]
}

const statusStyles: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-600',
  SCHEDULED: 'bg-indigo-50 text-indigo-700',
  OPEN: 'bg-emerald-50 text-emerald-700',
  CLOSED: 'bg-amber-50 text-amber-700',
  COMPLETED: 'bg-slate-100 text-slate-600'
}

export function SessionsView({ sessions, categories, userRole, memberHistory }: SessionsViewProps) {
  const [showForm, setShowForm] = React.useState(false)
  const [initialFormType, setInitialFormType] = React.useState<'ATTENDANCE' | 'CONTRIBUTION' | undefined>(undefined)
  const [filter, setFilter] = React.useState<'ALL' | 'ATTENDANCE' | 'CONTRIBUTION'>('ALL')
  const canManage = canManageMembers(userRole)

  React.useEffect(() => {
    if (typeof window !== 'undefined' && canManage) {
      const params = new URLSearchParams(window.location.search)
      if (params.get('create') === '1' || params.get('create') === 'true' || params.get('new') === '1') {
        const typeParam = params.get('type')?.toUpperCase()
        if (typeParam === 'ATTENDANCE' || typeParam === 'CONTRIBUTION') {
          setInitialFormType(typeParam)
        }
        setShowForm(true)
      }
    }

    const handleOpenCreateSession = (event?: Event) => {
      const customEvent = event as CustomEvent<{ type?: 'ATTENDANCE' | 'CONTRIBUTION' }> | undefined
      if (customEvent?.detail?.type) {
        setInitialFormType(customEvent.detail.type)
      }
      setShowForm(true)
    }

    window.addEventListener('open-create-session', handleOpenCreateSession)
    return () => {
      window.removeEventListener('open-create-session', handleOpenCreateSession)
    }
  }, [canManage])

  const visibleSessions = filter === 'ALL' ? sessions : sessions.filter((session) => session.type === filter)
  const openCount = sessions.filter((session) => session.status === 'OPEN').length
  const upcomingCount = sessions.filter((session) => session.status === 'SCHEDULED').length

  const totalSessionMoneyCollected = React.useMemo(() => {
    return sessions.reduce((sum, s) => sum + (s.totalCollected || 0), 0)
  }, [sessions])

  const totalPenaltiesCollected = React.useMemo(() => {
    return sessions.reduce((sum, s) => sum + (s.collectedPenalties || 0), 0)
  }, [sessions])

  const totalContributionsCollected = React.useMemo(() => {
    return sessions.reduce((sum, s) => sum + (s.collectedContributions || 0), 0)
  }, [sessions])

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[28px] border border-white/80 bg-gradient-to-br from-white/85 via-indigo-50/55 to-cyan-50/60 p-5 shadow-[0_18px_55px_rgba(68,75,130,0.08)] sm:p-7">
        <div className="pointer-events-none absolute -right-14 -top-20 h-56 w-56 rotate-45 border border-white/80" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white/75 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-indigo-700">
              <CalendarDays className="h-3.5 w-3.5" /> Attendance & collections
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Sessions</h1>
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-600">Manage choir activities, session contributions, and attendance penalty fees in one place.</p>
          </div>
          {canManage && <button onClick={() => setShowForm(true)} className="brand-button inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white"><Plus className="h-4 w-4" /> Create session</button>}
        </div>

        {/* SESSION FINANCIAL & OPERATIONAL ANALYTICS */}
        <div className="relative mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <div className="rounded-2xl border border-white/90 bg-white/80 p-3.5 shadow-2xs">
            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
              <CircleDollarSign className="h-3.5 w-3.5 text-emerald-600" /> Total Money Collected
            </span>
            <strong className="mt-1 block text-lg sm:text-xl text-slate-900 truncate">
              {formatCurrency(totalSessionMoneyCollected)}
            </strong>
            <span className="mt-0.5 block text-[10px] text-slate-400">All sessions & fees</span>
          </div>

          <div className="rounded-2xl border border-white/90 bg-white/80 p-3.5 shadow-2xs">
            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-purple-700">
              <CircleDollarSign className="h-3.5 w-3.5 text-purple-600" /> Penalty Fee Collected
            </span>
            <strong className="mt-1 block text-lg sm:text-xl text-purple-900 truncate">
              {formatCurrency(totalPenaltiesCollected)}
            </strong>
            <span className="mt-0.5 block text-[10px] text-slate-400">Late & absent penalties</span>
          </div>

          <div className="rounded-2xl border border-white/90 bg-white/80 p-3.5 shadow-2xs">
            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-indigo-700">
              <CircleDollarSign className="h-3.5 w-3.5 text-indigo-600" /> Contributions Collected
            </span>
            <strong className="mt-1 block text-lg sm:text-xl text-indigo-900 truncate">
              {formatCurrency(totalContributionsCollected)}
            </strong>
            <span className="mt-0.5 block text-[10px] text-slate-400">Target collections</span>
          </div>

          <div className="rounded-2xl border border-white/90 bg-white/65 p-3.5">
            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Open now
            </span>
            <strong className="mt-1 block text-lg sm:text-xl text-slate-900">{openCount}</strong>
            <span className="mt-0.5 block text-[10px] text-slate-400">Active sessions</span>
          </div>

          <div className="rounded-2xl border border-white/90 bg-white/65 p-3.5 col-span-2 sm:col-span-1">
            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
              <Users className="h-3.5 w-3.5 text-indigo-600" /> Total sessions
            </span>
            <strong className="mt-1 block text-lg sm:text-xl text-slate-900">{sessions.length}</strong>
            <span className="mt-0.5 block text-[10px] text-slate-400">{upcomingCount} scheduled</span>
          </div>
        </div>
      </section>

      <section className="card-surface min-w-0 p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Choir calendar</h2>
            <p className="mt-0.5 text-[11px] text-slate-500">Dates and times are shown in Africa/Kigali.</p>
          </div>
          <div className="flex max-w-full gap-1 overflow-x-auto rounded-xl bg-slate-100/80 p-1 text-xs">
            {(['ALL', 'ATTENDANCE', 'CONTRIBUTION'] as const).map((value) => (
              <button key={value} onClick={() => setFilter(value)} className={`whitespace-nowrap rounded-lg px-3 py-2 font-semibold transition ${filter === value ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
                {value === 'ALL' ? 'All' : value === 'ATTENDANCE' ? 'Attendance' : 'Contributions'}
              </button>
            ))}
          </div>
        </div>
        {visibleSessions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white/45 px-5 py-12 text-center">
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600"><CalendarDays className="h-5 w-5" /></div>
            <h3 className="text-sm font-bold text-slate-800">No sessions yet</h3>
            <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-slate-500">{canManage ? 'Create a draft attendance session or contribution collection to get started.' : 'Scheduled public choir sessions will appear here.'}</p>
            {canManage && <button onClick={() => setShowForm(true)} className="mt-4 rounded-xl border border-indigo-200 bg-white px-4 py-2.5 text-xs font-bold text-indigo-700 hover:bg-indigo-50">Create your first session</button>}
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {visibleSessions.map((session) => (
              <Link
                key={session.id}
                href={`/sessions/${session.id}`}
                className="group rounded-[24px] sm:rounded-[26px] bg-white/85 backdrop-blur-xl border border-white/95 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.03),0_12px_32px_-4px_rgba(15,23,42,0.06),0_0_0_1px_rgba(255,255,255,0.9)_inset] hover:shadow-[0_8px_28px_-2px_rgba(15,23,42,0.06),0_20px_44px_-4px_rgba(15,23,42,0.08),0_0_0_1px_rgba(255,255,255,1)_inset] hover:-translate-y-1 p-5 transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <CrystalBadge
                      type={session.type === 'ATTENDANCE' ? 'cyan' : 'success'}
                      size="sm"
                      className="shrink-0"
                    />
                    <div className="flex flex-wrap justify-end gap-1.5">
                      <span className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide ${statusStyles[session.status]}`}>
                        {session.status.toLowerCase()}
                      </span>
                      <span className="rounded-full bg-slate-100/80 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-slate-500">
                        {session.visibility.toLowerCase()}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                      {session.type === 'ATTENDANCE' ? 'Attendance' : 'Contribution collection'}
                    </p>
                    <h3 className="mt-1 truncate text-base font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                      {session.title}
                    </h3>
                    {session.description && (
                      <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-500">
                        {session.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2 text-[11px] text-slate-500">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span>{formatSessionDateTime(session.startsAt)}</span>
                    {session.location && <span className="truncate max-w-[140px]">• {session.location}</span>}
                    {session.type === 'CONTRIBUTION' && session.targetAmount != null && (
                      <span className="font-semibold text-slate-700">• Target {formatCurrency(session.targetAmount)}</span>
                    )}
                  </div>

                  <span className="liquid-silver-button liquid-silver-button-sm flex items-center gap-1 shrink-0 group-hover:shadow-md">
                    <span>View</span>
                    <ArrowRight className="w-3 h-3 text-slate-700 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
      {userRole === 'MEMBER' && <section className="card-surface min-w-0 p-4 sm:p-5">
        <div className="mb-4 border-b border-slate-100 pb-3"><h2 className="text-sm font-bold text-slate-900">My session history</h2><p className="mt-0.5 text-[11px] text-slate-500">Your check-ins, contributions, and any pending penalties for public sessions.</p></div>
        {memberHistory.length === 0 ? <p className="rounded-xl bg-slate-50 p-4 text-xs text-slate-500">No public session activity has been recorded for your member profile.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left text-xs"><thead><tr className="text-[10px] uppercase tracking-wide text-slate-400"><th className="pb-2 font-bold">Session</th><th className="pb-2 font-bold">Date</th><th className="pb-2 font-bold">Attendance</th><th className="pb-2 font-bold">Contribution</th><th className="pb-2 font-bold">Penalty</th></tr></thead><tbody className="divide-y divide-slate-100">{memberHistory.map((entry) => <tr key={entry.sessionId}><td className="py-3 pr-4"><Link href={`/sessions/${entry.sessionId}`} className="font-semibold text-slate-800 hover:text-indigo-700">{entry.title}</Link><span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-500">{entry.type.toLowerCase()}</span></td><td className="py-3 pr-4 whitespace-nowrap text-slate-500">{formatSessionDateTime(entry.startsAt)}</td><td className="py-3 pr-4">{entry.attendanceStatus ? <span className="font-semibold text-slate-700">{entry.attendanceStatus.replaceAll('_', ' ').toLowerCase()}</span> : '—'}</td><td className="py-3 pr-4 text-slate-600">{entry.type === 'CONTRIBUTION' ? <>{entry.contributionStatus?.toLowerCase().replaceAll('_', ' ')} · {formatCurrency(entry.approvedAmount)} approved{entry.pendingAmount > 0 ? ` · ${formatCurrency(entry.pendingAmount)} pending` : ''}</> : '—'}</td><td className="py-3 text-slate-600">{entry.penaltyAmount > 0 ? <>{formatCurrency(entry.penaltyAmount)} · {(entry.penaltyStatus || 'needs_review').replaceAll('_', ' ').toLowerCase()}</> : '—'}</td></tr>)}</tbody></table></div>}
      </section>}
      {showForm && (
        <SessionForm
          categories={categories}
          defaultType={initialFormType}
          onClose={() => {
            setShowForm(false)
            setInitialFormType(undefined)
          }}
        />
      )}
    </div>
  )
}
