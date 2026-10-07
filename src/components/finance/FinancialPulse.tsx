'use client'

import * as React from 'react'
import { WalletCards, ArrowUpRight, ArrowDownLeft, ShieldCheck, Sparkles } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/currency'
import { FinancialSummary } from '@/types'

interface FinancialPulseProps {
  summary: FinancialSummary
  onAddRecord?: () => void
}

export function FinancialPulse({ summary, onAddRecord }: FinancialPulseProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#274e41] via-[#2f5c4e] to-[#3c6f5f] text-white p-7 sm:p-8 shadow-[0_12px_40px_rgba(39,78,65,0.18)] border border-[#ffffff15]">
      {/* Subtle Orbital Pulse rings */}
      <div 
        className="absolute -right-20 -top-20 w-80 h-80 rounded-full border border-white/10 pointer-events-none animate-[pulse_6s_ease-in-out_infinite]" 
        aria-hidden="true" 
      />
      <div 
        className="absolute -right-10 -top-10 w-60 h-60 rounded-full border border-white/15 pointer-events-none" 
        aria-hidden="true" 
      />
      <div 
        className="absolute right-10 top-10 w-24 h-24 rounded-full bg-white/[0.03] blur-xl pointer-events-none" 
        aria-hidden="true" 
      />

      <div className="relative z-10 flex flex-col justify-between h-full min-h-[170px]">
        {/* Top Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-[#e5c589] shadow-inner">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
            <span className="text-[11px] font-semibold tracking-widest uppercase text-white/70">
              Financial Pulse
            </span>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-medium text-emerald-100">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block [animation-duration:2.5s]" />
            <span>{summary.healthStatus}</span>
          </div>
        </div>

        {/* Balance Display */}
        <div className="my-5">
          <p className="text-xs text-white/70 font-medium mb-1 tracking-wide">
            Choir Current Balance
          </p>
          <div className="text-3xl sm:text-4xl lg:text-5xl font-serif tracking-tight font-medium text-white flex items-baseline gap-2">
            <span>{formatCurrency(summary.currentBalance)}</span>
          </div>
        </div>

        {/* Bottom Metrics Bar */}
        <div className="pt-4 border-t border-white/15 grid grid-cols-2 sm:grid-cols-3 gap-4 items-center">
          <div>
            <span className="text-[10px] text-white/60 uppercase tracking-wider block">Total Received</span>
            <span className="text-sm font-semibold text-emerald-200 flex items-center gap-1 mt-0.5">
              <ArrowDownLeft className="w-3.5 h-3.5" />
              {formatCurrency(summary.totalIncome)}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-white/60 uppercase tracking-wider block">Total Spent</span>
            <span className="text-sm font-semibold text-amber-200 flex items-center gap-1 mt-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" />
              {formatCurrency(summary.totalExpenses)}
            </span>
          </div>

          <div className="col-span-2 sm:col-span-1 flex items-center justify-start sm:justify-end">
            <div className="text-left sm:text-right">
              <span className="text-[10px] text-white/60 uppercase tracking-wider block">Contribution Progress</span>
              <span className="text-xs font-medium text-white/90 block mt-0.5">
                {summary.membersContributed} of {summary.totalMembers} members ({summary.contributionPercentage}%)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
