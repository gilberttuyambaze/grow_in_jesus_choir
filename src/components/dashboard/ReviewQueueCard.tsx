'use client'

import * as React from 'react'
import Link from 'next/link'
import { CheckCircle2, Clock } from 'lucide-react'
import { FinancialRecord } from '@/types'
import { formatCurrency } from '@/lib/utils/currency'
import { formatDate } from '@/lib/utils/date'

import { CrystalBadge } from '@/components/ui/CrystalBadge'

interface ReviewQueueCardProps {
  records?: FinancialRecord[]
}

export function ReviewQueueCard({ records = [] }: ReviewQueueCardProps) {
  const pendingRecords = records.filter((r) => r.status === 'needs_review')

  return (
    <div className="card-surface p-4 sm:p-6 flex flex-col justify-between h-full min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            Leader Review Queue
          </h3>
          {pendingRecords.length > 0 && (
            <span className="glowing-count-pill px-2.5 py-0.5 text-[10px] font-bold">
              {pendingRecords.length}
            </span>
          )}
        </div>
        <Link
          href="/finances?status=needs_review"
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          View All
        </Link>
      </div>

      {/* Queue items matching real database records */}
      {pendingRecords.length === 0 ? (
        <div className="py-8 text-center flex flex-col items-center justify-center">
          <CrystalBadge type="success" size="sm" className="mb-2" />
          <p className="text-xs font-semibold text-slate-800">All records verified!</p>
          <span className="text-[11px] text-slate-400 mt-0.5">No transactions currently awaiting review.</span>
        </div>
      ) : (
        <div className="space-y-3 pt-1">
          {pendingRecords.slice(0, 4).map((rec) => (
            <div key={rec.id} className="p-2.5 rounded-2xl bg-white/60 hover:bg-white/90 border border-white/80 hover:border-amber-200 transition-all flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <CrystalBadge type="warning" size="xs" className="shrink-0" />

                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-slate-900 truncate leading-tight">
                    {rec.description}
                  </h4>
                  <span className="text-[11px] text-slate-400 mt-0.5 block truncate">
                    {formatDate(rec.recordDate)} • {rec.categoryName}
                  </span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="font-bold text-xs text-slate-900 font-sans block">
                  {formatCurrency(rec.amount)}
                </span>
                <span className="text-[10px] text-amber-600 font-semibold block">
                  Pending review
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick link at bottom */}
      <div className="pt-4 mt-3 border-t border-slate-100">
        <Link
          href="/finances?status=needs_review"
          className="liquid-silver-button w-full py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm"
        >
          <span>Verify All Records →</span>
        </Link>
      </div>
    </div>
  )
}
