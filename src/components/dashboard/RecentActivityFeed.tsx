'use client'

import * as React from 'react'
import Link from 'next/link'
import { Check, Clock, User, X, AlertCircle } from 'lucide-react'

export function RecentActivityFeed() {
  const activities = [
    {
      title: 'October Member Contributions',
      subtitle: 'Recorded successfully',
      time: '2m ago',
      type: 'success',
      color: 'emerald'
    },
    {
      title: 'Transport for Rehearsal Team',
      subtitle: 'Waiting for leader review',
      time: '15m ago',
      type: 'pending',
      color: 'amber'
    },
    {
      title: 'Grace Mukamana Donation',
      subtitle: 'Received & confirmed',
      time: '1h ago',
      type: 'success',
      color: 'purple'
    },
    {
      title: 'Microphone Cables Expense',
      subtitle: 'Discrepancy / review needed',
      time: '2h ago',
      type: 'failed',
      color: 'rose'
    },
    {
      title: 'Sunday Worship Audio Vouchers',
      subtitle: 'Recorded successfully',
      time: '3h ago',
      type: 'success',
      color: 'emerald'
    }
  ]

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

      {/* Activity List matching Reference */}
      <div className="space-y-4">
        {activities.map((act, idx) => (
          <div key={idx} className="flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3 min-w-0">
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
                  <User className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
              )}
              {act.color === 'rose' && (
                <div className="w-7 h-7 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0">
                  <X className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
              )}

              <div className="truncate">
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
                {act.time}
              </span>
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  act.color === 'emerald'
                    ? 'bg-emerald-500'
                    : act.color === 'amber'
                    ? 'bg-amber-500'
                    : act.color === 'purple'
                    ? 'bg-purple-500'
                    : 'bg-rose-500'
                }`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

