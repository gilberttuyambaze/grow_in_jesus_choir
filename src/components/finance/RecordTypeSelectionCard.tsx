'use client'

import * as React from 'react'
import { CrystalBadge } from '@/components/ui/CrystalBadge'
import { ArrowRight, X } from 'lucide-react'
import { UserRole } from '@/types'

/**
 * Money Received Icon: Bold downward arrow with stacked chevrons
 * Pixel-matched to reference image media_1791403640337_9da709d7.png
 */
export function MoneyReceivedIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3v10" />
      <path d="m7 9 5 5 5-5" />
      <path d="m7 15 5 5 5-5" />
    </svg>
  )
}

/**
 * Money Spent Icon: Bold upward arrow with stacked chevrons
 * Pixel-matched to reference image media_1791403640337_9da709d7.png
 */
export function MoneySpentIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 21v-10" />
      <path d="m7 15 5-5 5 5" />
      <path d="m7 9 5-5 5 5" />
    </svg>
  )
}

export interface RecordTypeSelectionCardProps {
  onSelect: (type: 'income' | 'expense') => void
  userRole?: UserRole
  className?: string
}

/**
 * Reusable inner selection card grid:
 * Upgraded with 3D crystal gemstone medallions, frosted glassmorphism, and liquid silver action buttons.
 */
export function RecordTypeSelectionCard({
  onSelect,
  userRole,
  className = ''
}: RecordTypeSelectionCardProps) {
  const canRecordExpense = userRole !== 'MEMBER'

  return (
    <div
      className={`grid grid-cols-1 ${canRecordExpense ? 'sm:grid-cols-2' : ''} gap-4 sm:gap-5 ${className}`}
    >
      {/* Money Received Card */}
      <button
        type="button"
        onClick={() => onSelect('income')}
        className="group relative p-6 sm:p-7 rounded-[24px] sm:rounded-[28px] bg-white/85 backdrop-blur-xl hover:bg-white border border-white/95 hover:border-purple-200/90 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.03),0_12px_32px_-4px_rgba(15,23,42,0.06),0_0_0_1px_rgba(255,255,255,0.9)_inset] hover:shadow-[0_8px_32px_-4px_rgba(147,51,234,0.14),0_20px_48px_-6px_rgba(15,23,42,0.08),0_0_0_1px_rgba(255,255,255,1)_inset] text-left transition-all duration-200 flex flex-col justify-between cursor-pointer hover:-translate-y-1 active:scale-[0.99] min-w-0"
      >
        <div>
          {/* 3D Amethyst Gemstone Medallion */}
          <div className="mb-4">
            <CrystalBadge type="purple" size="md" className="group-hover:scale-105 transition-transform" />
          </div>

          <div>
            <h4 className="text-base sm:text-[18px] font-bold text-slate-900 tracking-tight mb-1.5 leading-snug font-sans">
              Money Received
            </h4>
            <p className="text-xs sm:text-[13px] text-slate-500 leading-relaxed font-normal">
              Member contributions, Sunday offerings, gifts, and donations.
            </p>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600">
            Choir Inflow
          </span>
          <span className="liquid-silver-button liquid-silver-button-sm flex items-center gap-1 group-hover:shadow-md">
            <span>Select</span>
            <ArrowRight className="w-3 h-3 text-slate-700 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </button>

      {/* Money Spent Card (for leaders and admins) */}
      {canRecordExpense && (
        <button
          type="button"
          onClick={() => onSelect('expense')}
          className="group relative p-6 sm:p-7 rounded-[24px] sm:rounded-[28px] bg-white/85 backdrop-blur-xl hover:bg-white border border-white/95 hover:border-amber-200/90 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.03),0_12px_32px_-4px_rgba(15,23,42,0.06),0_0_0_1px_rgba(255,255,255,0.9)_inset] hover:shadow-[0_8px_32px_-4px_rgba(245,158,11,0.14),0_20px_48px_-6px_rgba(15,23,42,0.08),0_0_0_1px_rgba(255,255,255,1)_inset] text-left transition-all duration-200 flex flex-col justify-between cursor-pointer hover:-translate-y-1 active:scale-[0.99] min-w-0"
        >
          <div>
            {/* 3D Golden Crystal Gemstone Medallion */}
            <div className="mb-4">
              <CrystalBadge type="warning" size="md" className="group-hover:scale-105 transition-transform" />
            </div>

            <div>
              <h4 className="text-base sm:text-[18px] font-bold text-slate-900 tracking-tight mb-1.5 leading-snug font-sans">
                Money Spent
              </h4>
              <p className="text-xs sm:text-[13px] text-slate-500 leading-relaxed font-normal">
                Transport, uniforms/robes, rehearsal venue, sound & equipment.
              </p>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">
              Choir Outflow
            </span>
            <span className="liquid-silver-button liquid-silver-button-sm flex items-center gap-1 group-hover:shadow-md">
              <span>Select</span>
              <ArrowRight className="w-3 h-3 text-slate-700 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        </button>
      )}
    </div>
  )
}

export interface RecordTypePopupCardProps {
  onSelect: (type: 'income' | 'expense') => void
  onClose?: () => void
  userRole?: UserRole
  className?: string
}

/**
 * Reusable standalone popup card container:
 * Matches media_1791403640337_9da709d7.png with exact header, frosted glass styling, and close button.
 */
export function RecordTypePopupCard({
  onSelect,
  onClose,
  userRole,
  className = ''
}: RecordTypePopupCardProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="record-type-title"
      className={`relative w-full max-w-xl sm:max-w-2xl bg-white/85 backdrop-blur-2xl rounded-[30px] sm:rounded-[36px] border border-white/95 shadow-[0_30px_70px_-15px_rgba(15,23,42,0.18),0_0_0_1px_rgba(255,255,255,0.95)_inset] p-6 sm:p-8 z-10 transition-all duration-200 animate-in fade-in zoom-in-95 ${className}`}
    >
      {/* Header row with title, subtitle & circular close button */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="min-w-0 pr-2">
          <h2
            id="record-type-title"
            className="text-xl sm:text-[22px] font-bold text-slate-800 tracking-tight font-sans leading-tight"
          >
            What would you like to record?
          </h2>
          <p className="text-xs sm:text-[13px] text-slate-400 font-normal mt-1 leading-normal">
            Choose whether choir funds were received or spent.
          </p>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-100/80 hover:bg-slate-200/90 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors shrink-0 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            aria-label="Close dialog"
          >
            <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.2]" />
          </button>
        )}
      </div>

      {/* Reusable Cards Component */}
      <RecordTypeSelectionCard onSelect={onSelect} userRole={userRole} />
    </div>
  )
}

export interface RecordTypeModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (type: 'income' | 'expense') => void
  userRole?: UserRole
}

/**
 * Reusable full-screen modal with backdrop blur & click-outside dismissal:
 * Exactly wraps RecordTypePopupCard matching media_1791403640337_9da709d7.png.
 */
export function RecordTypeModal({
  isOpen,
  onClose,
  onSelect,
  userRole
}: RecordTypeModalProps) {
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {/* Frosted Glass Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/20 backdrop-blur-md transition-opacity duration-200"
        aria-hidden="true"
      />

      {/* Floating Modal Window */}
      <RecordTypePopupCard
        onSelect={onSelect}
        onClose={onClose}
        userRole={userRole}
      />
    </div>
  )
}
