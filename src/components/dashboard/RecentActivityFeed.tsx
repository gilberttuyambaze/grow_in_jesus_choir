'use client'

import * as React from 'react'
import Link from 'next/link'
import { Check, Clock, User, X, PlusCircle, BellRing, Sparkles } from 'lucide-react'
import { AuditLogEntry, FinancialRecord } from '@/types'
import { formatCurrency } from '@/lib/utils/currency'
import { formatDate } from '@/lib/utils/date'
import { CrystalBadge } from '@/components/ui/CrystalBadge'

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
    <div className="card-surface p-4 sm:p-6 flex flex-col justify-between h-full min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-900 tracking-tight">
          Recent Activity
        </h3>
        <Link
          href="/activity"
          className="liquid-silver-button liquid-silver-button-sm text-[11px] font-semibold text-slate-700"
        >
          View All →
        </Link>
      </div>

      {/* Real Activity List */}
      {items.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400">
          No recent activity entries recorded yet.
        </div>
      ) : (
        <div className="space-y-3.5 pt-1">
          {items.map((act) => (
            <div key={act.id} className="p-2.5 rounded-2xl bg-white/60 hover:bg-white/90 border border-white/80 hover:border-slate-200 transition-all flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                {act.color === 'emerald' && <CrystalBadge type="success" size="xs" className="shrink-0" />}
                {act.color === 'amber' && <CrystalBadge type="warning" size="xs" className="shrink-0" />}
                {act.color === 'purple' && <CrystalBadge type="purple" size="xs" className="shrink-0" />}
                {act.color === 'rose' && <CrystalBadge type="alert" size="xs" className="shrink-0" />}
                {act.color === 'blue' && <CrystalBadge type="info" size="xs" className="shrink-0" />}

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
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
