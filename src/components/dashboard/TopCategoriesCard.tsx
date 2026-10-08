'use client'

import * as React from 'react'
import Link from 'next/link'
import { WalletCards, Sparkles, Music, Bus, Mic, Layers, ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { FinancialRecord } from '@/types'
import { formatCompactCurrency } from '@/lib/utils/currency'

interface TopCategoriesCardProps {
  records?: FinancialRecord[]
}

export function TopCategoriesCard({ records = [] }: TopCategoriesCardProps) {
  // Aggregate real financial records by category
  const topCategories = React.useMemo(() => {
    const map = new Map<string, { name: string; amount: number; count: number; type: string }>()
    let grandTotal = 0

    for (const r of records) {
      if (r.status !== 'recorded') continue
      const catName = r.categoryName || 'Other'
      const existing = map.get(catName) || { name: catName, amount: 0, count: 0, type: r.type }
      existing.amount += r.amount
      existing.count += 1
      map.set(catName, existing)
      grandTotal += r.amount
    }

    return Array.from(map.values())
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
      .map((c, i) => {
        const rate = grandTotal > 0 ? ((c.amount / grandTotal) * 100).toFixed(1) + '%' : '0%'
        const colors = ['blue', 'emerald', 'purple', 'amber', 'cyan'] as const
        return {
          ...c,
          rate,
          color: colors[i % colors.length]
        }
      })
  }, [records])

  const colorStyles = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    purple: 'bg-purple-50 text-purple-600',
    amber: 'bg-amber-50 text-amber-600',
    cyan: 'bg-cyan-50 text-cyan-600'
  }

  return (
    <div className="card-surface p-4 sm:p-6 flex flex-col justify-between h-full min-w-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-900 tracking-tight">
          Top Financial Categories
        </h3>
        <Link
          href="/reports"
          className="liquid-silver-button liquid-silver-button-sm text-[11px] font-semibold text-slate-700"
        >
          View All →
        </Link>
      </div>

      {/* Table Headers */}
      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 pb-2 border-b border-slate-100">
        <span>Category</span>
        <div className="flex items-center gap-3 sm:gap-6">
          <span>Share</span>
          <span>Amount</span>
        </div>
      </div>

      {/* Rows matching real database data */}
      {topCategories.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400">
          No recorded transactions available yet.
        </div>
      ) : (
        <div className="space-y-3 pt-3">
          {topCategories.map((c, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    colorStyles[c.color]
                  }`}
                >
                  {c.type === 'income' ? (
                    <ArrowDownLeft className="w-3.5 h-3.5 stroke-[2.5]" />
                  ) : (
                    <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
                  )}
                </div>
                <span className="font-semibold text-slate-900 truncate">
                  {c.name}
                </span>
              </div>

              <div className="flex items-center gap-3 sm:gap-6 shrink-0">
                <span className="font-medium text-slate-600 text-right w-12">
                  {c.rate}
                </span>
                <span className="font-bold text-slate-900 text-right min-w-[4.5rem] font-sans">
                  {formatCompactCurrency(c.amount)} RWF
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
