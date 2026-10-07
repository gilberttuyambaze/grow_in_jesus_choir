'use client'

import * as React from 'react'
import Link from 'next/link'

export function ReviewQueueCard() {
  const queue = [
    { num: '1', title: 'Sunday Rehearsal Audio Cables', time: 'Submitted 15m ago', color: 'amber' },
    { num: '2', title: 'Late Member Contribution (John D.)', time: 'Submitted 32m ago', color: 'purple' },
    { num: '3', title: 'Bulk SMS Reminders Billing', time: 'Submitted 1h ago', color: 'violet' },
    { num: '4', title: 'Choir Robes Seamstress Repairs', time: 'Submitted 2h ago', color: 'blue' }
  ]

  const badgeStyles = {
    amber: 'bg-amber-100/70 text-amber-800',
    purple: 'bg-purple-100/70 text-purple-800',
    violet: 'bg-indigo-100/70 text-indigo-800',
    blue: 'bg-blue-100/70 text-blue-800'
  }

  return (
    <div className="card-surface p-6 bg-white flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-900 tracking-tight">
          Leader Review Queue
        </h3>
        <Link
          href="/finances?status=needs_review"
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          View All
        </Link>
      </div>

      {/* Queue items matching Reference */}
      <div className="space-y-4">
        {queue.map((item, idx) => (
          <div key={idx} className="flex items-center gap-3 text-xs">
            <div className={`w-8 h-8 rounded-xl font-bold flex items-center justify-center shrink-0 text-xs ${badgeStyles[item.color as keyof typeof badgeStyles]}`}>
              {item.num}
            </div>

            <div className="min-w-0">
              <h4 className="font-semibold text-slate-900 truncate leading-tight">
                {item.title}
              </h4>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                {item.time}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick link at bottom */}
      <div className="pt-4 mt-2 border-t border-slate-100">
        <Link
          href="/finances"
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center justify-center gap-1"
        >
          <span>Verify All Records →</span>
        </Link>
      </div>
    </div>
  )
}

