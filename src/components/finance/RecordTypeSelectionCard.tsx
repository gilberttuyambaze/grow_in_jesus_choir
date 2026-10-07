'use client'

import * as React from 'react'
import { ArrowDownLeft, ArrowUpRight, X } from 'lucide-react'
import { UserRole } from '@/types'

export interface RecordTypeSelectionCardProps {
  onSelect: (type: 'income' | 'expense') => void
  userRole?: UserRole
  className?: string
}

export function RecordTypeSelectionCard({
  onSelect,
  userRole,
  className = ''
}: RecordTypeSelectionCardProps) {
  const canRecordExpense = userRole !== 'MEMBER'

  return (
    <div className={`grid grid-cols-1 ${canRecordExpense ? 'sm:grid-cols-2' : ''} gap-4 sm:gap-5 ${className}`}>
      {/* Money Received Card */}
      <button
        type="button"
        onClick={() => onSelect('income')}
        className="group relative p-6 rounded-[24px] border border-slate-200/90 hover:border-purple-300 bg-white hover:bg-purple-50/20 text-left transition-all duration-200 shadow-xs hover:shadow-lg hover:shadow-purple-500/5 flex flex-col justify-between cursor-pointer active:scale-[0.99] min-w-0"
      >
        {/* Soft Lavender Icon Badge */}
        <div className="w-12 h-12 rounded-2xl bg-[#F0EBFE] text-[#7C3AED] flex items-center justify-center mb-6 group-hover:scale-105 transition-transform shadow-xs shrink-0">
          <ArrowDownLeft className="w-5 h-5 stroke-[2.5]" />
        </div>

        <div>
          <h4 className="text-base sm:text-[17px] font-bold text-slate-900 tracking-tight mb-1.5 leading-snug">
            Money Received
          </h4>
          <p className="text-xs text-slate-500 leading-relaxed font-normal">
            Member contributions, Sunday offerings, gifts, and donations.
          </p>
        </div>
      </button>

      {/* Money Spent Card (for leaders and admins) */}
      {canRecordExpense && (
        <button
          type="button"
          onClick={() => onSelect('expense')}
          className="group relative p-6 rounded-[24px] border border-slate-200/90 hover:border-amber-300 bg-white hover:bg-amber-50/20 text-left transition-all duration-200 shadow-xs hover:shadow-lg hover:shadow-amber-500/5 flex flex-col justify-between cursor-pointer active:scale-[0.99] min-w-0"
        >
          {/* Soft Amber Icon Badge */}
          <div className="w-12 h-12 rounded-2xl bg-[#FEF6E4] text-[#D97706] flex items-center justify-center mb-6 group-hover:scale-105 transition-transform shadow-xs shrink-0">
            <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
          </div>

          <div>
            <h4 className="text-base sm:text-[17px] font-bold text-slate-900 tracking-tight mb-1.5 leading-snug">
              Money Spent
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed font-normal">
              Transport, uniforms/robes, rehearsal venue, sound & equipment.
            </p>
          </div>
        </button>
      )}
    </div>
  )
}

export interface RecordTypeModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (type: 'income' | 'expense') => void
  userRole?: UserRole
}

export function RecordTypeModal({
  isOpen,
  onClose,
  onSelect,
  userRole
}: RecordTypeModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Frosted Glass Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/25 backdrop-blur-md transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Floating Modal Window matching reference image */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="record-type-title"
        className="relative w-full max-w-xl bg-white/95 backdrop-blur-xl rounded-[28px] sm:rounded-[32px] border border-white/80 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.12),0_0_0_1px_rgba(255,255,255,0.9)_inset] p-6 sm:p-7 z-10 transition-all duration-200 animate-in fade-in zoom-in-95"
      >
        {/* Header row with title & circular close button */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h2
              id="record-type-title"
              className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-sans"
            >
              What would you like to record?
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Choose whether choir funds were received or spent.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors shrink-0 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Close modal"
          >
            <X className="w-4 h-4 stroke-[2.2]" />
          </button>
        </div>

        {/* Reusable Cards Component */}
        <RecordTypeSelectionCard
          onSelect={(type) => {
            onSelect(type)
          }}
          userRole={userRole}
        />
      </div>
    </div>
  )
}

