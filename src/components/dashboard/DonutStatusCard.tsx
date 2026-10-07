'use client'

import * as React from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { FinancialRecord } from '@/types'

interface DonutStatusCardProps {
  records?: FinancialRecord[]
}

export function DonutStatusCard({ records = [] }: DonutStatusCardProps) {
  const totalCount = records.length

  const recordedCount = records.filter((r) => r.status === 'recorded').length
  const reviewCount = records.filter((r) => r.status === 'needs_review').length
  const rejectedCount = records.filter((r) => r.status === 'rejected').length
  const voidedCount = records.filter((r) => r.status === 'voided').length

  // Circumference for r=44: 2 * π * 44 ≈ 276.46
  const circumference = 276.46

  const calcDash = (count: number) => {
    if (totalCount === 0) return 0
    return (count / totalCount) * circumference
  }

  const recordedDash = calcDash(recordedCount)
  const reviewDash = calcDash(reviewCount)
  const rejectedDash = calcDash(rejectedCount)
  const voidedDash = calcDash(voidedCount)

  // Accumulate offsets
  const reviewOffset = -recordedDash
  const rejectedOffset = reviewOffset - reviewDash
  const voidedOffset = rejectedOffset - rejectedDash

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

            {/* Recorded Segment (Emerald) */}
            {recordedCount > 0 && (
              <circle
                cx="55"
                cy="55"
                r="44"
                fill="none"
                stroke="#10b981"
                strokeWidth="10"
                strokeDasharray={`${recordedDash} ${circumference}`}
                strokeDashoffset="0"
                strokeLinecap="round"
              />
            )}

            {/* Needs Review Segment (Amber) */}
            {reviewCount > 0 && (
              <circle
                cx="55"
                cy="55"
                r="44"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="10"
                strokeDasharray={`${reviewDash} ${circumference}`}
                strokeDashoffset={reviewOffset}
                strokeLinecap="round"
              />
            )}

            {/* Rejected Segment (Rose) */}
            {rejectedCount > 0 && (
              <circle
                cx="55"
                cy="55"
                r="44"
                fill="none"
                stroke="#ef4444"
                strokeWidth="10"
                strokeDasharray={`${rejectedDash} ${circumference}`}
                strokeDashoffset={rejectedOffset}
                strokeLinecap="round"
              />
            )}

            {/* Voided Segment (Slate) */}
            {voidedCount > 0 && (
              <circle
                cx="55"
                cy="55"
                r="44"
                fill="none"
                stroke="#94a3b8"
                strokeWidth="10"
                strokeDasharray={`${voidedDash} ${circumference}`}
                strokeDashoffset={voidedOffset}
                strokeLinecap="round"
              />
            )}
          </svg>

          {/* Center Text matching Reference */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-2xl font-bold text-slate-900 font-sans leading-none">
              {totalCount}
            </span>
            <span className="text-[10px] text-slate-400 font-medium mt-1">
              Total Records
            </span>
          </div>
        </div>

        {/* Legend matching Real Database Data */}
        <div className="space-y-2 text-xs w-full sm:flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-slate-600 font-medium">Recorded</span>
            </div>
            <span className="font-bold text-slate-900 font-sans">{recordedCount}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
              <span className="text-slate-600 font-medium">Needs Review</span>
            </div>
            <span className="font-bold text-slate-900 font-sans">{reviewCount}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
              <span className="text-slate-600 font-medium">Rejected</span>
            </div>
            <span className="font-bold text-slate-900 font-sans">{rejectedCount}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
              <span className="text-slate-600 font-medium">Voided</span>
            </div>
            <span className="font-bold text-slate-900 font-sans">{voidedCount}</span>
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
