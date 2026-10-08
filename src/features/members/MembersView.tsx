'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  Users,
  Search,
  CheckCircle2,
  Clock,
  Phone,
  BellRing,
  Send,
  MailPlus,
  MessagesSquare,
  LoaderCircle
} from 'lucide-react'
import { Member, FinancialRecord, UserRole } from '@/types'
import { sendRemindersAction } from '@/features/members/actions'
import { useToast } from '@/components/ui/Toast'

interface MembersViewProps {
  members: Member[]
  records?: FinancialRecord[]
  userRole: UserRole
}

export function MembersView({ members, records = [], userRole }: MembersViewProps) {
  const { success: showToastSuccess, error: showToastError } = useToast()

  const [activeVoice, setActiveVoice] = React.useState<string>('all')
  const [activeStatus, setActiveStatus] = React.useState<'all' | 'recorded' | 'pending'>('all')
  const [search, setSearch] = React.useState('')
  const [isSendingBatch, setIsSendingBatch] = React.useState(false)
  const [pendingReminderId, setPendingReminderId] = React.useState<string | null>(null)
  const reminderLock = React.useRef(false)

  // Dynamically compute recorded contributions from database records
  const recordedMemberIds = React.useMemo(() => {
    const ids = new Set<string>()
    for (const r of records) {
      if (r.type === 'income' && (r.status === 'recorded' || r.status === 'needs_review') && r.memberId) {
        ids.add(r.memberId)
      }
    }
    return ids
  }, [records])

  const pendingMembers = React.useMemo(() => {
    return members.filter((m) => !recordedMemberIds.has(m.id))
  }, [members, recordedMemberIds])

  const filteredMembers = React.useMemo(() => {
    return members.filter((m) => {
      if (activeVoice !== 'all' && m.voicePart !== activeVoice) return false

      const isRecorded = recordedMemberIds.has(m.id)
      if (activeStatus === 'recorded' && !isRecorded) return false
      if (activeStatus === 'pending' && isRecorded) return false

      if (search.trim()) {
        const query = search.toLowerCase()
        const matchName = m.fullName.toLowerCase().includes(query)
        const matchPhone = m.phone?.toLowerCase().includes(query)
        if (!matchName && !matchPhone) return false
      }

      return true
    })
  }, [members, activeVoice, activeStatus, search, recordedMemberIds])

  const handleSendSingleReminder = async (member: Member) => {
    if (reminderLock.current) return
    reminderLock.current = true
    setPendingReminderId(member.id)
    try {
      const res = await sendRemindersAction([member.id])
      if (res.success) {
        showToastSuccess('Reminder queued', res.message || `A reminder email was queued for ${member.fullName}.`)
      } else {
        showToastError('Could not send reminder', res.error)
      }
    } catch {
      showToastError('Could not send reminder', 'Please try again.')
    } finally {
      reminderLock.current = false
      setPendingReminderId(null)
    }
  }

  const handleSendBatchReminders = async () => {
    if (reminderLock.current) return
    reminderLock.current = true
    setIsSendingBatch(true)
    const pendingIds = pendingMembers.map((m) => m.id)
    try {
      const res = await sendRemindersAction(pendingIds)
      if (res.success) {
        showToastSuccess('Batch reminders queued', res.message || `Gentle reminders queued for ${pendingMembers.length} members.`)
      } else {
        showToastError('Could not send reminders', res.error)
      }
    } catch {
      showToastError('Could not send reminders', 'Please try again.')
    } finally {
      reminderLock.current = false
      setIsSendingBatch(false)
    }
  }

  const recordedCount = recordedMemberIds.size
  const pendingCount = Math.max(0, members.length - recordedCount)
  const percentage = members.length > 0 ? Math.round((recordedCount / members.length) * 100) : 0
  const isLeader = userRole === 'LEADER' || userRole === 'ADMIN'

  return (
    <div className="space-y-6">
      {/* Top Header matching Reference */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-sans">
            Choir Members
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Directory and monthly contribution tracking across choir voice sections.
          </p>
        </div>

        {/* Section 74: Progress & Batch Follow-up Action */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200/80 flex items-center gap-2.5 text-xs shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-emerald-900 font-semibold">
              {new Date().toLocaleString('en-US', { month: 'long' })}: <strong>{recordedCount} / {members.length}</strong> ({percentage}%)
            </span>
          </div>

          {isLeader && (
            <>
            <Link href="/members/invitations" className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-4 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50">
              <MailPlus className="h-3.5 w-3.5" /> Invite user
            </Link>
            <Link href="/communications" className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white px-4 py-2 text-xs font-semibold text-cyan-700 hover:bg-cyan-50">
              <MessagesSquare className="h-3.5 w-3.5" /> Communicate
            </Link>
            <button
              onClick={handleSendBatchReminders}
              disabled={isSendingBatch || pendingReminderId !== null || pendingCount === 0}
              aria-busy={isSendingBatch}
              className="brand-button inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold shrink-0 disabled:cursor-wait disabled:opacity-60"
            >
              {isSendingBatch ? <LoaderCircle className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>{isSendingBatch ? 'Sending...' : `Remind ${pendingCount} Pending`}</span>
            </button>
            </>
          )}
        </div>
      </div>

      {/* Filter Bar & Controls */}
      <div className="card-surface p-3.5 sm:p-5 space-y-4 min-w-0">
        {/* Section 74 Drilldown Tabs: All (50) | Recorded (42) | Not Recorded (8) */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100/80 text-xs font-medium overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveStatus('all')}
              className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
                activeStatus === 'all'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              All Members ({members.length})
            </button>
            <button
              onClick={() => setActiveStatus('recorded')}
              className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
                activeStatus === 'recorded'
                  ? 'bg-white text-emerald-700 font-bold shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Recorded ({recordedCount})
            </button>
            <button
              onClick={() => setActiveStatus('pending')}
              className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
                activeStatus === 'pending'
                  ? 'bg-white text-amber-700 font-bold shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Not Recorded ({pendingCount})
            </button>
          </div>

          {/* Voice Part Filters */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100/60 text-xs font-medium overflow-x-auto max-w-full">
            {['all', 'Soprano', 'Alto', 'Tenor', 'Bass'].map((part) => (
              <button
                key={part}
                onClick={() => setActiveVoice(part)}
                className={`px-3 py-1.5 rounded-xl transition-all capitalize whitespace-nowrap ${
                  activeVoice === part
                    ? 'bg-white text-indigo-700 font-bold shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {part === 'all' ? 'All Sections' : part}
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar matching reference */}
        <div className="frosted-search-pill relative max-w-md px-3.5 py-2 flex items-center">
          <Search className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
          <input
            type="text"
            placeholder="Search choir member by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none border-0 ring-0 shadow-none"
          />
        </div>

        {/* Member Grid */}
        <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredMembers.map((member) => {
            const isRecorded = recordedMemberIds.has(member.id)

            return (
              <div
                key={member.id}
                className="p-4 sm:p-5 rounded-[24px] sm:rounded-[26px] bg-white/85 backdrop-blur-xl border border-white/95 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.03),0_12px_32px_-4px_rgba(15,23,42,0.06),0_0_0_1px_rgba(255,255,255,0.9)_inset] hover:shadow-[0_8px_28px_-2px_rgba(15,23,42,0.06),0_20px_44px_-4px_rgba(15,23,42,0.08),0_0_0_1px_rgba(255,255,255,1)_inset] hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-50 to-slate-100 text-indigo-700 font-bold text-xs flex items-center justify-center border border-slate-150 shadow-xs">
                        {member.fullName
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900 leading-tight">
                          {member.fullName}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {member.voicePart}
                        </span>
                      </div>
                    </div>

                    {isRecorded ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[11px] font-bold">
                        Recorded
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/60 text-[11px] font-bold">
                        Pending
                      </span>
                    )}
                  </div>

                  {member.phone && (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{member.phone}</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">
                    Joined {member.joinedDate}
                  </span>

                  {!isRecorded && isLeader && (
                    <button
                      onClick={() => void handleSendSingleReminder(member)}
                      disabled={isSendingBatch || pendingReminderId !== null}
                      aria-busy={pendingReminderId === member.id}
                      className="liquid-silver-button liquid-silver-button-sm text-amber-800 flex items-center gap-1 shadow-xs disabled:cursor-wait disabled:opacity-60"
                    >
                      {pendingReminderId === member.id ? <LoaderCircle className="w-3 h-3 animate-spin" /> : <BellRing className="w-3 h-3" />}
                      <span>{pendingReminderId === member.id ? 'Queueing…' : 'Remind'}</span>
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
