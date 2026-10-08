'use client'

import * as React from 'react'
import { ChevronDown } from 'lucide-react'
import { FinancialRecord } from '@/types'
import { formatCompactCurrency } from '@/lib/utils/currency'

interface MoneyFlowChartProps {
  records?: FinancialRecord[]
}

export function MoneyFlowChart({ records = [] }: MoneyFlowChartProps) {
  const [timeRange, setTimeRange] = React.useState('Recent Ledger')

  // Group records into 7 time buckets from actual database records
  const chartData = React.useMemo(() => {
    // If no records, provide clean empty baseline
    if (records.length === 0) {
      return {
        dates: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'],
        incomePoints: [0, 0, 0, 0, 0, 0, 0],
        expensePoints: [0, 0, 0, 0, 0, 0, 0],
        reviewPoints: [0, 0, 0, 0, 0, 0, 0],
        maxY: 100000
      }
    }

    // Extract sorted unique dates from records
    const uniqueDates = Array.from(new Set(records.map((r) => r.recordDate))).sort()
    // Take up to 7 most recent dates
    const selectedDates = uniqueDates.length >= 7 ? uniqueDates.slice(-7) : uniqueDates

    const incomeMap = new Map<string, number>()
    const expenseMap = new Map<string, number>()
    const reviewMap = new Map<string, number>()

    for (const r of records) {
      if (r.type === 'income' && r.status === 'recorded') {
        incomeMap.set(r.recordDate, (incomeMap.get(r.recordDate) || 0) + r.amount)
      } else if (r.type === 'expense' && r.status === 'recorded') {
        expenseMap.set(r.recordDate, (expenseMap.get(r.recordDate) || 0) + r.amount)
      } else if (r.status === 'needs_review') {
        reviewMap.set(r.recordDate, (reviewMap.get(r.recordDate) || 0) + r.amount)
      }
    }

    const incomeValues = selectedDates.map((d) => incomeMap.get(d) || 0)
    const expenseValues = selectedDates.map((d) => expenseMap.get(d) || 0)
    const reviewValues = selectedDates.map((d) => reviewMap.get(d) || 0)

    const rawMax = Math.max(...incomeValues, ...expenseValues, ...reviewValues, 100000)
    // Round maxY up to a clean multiple
    const maxY = Math.ceil(rawMax / 100000) * 100000

    return {
      dates: selectedDates.map((d) => {
        const parts = d.split('-')
        return `${parts[1]}/${parts[2]}`
      }),
      incomePoints: incomeValues,
      expensePoints: expenseValues,
      reviewPoints: reviewValues,
      maxY
    }
  }, [records])

  // SVG dimensions: width=650, height=180
  const svgWidth = 650
  const svgHeight = 160
  const paddingBottom = 20

  const n = Math.max(chartData.dates.length, 2)
  const stepX = (svgWidth - 40) / (n - 1)

  const toY = (val: number) => {
    const ratio = Math.min(val / (chartData.maxY || 1), 1)
    return Math.round(svgHeight - ratio * (svgHeight - paddingBottom))
  }

  const incomeCoords = chartData.incomePoints.map((val, idx) => ({
    x: Math.round(20 + idx * stepX),
    y: toY(val)
  }))

  const expenseCoords = chartData.expensePoints.map((val, idx) => ({
    x: Math.round(20 + idx * stepX),
    y: toY(val)
  }))

  const reviewCoords = chartData.reviewPoints.map((val, idx) => ({
    x: Math.round(20 + idx * stepX),
    y: toY(val)
  }))

  // Helper to build smooth cubic Bezier path
  const buildSmoothPath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return ''
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`
    let d = `M ${pts[0].x} ${pts[0].y}`
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i]
      const p1 = pts[i + 1]
      const cp1x = p0.x + (p1.x - p0.x) / 2
      const cp1y = p0.y
      const cp2x = p0.x + (p1.x - p0.x) / 2
      const cp2y = p1.y
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`
    }
    return d
  }

  const incomePath = buildSmoothPath(incomeCoords)
  const expensePath = buildSmoothPath(expenseCoords)
  const reviewPath = buildSmoothPath(reviewCoords)

  const lastIncomeCoord = incomeCoords[incomeCoords.length - 1]
  const firstIncomeCoord = incomeCoords[0]
  const incomeArea = `${incomePath} L ${lastIncomeCoord?.x || 640} ${svgHeight} L ${firstIncomeCoord?.x || 20} ${svgHeight} Z`

  return (
    <div className="card-surface p-4 sm:p-6 flex flex-col justify-between min-w-0">
      {/* Chart Header matching Reference */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight truncate">
            Financial Flow Execution Overview
          </h3>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-2 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-1 rounded bg-blue-600 inline-block shrink-0" />
              <span className="text-slate-600 font-medium">Money Received</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-1 rounded bg-rose-500 inline-block shrink-0" />
              <span className="text-slate-600 font-medium">Money Spent</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-1 rounded bg-amber-500 inline-block shrink-0" />
              <span className="text-slate-600 font-medium">Pending Verification</span>
            </div>
          </div>
        </div>

        {/* Time Selector Dropdown */}
        <div className="self-start sm:self-center">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-100/70 text-xs text-slate-700 font-medium transition-colors shadow-2xs">
            <span>{timeRange}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* SVG Chart Graphic with Y-Axis and Curves matching Reference */}
      <div className="pt-2 min-w-0">
        <div className="flex">
          {/* Y-Axis */}
          <div className="flex flex-col justify-between text-[10px] sm:text-[11px] text-slate-400 pr-2 sm:pr-3 pb-6 font-medium select-none text-right w-10 sm:w-14 shrink-0 font-sans">
            <span>{formatCompactCurrency(chartData.maxY)}</span>
            <span>{formatCompactCurrency(Math.round(chartData.maxY * 0.75))}</span>
            <span>{formatCompactCurrency(Math.round(chartData.maxY * 0.5))}</span>
            <span>{formatCompactCurrency(Math.round(chartData.maxY * 0.25))}</span>
            <span>0</span>
          </div>

          {/* Canvas SVG */}
          <div className="flex-1 h-44 sm:h-52 relative min-w-0">
            {/* Grid lines */}
            <div className="absolute inset-0 pb-6 flex flex-col justify-between pointer-events-none">
              <div className="border-b border-slate-100 w-full" />
              <div className="border-b border-slate-100 w-full" />
              <div className="border-b border-slate-100 w-full" />
              <div className="border-b border-slate-100 w-full" />
              <div className="border-b border-slate-100 w-full" />
            </div>

            <svg viewBox="0 0 650 180" preserveAspectRatio="none" className="w-full h-[calc(100%-24px)] overflow-visible">
              <defs>
                <linearGradient id="blueFlowGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Blue Area Fill */}
              {incomePath && (
                <path d={incomeArea} fill="url(#blueFlowGradient)" />
              )}

              {/* Blue Curve (Money Received) */}
              {incomePath && (
                <path
                  d={incomePath}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              )}

              {/* Blue Dots */}
              {incomeCoords.map((pt, i) => (
                <circle key={`inc-${i}`} cx={pt.x} cy={pt.y} r="3.5" fill="#3b82f6" stroke="#ffffff" strokeWidth="2" />
              ))}

              {/* Red Curve (Money Spent) */}
              {expensePath && (
                <path
                  d={expensePath}
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              )}

              {/* Amber Curve (Pending Review) */}
              {reviewPath && (
                <path
                  d={reviewPath}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              )}
            </svg>

            {/* X-Axis responsive date labels */}
            <div className="flex justify-between text-[11px] text-slate-400 font-medium select-none pt-2">
              {chartData.dates.map((d, i) => (
                <span key={i}>{d}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
