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
  ChevronDown
} from 'lucide-react'
import { FinancialRecord, FinancialCategory, UserRole } from '@/types'
import { FinancialRecordTable } from '@/components/finance/FinancialRecordTable'
import { formatCurrency } from '@/lib/utils/currency'
import { Card } from '@/components/ui/Card'

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
        if (!matchDesc && !matchCat && !matchPerson) return false
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

  return (
    <div className="space-y-6">
      {/* Top Banner & Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif text-[#1e382d] tracking-tight">
            Financial Records
          </h1>
          <p className="text-xs text-[#71857a] mt-0.5">
            Complete transaction ledger of income, member contributions, and expenses.
          </p>
        </div>

        {/* Quick totals pill */}
        <div className="flex items-center gap-2 text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800 font-semibold">
            +{formatCurrency(totalReceived)}
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-100 text-amber-800 font-semibold">
            -{formatCurrency(totalSpent)}
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <Card className="p-4 sm:p-5">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#f0f4f1] text-xs font-medium overflow-x-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                activeTab === 'all'
                  ? 'bg-white text-[#1f3f33] font-semibold shadow-xs'
                  : 'text-[#61746a] hover:text-[#1f3f33]'
              }`}
            >
              All Records ({records.length})
            </button>
            <button
              onClick={() => setActiveTab('income')}
              className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                activeTab === 'income'
                  ? 'bg-white text-[#1f3f33] font-semibold shadow-xs'
                  : 'text-[#61746a] hover:text-[#1f3f33]'
              }`}
            >
              Money Received
            </button>
            <button
              onClick={() => setActiveTab('expense')}
              className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                activeTab === 'expense'
                  ? 'bg-white text-[#1f3f33] font-semibold shadow-xs'
                  : 'text-[#61746a] hover:text-[#1f3f33]'
              }`}
            >
              Money Spent
            </button>
            <button
              onClick={() => setActiveTab('needs_review')}
              className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap flex items-center gap-1 ${
                activeTab === 'needs_review'
                  ? 'bg-white text-[#a16828] font-semibold shadow-xs'
                  : 'text-[#a16828] hover:text-[#744715]'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Needs Review</span>
            </button>
          </div>

          {/* Search & Category Filter */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 text-[#889a90] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Filter by name/detail..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[#dbe4dd] bg-[#fafcfa] text-xs text-[#203a30] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3e6b57]"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="py-1.5 px-3 rounded-xl border border-[#dbe4dd] bg-[#fafcfa] text-xs text-[#203a30] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3e6b57]"
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
        <div className="mt-5">
          <FinancialRecordTable records={filteredRecords} userRole={userRole} />
        </div>
      </Card>
    </div>
  )
}
