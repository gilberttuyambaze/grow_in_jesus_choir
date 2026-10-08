'use client'

import * as React from 'react'
import { ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react'

export interface MetricWaveCardProps {
  label: string
  value: string
  subValue?: string
  trend: string
  isPositive?: boolean
  color: 'blue' | 'purple' | 'emerald' | 'amber' | 'cyan'
  icon: React.ReactNode
}

export function MetricWaveCard({
  label,
  value,
  subValue,
  trend,
  isPositive = true,
  color,
  icon
}: MetricWaveCardProps) {
  const colorSchemes = {
    blue: {
      iconBg: 'bg-blue-50 text-blue-600 border border-blue-100/80',
      waveStroke: '#3b82f6',
      gradStart: 'rgba(59, 130, 246, 0.28)',
      gradStop: 'rgba(59, 130, 246, 0.0)'
    },
    purple: {
      iconBg: 'bg-purple-50 text-purple-600 border border-purple-100/80',
      waveStroke: '#a855f7',
      gradStart: 'rgba(168, 85, 247, 0.28)',
      gradStop: 'rgba(168, 85, 247, 0.0)'
    },
    emerald: {
      iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-100/80',
      waveStroke: '#10b981',
      gradStart: 'rgba(16, 185, 129, 0.28)',
      gradStop: 'rgba(16, 185, 129, 0.0)'
    },
    amber: {
      iconBg: 'bg-amber-50 text-amber-600 border border-amber-100/80',
      waveStroke: '#f59e0b',
      gradStart: 'rgba(245, 158, 11, 0.28)',
      gradStop: 'rgba(245, 158, 11, 0.0)'
    },
    cyan: {
      iconBg: 'bg-cyan-50 text-cyan-600 border border-cyan-100/80',
      waveStroke: '#06b6d4',
      gradStart: 'rgba(6, 182, 212, 0.28)',
      gradStop: 'rgba(6, 182, 212, 0.0)'
    }
  }

  const scheme = colorSchemes[color]
  const gradId = `wave-grad-${color}-${label.replace(/\s+/g, '')}`

  return (
    <div className="card-surface card-surface-interactive p-5 flex flex-col justify-between relative overflow-hidden">
      <div>
        {/* Icon & Label */}
        <div className="flex items-center gap-2.5 mb-3">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${scheme.iconBg}`}>
            {icon}
          </div>
          <span className="text-xs font-semibold text-slate-500 truncate">
            {label}
          </span>
        </div>

        {/* Large Value */}
        <div className="flex items-baseline gap-1 mt-1">
          <h3 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">
            {value}
          </h3>
          {subValue && (
            <span className="text-xs text-slate-400 font-medium">{subValue}</span>
          )}
        </div>

        {/* Trend Indicator */}
        <div className="flex items-center gap-1 mt-1.5 text-[11px] font-semibold text-emerald-600">
          <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>{trend}</span>
        </div>
      </div>

      {/* Mini SVG Sparkline Wave at Bottom matching Reference */}
      <div className="h-10 w-full mt-3 -mb-1 -mx-2 overflow-hidden">
        <svg viewBox="0 0 160 40" preserveAspectRatio="none" className="w-full h-full">
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={scheme.gradStart} />
              <stop offset="100%" stopColor={scheme.gradStop} />
            </linearGradient>
          </defs>
          <path
            d="M0,25 C30,35 50,15 80,22 C110,30 130,10 160,18 L160,40 L0,40 Z"
            fill={`url(#${gradId})`}
          />
          <path
            d="M0,25 C30,35 50,15 80,22 C110,30 130,10 160,18"
            fill="none"
            stroke={scheme.waveStroke}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  )
}

