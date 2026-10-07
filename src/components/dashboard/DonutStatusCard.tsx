'use client'

import * as React from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export function DonutStatusCard() {
  // SVG circular stroke calculation for radius=44 (circumference ≈ 276.5)
  // Active/Recorded: 84% -> 232
  // Blue/Pending: 8% -> 22
  // Amber/In Review: 6% -> 16
  // Red/Needs Attention: 2% -> 6

  return (
    <div className="card-surface p-5 sm:p-6 bg-white flex flex-col justify-between h-full min-w-0">
      {/* Header */}
      <div className="mb-2">
        <h3 className="text-sm font-bold text-slate-900 tracking-tight truncate">
          Financial Records Status
        </h3>
      </div>

      {/* Donut Chart & Legend (Responsive on all viewports) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-3">
        {/* SVG Donut */}
        <div className="relative w-32 h-32 sm:w-36 sm:h-36 flex items-center justify-center shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 110 110">
            {/* Background circle */}
            <circle
              cx="55"
              cy="55"
              r="44"
              fill="none"
              stroke="#f1f5f9"
              strokeWidth="10"
            />
            {/* Green / Active Segment (84%) */}
            <circle
              cx="55"
              cy="55"
              r="44"
              fill="none"
              stroke="#10b981"
              strokeWidth="10"
              strokeDasharray="232 282"
              strokeDashoffset="0"
              strokeLinecap="round"
            />
            {/* Blue Segment (8%) */}
            <circle
              cx="55"
              cy="55"
              r="44"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="10"
              strokeDasharray="22 282"
              strokeDashoffset="-234"
              strokeLinecap="round"
            />
            {/* Amber Segment (6%) */}
            <circle
              cx="55"
              cy="55"
              r="44"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="10"
              strokeDasharray="16 282"
              strokeDashoffset="-258"
              strokeLinecap="round"
            />
            {/* Red Segment (2%) */}
            <circle
              cx="55"
              cy="55"
              r="44"
              fill="none"
              stroke="#ef4444"
              strokeWidth="10"
              strokeDasharray="6 282"
              strokeDashoffset="-276"
              strokeLinecap="round"
            />
          </svg>

          {/* Center Text matching Reference */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-2xl font-bold text-slate-900 font-sans leading-none">
              50
            </span>
            <span className="text-[10px] text-slate-400 font-medium mt-1">
              Total Records
            </span>
          </div>
        </div>

        {/* Legend matching Reference */}
        <div className="space-y-2 text-xs w-full sm:flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-slate-600 font-medium">Recorded</span>
            </div>
            <span className="font-bold text-slate-900 font-sans">42</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
              <span className="text-slate-600 font-medium">Pending</span>
            </div>
            <span className="font-bold text-slate-900 font-sans">4</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
              <span className="text-slate-600 font-medium">In Review</span>
            </div>
            <span className="font-bold text-slate-900 font-sans">3</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
              <span className="text-slate-600 font-medium">Discrepancy</span>
            </div>
            <span className="font-bold text-slate-900 font-sans">1</span>
          </div>
        </div>
      </div>

      {/* Footer link matching Reference */}
      <div className="pt-3 border-t border-slate-100 text-center">
        <Link
          href="/finances"
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 transition-colors"
        >
          <span>Manage Financial Records</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  )
}
