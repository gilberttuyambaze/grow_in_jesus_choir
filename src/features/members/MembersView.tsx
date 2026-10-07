'use client'

import * as React from 'react'
import { Users, Search, CheckCircle2, Clock, Phone, BellRing, Sparkles } from 'lucide-react'
import { Member, UserRole } from '@/types'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

interface MembersViewProps {
  members: Member[]
  userRole: UserRole
}

export function MembersView({ members, userRole }: MembersViewProps) {
  const [activeVoice, setActiveVoice] = React.useState<string>('all')
  const [activeStatus, setActiveStatus] = React.useState<'all' | 'recorded' | 'pending'>('all')
  const [search, setSearch] = React.useState('')
  const [reminderSent, setReminderSent] = React.useState<string | null>(null)

  // Simulation: The first 42 members have recorded October contributions, last 8 have not
  const recordedMemberIds = React.useMemo(() => {
    return new Set(members.slice(0, 42).map((m) => m.id))
  }, [members])

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

  const handleSendReminder = (memberName: string) => {
    setReminderSent(memberName)
    setTimeout(() => setReminderSent(null), 3000)
  }

  const recordedCount = 42
  const pendingCount = 8
  const percentage = Math.round((recordedCount / members.length) * 100)

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif text-[#1e382d] tracking-tight">
            Choir Members
          </h1>
          <p className="text-xs text-[#71857a] mt-0.5">
            Directory and monthly contribution tracking across choir voice sections.
          </p>
        </div>

        {/* Progress Pill */}
        <div className="px-4 py-2 rounded-2xl bg-[#e3efe6] border border-[#cfe2d4] flex items-center gap-3 text-xs">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="text-[#204033] font-medium">
            October Progress: <strong>{recordedCount} of {members.length} ({percentage}%)</strong>
          </span>
        </div>
      </div>

      {reminderSent && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Gentle contribution reminder queued for <strong>{reminderSent}</strong>.</span>
        </div>
      )}

      {/* Filter Bar & Controls */}
      <Card className="p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Voice Part Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#f0f4f1] text-xs font-medium overflow-x-auto">
            {['all', 'Soprano', 'Alto', 'Tenor', 'Bass'].map((part) => (
              <button
                key={part}
                onClick={() => setActiveVoice(part)}
                className={`px-3 py-1.5 rounded-lg transition-all capitalize whitespace-nowrap ${
                  activeVoice === part
                    ? 'bg-white text-[#1f3f33] font-semibold shadow-xs'
                    : 'text-[#61746a] hover:text-[#1f3f33]'
                }`}
              >
                {part === 'all' ? 'All Sections' : part}
              </button>
            ))}
          </div>

          {/* Status Filter & Search */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 text-[#889a90] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search member by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[#dbe4dd] bg-[#fafcfa] text-xs text-[#203a30] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3e6b57]"
              />
            </div>

            <select
              value={activeStatus}
              onChange={(e) => setActiveStatus(e.target.value as any)}
              className="py-1.5 px-3 rounded-xl border border-[#dbe4dd] bg-[#fafcfa] text-xs text-[#203a30] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3e6b57]"
            >
              <option value="all">All Statuses</option>
              <option value="recorded">Recorded ({recordedCount})</option>
              <option value="pending">Not Recorded ({pendingCount})</option>
            </select>
          </div>
        </div>

        {/* Member Grid */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredMembers.map((member) => {
            const isRecorded = recordedMemberIds.has(member.id)

            return (
              <div
                key={member.id}
                className="p-4 rounded-2xl border border-[#e4eae5] bg-white hover:border-[#83a993] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#e6ede8] text-[#294c3d] font-bold text-xs flex items-center justify-center">
                        {member.fullName
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')}
                      </div>
                      <div>
                        <h4 className="font-semibold text-xs text-[#1e382d] leading-tight">
                          {member.fullName}
                        </h4>
                        <span className="text-[10px] text-[#788a80]">
                          {member.voicePart}
                        </span>
                      </div>
                    </div>

                    {isRecorded ? (
                      <Badge variant="recorded">Recorded</Badge>
                    ) : (
                      <Badge variant="review">Pending</Badge>
                    )}
                  </div>

                  {member.phone && (
                    <div className="flex items-center gap-1.5 text-[11px] text-[#697d72] mt-3">
                      <Phone className="w-3 h-3 text-[#94a59c]" />
                      <span>{member.phone}</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 mt-3 border-t border-[#f0f4f1] flex items-center justify-between text-[11px]">
                  <span className="text-[#84958c]">
                    Joined: {member.joinedDate}
                  </span>

                  {!isRecorded && userRole === 'LEADER' && (
                    <button
                      onClick={() => handleSendReminder(member.fullName)}
                      className="px-2 py-0.5 rounded-lg bg-[#fbf3e6] text-[#9b6826] hover:bg-[#fae8ce] font-semibold transition-colors flex items-center gap-1"
                    >
                      <BellRing className="w-3 h-3" />
                      Remind
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
