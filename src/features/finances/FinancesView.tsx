'use client'

import * as React from 'react'
import {
  WalletCards,
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ChevronDown,
  Sparkles
} from 'lucide-react'
import { FinancialRecord, FinancialCategory, UserRole } from '@/types'
import { FinancialRecordTable } from '@/components/finance/FinancialRecordTable'
import { formatCurrency } from '@/lib/utils/currency'

interface FinancesViewProps {
  records: FinancialRecord[]
  categories: FinancialCategory[]
  userRole: UserRole
}

export function FinancesView({ records, categories, userRole }: FinancesViewProps) {
  const [activeTab, setActiveTab] = React.useState<'all' | 'income' | 'expense' | 'needs_review'>('all')
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all')
  const [search, setSearch] = React.useState('')

  const filteredRecords = React.useMemo(() => {
    return records.filter((r) => {
      // Tab filter
      if (activeTab === 'income' && r.type !== 'income') return false
      if (activeTab === 'expense' && r.type !== 'expense') return false
      if (activeTab === 'needs_review' && r.status !== 'needs_review') return false

      // Category filter
      if (selectedCategory !== 'all' && r.categoryId !== selectedCategory) return false

      // Search filter
      if (search.trim()) {
        const query = search.toLowerCase()
        const matchDesc = r.description.toLowerCase().includes(query)
        const matchCat = r.categoryName?.toLowerCase().includes(query)
        const matchPerson = (r.memberName || r.recordedByName)?.toLowerCase().includes(query)
        const matchRef = r.referenceNumber?.toLowerCase().includes(query)
        if (!matchDesc && !matchCat && !matchPerson && !matchRef) return false
      }

      return true
    })
  }, [records, activeTab, selectedCategory, search])

  // Calculate filtered totals
  const totalReceived = React.useMemo(() => {
    return filteredRecords
      .filter((r) => r.type === 'income' && r.status === 'recorded')
      .reduce((sum, r) => sum + r.amount, 0)
  }, [filteredRecords])

  const totalSpent = React.useMemo(() => {
    return filteredRecords
      .filter((r) => r.type === 'expense' && r.status === 'recorded')
      .reduce((sum, r) => sum + r.amount, 0)
  }, [filteredRecords])

  const pendingCount = React.useMemo(() => {
    return records.filter((r) => r.status === 'needs_review').length
  }, [records])

  return (
    <div className="space-y-6">
      {/* Top Banner & Summary matching Reference */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-sans">
            Financial Records
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Complete transaction ledger of income, member contributions, and expenses.
          </p>
        </div>

        {/* Quick totals pill */}
        <div className="flex items-center gap-2 text-xs">
          <div className="px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 font-bold">
            +{formatCurrency(totalReceived)}
          </div>
          <div className="px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200/80 text-amber-800 font-bold">
            -{formatCurrency(totalSpent)}
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="card-surface p-5 bg-white space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 pb-2 border-b border-slate-100">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100/80 text-xs font-medium overflow-x-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
                activeTab === 'all'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              All Records ({records.length})
            </button>
            <button
              onClick={() => setActiveTab('income')}
              className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
                activeTab === 'income'
                  ? 'bg-white text-indigo-700 font-bold shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Money Received
            </button>
            <button
              onClick={() => setActiveTab('expense')}
              className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
                activeTab === 'expense'
                  ? 'bg-white text-amber-700 font-bold shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Money Spent
            </button>
            <button
              onClick={() => setActiveTab('needs_review')}
              className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'needs_review'
                  ? 'bg-white text-rose-700 font-bold shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-rose-500" />
              <span>Needs Review ({pendingCount})</span>
            </button>
          </div>

          {/* Search & Category Filter */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search description, member, ref..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-full border border-slate-200 bg-slate-50/60 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="py-2 px-3.5 rounded-full border border-slate-200 bg-slate-50/60 text-xs text-slate-700 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Financial Record Table & Mobile Cards */}
        <div className="pt-2">
          <FinancialRecordTable records={filteredRecords} userRole={userRole} />
        </div>
      </div>
    </div>
  )
}
