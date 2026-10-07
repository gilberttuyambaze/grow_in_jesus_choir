'use client'

import * as React from 'react'
import { ChevronDown } from 'lucide-react'

export function MoneyFlowChart() {
  const [timeRange, setTimeRange] = React.useState('Last 7 Days')

  return (
    <div className="card-surface p-6 bg-white flex flex-col justify-between">
      {/* Chart Header matching Reference */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            Financial Flow Execution Overview
          </h3>
          <div className="flex items-center gap-4 mt-2 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-1 rounded bg-blue-600 inline-block" />
              <span className="text-slate-600 font-medium">Money Received</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-1 rounded bg-rose-500 inline-block" />
              <span className="text-slate-600 font-medium">Money Spent</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-1 rounded bg-amber-500 inline-block" />
              <span className="text-slate-600 font-medium">Contributions</span>
            </div>
          </div>
        </div>

        {/* Time Selector Dropdown matching Reference */}
        <div className="relative">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-100/70 text-xs text-slate-700 font-medium transition-colors shadow-2xs">
            <span>{timeRange}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* SVG Chart Graphic with Y-Axis and Curves matching Reference */}
      <div className="pt-2">
        <div className="flex">
          {/* Y-Axis */}
          <div className="flex flex-col justify-between text-[11px] text-slate-400 pr-3 pb-6 font-medium select-none text-right w-10">
            <span>400</span>
            <span>300</span>
            <span>200</span>
            <span>100</span>
            <span>0</span>
          </div>

          {/* Canvas SVG */}
          <div className="flex-1 h-52 relative">
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
              <path
                d="M 10 130 C 70 90, 130 110, 200 65 C 270 20, 340 70, 420 40 C 500 10, 570 70, 640 60 L 640 180 L 10 180 Z"
                fill="url(#blueFlowGradient)"
              />

              {/* Blue Curve (Money Received) */}
              <path
                d="M 10 130 C 70 90, 130 110, 200 65 C 270 20, 340 70, 420 40 C 500 10, 570 70, 640 60"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Blue Dots */}
              <circle cx="10" cy="130" r="3.5" fill="#3b82f6" stroke="#ffffff" strokeWidth="2" />
              <circle cx="115" cy="100" r="3.5" fill="#3b82f6" stroke="#ffffff" strokeWidth="2" />
              <circle cx="200" cy="65" r="3.5" fill="#3b82f6" stroke="#ffffff" strokeWidth="2" />
              <circle cx="310" cy="45" r="3.5" fill="#3b82f6" stroke="#ffffff" strokeWidth="2" />
              <circle cx="420" cy="40" r="3.5" fill="#3b82f6" stroke="#ffffff" strokeWidth="2" />
              <circle cx="530" cy="30" r="3.5" fill="#3b82f6" stroke="#ffffff" strokeWidth="2" />
              <circle cx="640" cy="60" r="3.5" fill="#3b82f6" stroke="#ffffff" strokeWidth="2" />

              {/* Red Curve (Money Spent) */}
              <path
                d="M 10 155 C 80 145, 160 148, 250 142 C 340 135, 430 130, 520 128 C 580 125, 610 132, 640 135"
                fill="none"
                stroke="#ef4444"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle cx="10" cy="155" r="3" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
              <circle cx="160" cy="148" r="3" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
              <circle cx="340" cy="135" r="3" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
              <circle cx="520" cy="128" r="3" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
              <circle cx="640" cy="135" r="3" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />

              {/* Amber Curve (Human Review / Contributions) */}
              <path
                d="M 10 170 C 90 162, 180 165, 270 160 C 360 155, 450 158, 540 152 C 590 150, 620 155, 640 158"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle cx="10" cy="170" r="3" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
              <circle cx="180" cy="165" r="3" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
              <circle cx="360" cy="155" r="3" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
              <circle cx="540" cy="152" r="3" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
              <circle cx="640" cy="158" r="3" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
            </svg>

            {/* X-Axis Dates */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium pt-2 select-none">
              <span>Oct 01</span>
              <span>Oct 02</span>
              <span>Oct 03</span>
              <span>Oct 04</span>
              <span>Oct 05</span>
              <span>Oct 06</span>
              <span>Oct 07</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

