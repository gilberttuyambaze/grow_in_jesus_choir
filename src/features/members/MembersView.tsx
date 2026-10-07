'use client'

import * as React from 'react'
import {
  Users,
  Search,
  CheckCircle2,
  Clock,
  Phone,
  BellRing,
  Sparkles,
  Send,
  UserCheck,
  AlertCircle
} from 'lucide-react'
import { Member, FinancialRecord, UserRole } from '@/types'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
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
    const res = await sendRemindersAction([member.id])
    if (res.success) {
      showToastSuccess(
        'Reminder Sent',
        `Gentle reminder dispatched to ${member.fullName}.`
      )
    } else {
      showToastError('Could not send reminder', res.error)
    }
  }

  const handleSendBatchReminders = async () => {
    setIsSendingBatch(true)
    const pendingIds = pendingMembers.map((m) => m.id)
    const res = await sendRemindersAction(pendingIds)
    setIsSendingBatch(false)

    if (res.success) {
      showToastSuccess(
        'Batch Reminders Dispatched',
        res.message || `Gentle reminders sent to ${pendingMembers.length} members.`
      )
    } else {
      showToastError('Could not send reminders', res.error)
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
              October: <strong>{recordedCount} / {members.length}</strong> ({percentage}%)
            </span>
          </div>

          {isLeader && (
            <button
              onClick={handleSendBatchReminders}
              disabled={isSendingBatch}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50 shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSendingBatch ? 'Sending...' : `Remind ${pendingCount} Pending`}</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar & Controls */}
      <div className="card-surface p-3.5 sm:p-5 bg-white space-y-4 min-w-0">
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

        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search choir member by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-full border border-slate-200 bg-slate-50/60 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Member Grid */}
        <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredMembers.map((member) => {
            const isRecorded = recordedMemberIds.has(member.id)

            return (
              <div
                key={member.id}
                className="p-4 rounded-3xl border border-slate-150 bg-white hover:border-indigo-300 hover:shadow-xs transition-all flex flex-col justify-between"
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
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold">
                        Recorded
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[11px] font-bold">
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
                      onClick={() => handleSendSingleReminder(member)}
                      className="px-3 py-1 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold transition-colors flex items-center gap-1 shadow-xs"
                    >
                      <BellRing className="w-3 h-3" />
                      <span>Remind</span>
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
