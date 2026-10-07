'use client'

import * as React from 'react'
import Link from 'next/link'
import { Check, Clock, User, X, PlusCircle, BellRing, Sparkles } from 'lucide-react'
import { AuditLogEntry, FinancialRecord } from '@/types'
import { formatCurrency } from '@/lib/utils/currency'
import { formatDate } from '@/lib/utils/date'

interface RecentActivityFeedProps {
  auditLogs?: AuditLogEntry[]
  records?: FinancialRecord[]
}

export function RecentActivityFeed({ auditLogs = [], records = [] }: RecentActivityFeedProps) {
  // Use real audit logs if available, otherwise real records
  const items = React.useMemo(() => {
    if (auditLogs && auditLogs.length > 0) {
      return auditLogs.slice(0, 5).map((log) => {
        const isApproved = log.action === 'RECORD_APPROVED'
        const isRejected = log.action === 'RECORD_REJECTED'
        const isCreated = log.action === 'RECORD_CREATED'
        const isReminders = log.action === 'MEMBER_REMINDERS_DISPATCHED'

        const details = (log.details || {}) as any

        let title = 'Activity logged'
        let color: 'emerald' | 'amber' | 'rose' | 'purple' | 'blue' = 'blue'

        if (isCreated) {
          title = details?.description || 'New financial record added'
          color = 'emerald'
        } else if (isApproved) {
          title = 'Transaction verified & approved'
          color = 'emerald'
        } else if (isRejected) {
          title = 'Pending transaction rejected'
          color = 'rose'
        } else if (isReminders) {
          title = `Reminded ${details?.count || 'choir'} members`
          color = 'purple'
        }

        return {
          id: log.id,
          title,
          subtitle: `By ${log.actorName}`,
          date: formatDate(log.createdAt),
          color,
          isApproved,
          isRejected,
          isCreated,
          isReminders
        }
      })
    }

    // Fallback to recent records
    return records.slice(0, 5).map((rec) => {
      const isRecorded = rec.status === 'recorded'
      const isPending = rec.status === 'needs_review'
      return {
        id: rec.id,
        title: rec.description,
        subtitle: `${rec.categoryName || 'Transaction'} • ${formatCurrency(rec.amount)}`,
        date: formatDate(rec.recordDate),
        color: (isRecorded ? 'emerald' : isPending ? 'amber' : 'rose') as 'emerald' | 'amber' | 'rose',
        isApproved: isRecorded,
        isRejected: rec.status === 'rejected',
        isCreated: true,
        isReminders: false
      }
    })
  }, [auditLogs, records])

  return (
    <div className="card-surface p-4 sm:p-6 bg-white flex flex-col justify-between h-full min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-900 tracking-tight">
          Recent Activity
        </h3>
        <Link
          href="/activity"
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          View All
        </Link>
      </div>

      {/* Real Activity List */}
      {items.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400">
          No recent activity entries recorded yet.
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((act) => (
            <div key={act.id} className="flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {act.color === 'emerald' && (
                  <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                )}
                {act.color === 'amber' && (
                  <div className="w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
                    <Clock className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                )}
                {act.color === 'purple' && (
                  <div className="w-7 h-7 rounded-full bg-purple-500 text-white flex items-center justify-center shrink-0">
                    <BellRing className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                )}
                {act.color === 'rose' && (
                  <div className="w-7 h-7 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0">
                    <X className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                )}
                {act.color === 'blue' && (
                  <div className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0">
                    <PlusCircle className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-slate-900 text-xs truncate leading-tight">
                    {act.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    {act.subtitle}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[11px] text-slate-400 font-medium">
                  {act.date}
                </span>
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    act.color === 'emerald'
                      ? 'bg-emerald-500'
                      : act.color === 'amber'
                      ? 'bg-amber-500'
                      : act.color === 'purple'
                      ? 'bg-purple-500'
                      : act.color === 'rose'
                      ? 'bg-rose-500'
                      : 'bg-blue-500'
                  }`}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
