'use client'

import * as React from 'react'
import Link from 'next/link'
import { CheckCircle2, Clock } from 'lucide-react'
import { FinancialRecord } from '@/types'
import { formatCurrency } from '@/lib/utils/currency'
import { formatDate } from '@/lib/utils/date'

interface ReviewQueueCardProps {
  records?: FinancialRecord[]
}

export function ReviewQueueCard({ records = [] }: ReviewQueueCardProps) {
  const pendingRecords = records.filter((r) => r.status === 'needs_review')

  const badgeStyles = [
    'bg-amber-100/70 text-amber-800',
    'bg-purple-100/70 text-purple-800',
    'bg-indigo-100/70 text-indigo-800',
    'bg-blue-100/70 text-blue-800'
  ]

  return (
    <div className="card-surface p-4 sm:p-6 bg-white flex flex-col justify-between h-full min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            Leader Review Queue
          </h3>
          {pendingRecords.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold">
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
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 shadow-xs">
            <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
          </div>
          <p className="text-xs font-semibold text-slate-800">All records verified!</p>
          <span className="text-[11px] text-slate-400 mt-0.5">No transactions currently awaiting review.</span>
        </div>
      ) : (
        <div className="space-y-3.5">
          {pendingRecords.slice(0, 4).map((rec, idx) => (
            <div key={rec.id} className="flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div
                  className={`w-8 h-8 rounded-xl font-bold flex items-center justify-center shrink-0 text-xs ${
                    badgeStyles[idx % badgeStyles.length]
                  }`}
                >
                  {idx + 1}
                </div>

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
      <div className="pt-4 mt-2 border-t border-slate-100">
        <Link
          href="/finances?status=needs_review"
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center justify-center gap-1"
        >
          <span>Verify All Records →</span>
        </Link>
      </div>
    </div>
  )
}
