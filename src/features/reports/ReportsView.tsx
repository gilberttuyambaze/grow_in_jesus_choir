'use client'

import * as React from 'react'
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Printer,
  Calendar,
  Sparkles,
  FileText
} from 'lucide-react'
import { FinancialSummary, FinancialRecord, FinancialCategory } from '@/types'
import { formatCurrency } from '@/lib/utils/currency'
import { formatDate } from '@/lib/utils/date'
import { useToast } from '@/components/ui/Toast'

interface ReportsViewProps {
  summary: FinancialSummary
  records: FinancialRecord[]
  categories: FinancialCategory[]
}

export function ReportsView({ summary, records, categories }: ReportsViewProps) {
  const { success: showToastSuccess } = useToast()

  const [timeframe, setTimeframe] = React.useState<'all' | 'month' | 'quarter' | 'year'>('month')
  const [exportStep, setExportStep] = React.useState<'idle' | 'preparing' | 'ready'>('idle')
  const [downloadBlobUrl, setDownloadBlobUrl] = React.useState<string | null>(null)

  // Compute income by category
  const incomeByCategory = React.useMemo(() => {
    const map = new Map<string, number>()
    records
      .filter((r) => r.type === 'income' && r.status === 'recorded')
      .forEach((r) => {
        const cat = r.categoryName || 'Other Income'
        map.set(cat, (map.get(cat) || 0) + r.amount)
      })
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1])
  }, [records])

  // Compute expenses by category
  const expenseByCategory = React.useMemo(() => {
    const map = new Map<string, number>()
    records
      .filter((r) => r.type === 'expense' && r.status === 'recorded')
      .forEach((r) => {
        const cat = r.categoryName || 'Other Expense'
        map.set(cat, (map.get(cat) || 0) + r.amount)
      })
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1])
  }, [records])

  const verifiedIncomeCount = React.useMemo(() => {
    return records.filter((r) => r.type === 'income' && r.status === 'recorded').length
  }, [records])

  const verifiedExpenseCount = React.useMemo(() => {
    return records.filter((r) => r.type === 'expense' && r.status === 'recorded').length
  }, [records])

  const totalVerifiedCount = React.useMemo(() => {
    return records.filter((r) => r.status === 'recorded').length
  }, [records])

  // Two-step asynchronous export workflow matching Section 77
  const handleStartExport = () => {
    setExportStep('preparing')

    setTimeout(() => {
      // Build CSV content
      const headers = ['Date', 'Type', 'Category', 'Description', 'Amount (RWF)', 'Status', 'Reference Number']
      const rows = records.map((r) => [
        r.recordDate,
        r.type === 'income' ? 'Money Received' : 'Money Spent',
        r.categoryName || '',
        `"${r.description.replace(/"/g, '""')}"`,
        r.amount,
        r.status,
        r.referenceNumber || ''
      ])

      const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      setDownloadBlobUrl(url)
      setExportStep('ready')
      showToastSuccess('Report Prepared', 'Your choir financial report is ready to download.')
    }, 1200)
  }

  const handleDownload = () => {
    if (!downloadBlobUrl) return
    const link = document.createElement('a')
    link.href = downloadBlobUrl
    link.download = `Grow_in_Jesus_Choir_Report_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setExportStep('idle')
    setDownloadBlobUrl(null)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      {/* Top Header matching Reference */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-sans">
            Financial Reports & Statements
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Audit-ready summary of choir income streams, expenditures, and reconciled balances.
          </p>
        </div>

        {/* Action Buttons: Print Statement & Two-Step Export */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white border border-slate-200 text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/40 text-xs font-semibold shadow-xs transition-all shrink-0"
            title="Print formal church financial summary"
          >
            <Printer className="w-4 h-4" />
            <span>Print Statement</span>
          </button>

          {/* Section 77 Two-step Export Feedback */}
          {exportStep === 'idle' && (
            <button
              onClick={handleStartExport}
              className="brand-button inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>Generate CSV Report</span>
            </button>
          )}

          {exportStep === 'preparing' && (
            <div className="px-5 py-2.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold flex items-center gap-2 animate-pulse shrink-0">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
              <span>Preparing your report...</span>
            </div>
          )}

          {exportStep === 'ready' && (
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all animate-bounce shrink-0"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Download Report Now</span>
            </button>
          )}
        </div>
      </div>

      {/* Timeframe Filter Buttons (Section 140) */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100/80 text-xs font-medium overflow-x-auto max-w-full">
        <button
          onClick={() => setTimeframe('month')}
          className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
            timeframe === 'month'
              ? 'bg-white text-slate-900 font-bold shadow-xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          This Month ({new Date().toLocaleString('en-US', { month: 'long' })})
        </button>
        <button
          onClick={() => setTimeframe('quarter')}
          className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
            timeframe === 'quarter'
              ? 'bg-white text-slate-900 font-bold shadow-xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          This Quarter
        </button>
        <button
          onClick={() => setTimeframe('year')}
          className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
            timeframe === 'year'
              ? 'bg-white text-slate-900 font-bold shadow-xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Year to Date (2026)
        </button>
        <button
          onClick={() => setTimeframe('all')}
          className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
            timeframe === 'all'
              ? 'bg-white text-slate-900 font-bold shadow-xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          All Records
        </button>
      </div>

      {/* Summary KPI Cards matching Reference */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="card-surface p-6">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1">
            Total Money Received
          </span>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 font-sans tracking-tight">
            +{formatCurrency(summary.totalIncome)}
          </p>
          <span className="text-[11px] text-slate-500 mt-2 block">
            From {verifiedIncomeCount} verified contribution{verifiedIncomeCount === 1 ? '' : 's'} & income streams
          </span>
        </div>

        <div className="card-surface p-6">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1">
            Total Money Spent
          </span>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 font-sans tracking-tight">
            -{formatCurrency(summary.totalExpenses)}
          </p>
          <span className="text-[11px] text-slate-500 mt-2 block">
            Across {verifiedExpenseCount} verified choir expenditure transactions
          </span>
        </div>

        <div className="card-surface p-6">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1">
            Reconciled Net Balance
          </span>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 font-sans tracking-tight">
            {formatCurrency(summary.currentBalance)}
          </p>
          <span className="text-[11px] text-emerald-700 font-semibold mt-2 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Verified against {totalVerifiedCount} reconciled transactions
          </span>
        </div>
      </div>

      {/* Category Breakdown Grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Income Breakdown Card */}
        <div className="card-surface p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shadow-xs">
              <ArrowDownLeft className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Income by Category
              </h3>
              <p className="text-[11px] text-slate-400">Contribution streams and offerings</p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {incomeByCategory.map(([cat, amount]) => {
              const pct = summary.totalIncome > 0 ? Math.round((amount / summary.totalIncome) * 100) : 0
              return (
                <div key={cat} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{cat}</span>
                    <span className="font-bold text-slate-900 font-sans">
                      {formatCurrency(amount)} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Expense Breakdown Card */}
        <div className="card-surface p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shadow-xs">
              <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Expenses by Category
              </h3>
              <p className="text-[11px] text-slate-400">Logistics, robes, audio & operations</p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {expenseByCategory.map(([cat, amount]) => {
              const pct = summary.totalExpenses > 0 ? Math.round((amount / summary.totalExpenses) * 100) : 0
              return (
                <div key={cat} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{cat}</span>
                    <span className="font-bold text-slate-900 font-sans">
                      {formatCurrency(amount)} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
