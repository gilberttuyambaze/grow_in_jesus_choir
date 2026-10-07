'use client'

import * as React from 'react'
import Link from 'next/link'
import { WalletCards, Sparkles, Music, Bus, Mic } from 'lucide-react'

export function TopCategoriesCard() {
  const categories = [
    { name: 'Member Contributions', rate: '98.5%', amount: '1.28M RWF', icon: WalletCards, color: 'blue' },
    { name: 'Concerts & Events', rate: '97.1%', amount: '850K RWF', icon: Music, color: 'emerald' },
    { name: 'Patrons & Donations', rate: '94.3%', amount: '250K RWF', icon: Sparkles, color: 'purple' },
    { name: 'Audio Equipment', rate: '99.2%', amount: '85K RWF', icon: Mic, color: 'amber' },
    { name: 'Transport Logistics', rate: '95.0%', amount: '30K RWF', icon: Bus, color: 'cyan' },
  ]

  const colorStyles = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    purple: 'bg-purple-50 text-purple-600',
    amber: 'bg-amber-50 text-amber-600',
    cyan: 'bg-cyan-50 text-cyan-600'
  }

  return (
    <div className="card-surface p-4 sm:p-6 bg-white flex flex-col justify-between h-full min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-900 tracking-tight">
          Top Financial Categories
        </h3>
        <Link
          href="/reports"
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          View All
        </Link>
      </div>

      {/* Table Headers */}
      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 pb-2 border-b border-slate-100">
        <span>Category</span>
        <div className="flex items-center gap-3 sm:gap-6">
          <span>Success</span>
          <span>Amount</span>
        </div>
      </div>

      {/* Rows matching Reference */}
      <div className="space-y-3 pt-3">
        {categories.map((c, i) => {
          const Icon = c.icon
          return (
            <div key={i} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${colorStyles[c.color as keyof typeof colorStyles]}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="font-semibold text-slate-900 truncate">
                  {c.name}
                </span>
              </div>

              <div className="flex items-center gap-3 sm:gap-6 shrink-0">
                <span className="font-medium text-slate-600 text-right w-10">
                  {c.rate}
                </span>
                <span className="font-bold text-slate-900 text-right min-w-[4.5rem]">
                  {c.amount}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

