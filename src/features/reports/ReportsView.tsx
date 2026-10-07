'use client'

import * as React from 'react'
import { BarChart3, Download, FileSpreadsheet, ArrowDownLeft, ArrowUpRight, CheckCircle2 } from 'lucide-react'
import { FinancialSummary, FinancialRecord, FinancialCategory } from '@/types'
import { formatCurrency } from '@/lib/utils/currency'
import { formatDate } from '@/lib/utils/date'
import { Card } from '@/components/ui/Card'

interface ReportsViewProps {
  summary: FinancialSummary
  records: FinancialRecord[]
  categories: FinancialCategory[]
}

export function ReportsView({ summary, records, categories }: ReportsViewProps) {
  const [isExporting, setIsExporting] = React.useState(false)
  const [downloadReady, setDownloadReady] = React.useState(false)

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

  const handleExportCSV = () => {
    setIsExporting(true)
    setTimeout(() => {
      // Build CSV content
      const headers = ['Date', 'Type', 'Category', 'Description', 'Amount (RWF)', 'Status', 'Reference']
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
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', `Grow_in_Jesus_Choir_Financial_Report_${new Date().toISOString().slice(0, 10)}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      setIsExporting(false)
      setDownloadReady(true)
      setTimeout(() => setDownloadReady(false), 4000)
    }, 600)
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif text-[#1e382d] tracking-tight">
            Financial Reports
          </h1>
          <p className="text-xs text-[#71857a] mt-0.5">
            Audit-ready summary of choir income streams, expenditures, and balances.
          </p>
        </div>

        {/* Export Button */}
        <button
          onClick={handleExportCSV}
          disabled={isExporting}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2e5748] hover:bg-[#234538] text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
        >
          {isExporting ? (
            <span>Preparing report...</span>
          ) : downloadReady ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>Report Downloaded</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>Export CSV Report</span>
            </>
          )}
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5">
          <span className="text-xs text-[#71857a] font-medium block mb-1">
            Total Money Received
          </span>
          <p className="text-2xl font-serif font-semibold text-[#295c47]">
            +{formatCurrency(summary.totalIncome)}
          </p>
          <span className="text-[11px] text-[#718279] mt-2 block">
            From contributions, offerings & gifts
          </span>
        </Card>

        <Card className="p-5">
          <span className="text-xs text-[#71857a] font-medium block mb-1">
            Total Money Spent
          </span>
          <p className="text-2xl font-serif font-semibold text-[#a8652d]">
            -{formatCurrency(summary.totalExpenses)}
          </p>
          <span className="text-[11px] text-[#718279] mt-2 block">
            Transport, robes, equipment & venue
          </span>
        </Card>

        <Card className="p-5">
          <span className="text-xs text-[#71857a] font-medium block mb-1">
            Net Financial Balance
          </span>
          <p className="text-2xl font-serif font-semibold text-[#1e382d]">
            {formatCurrency(summary.currentBalance)}
          </p>
          <span className="text-[11px] text-emerald-700 font-medium mt-2 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Confirmed reconciled balance
          </span>
        </Card>
      </div>

      {/* Category Breakdown Grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Income Breakdown */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-[#e3efe6] text-[#336b4e] flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-serif text-[#1e382d]">Income Breakdown</h3>
              <p className="text-[11px] text-[#74877c]">By financial category</p>
            </div>
          </div>

          <div className="space-y-3">
            {incomeByCategory.map(([cat, amount]) => {
              const pct = summary.totalIncome > 0 ? Math.round((amount / summary.totalIncome) * 100) : 0
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#2d473b]">{cat}</span>
                    <span className="font-semibold text-[#295c47]">{formatCurrency(amount)} ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#eef3ef] overflow-hidden">
                    <div className="h-full rounded-full bg-[#396d55]" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Expense Breakdown */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-[#fbf0de] text-[#a4712b] flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-serif text-[#1e382d]">Expense Breakdown</h3>
              <p className="text-[11px] text-[#74877c]">By financial category</p>
            </div>
          </div>

          <div className="space-y-3">
            {expenseByCategory.map(([cat, amount]) => {
              const pct = summary.totalExpenses > 0 ? Math.round((amount / summary.totalExpenses) * 100) : 0
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#2d473b]">{cat}</span>
                    <span className="font-semibold text-[#a8652d]">{formatCurrency(amount)} ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#f6eee0] overflow-hidden">
                    <div className="h-full rounded-full bg-[#c79144]" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>
    </div>
  )
}

