'use client'

import * as React from 'react'
import { X } from 'lucide-react'
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
 * Renders the Money Received and Money Spent option cards.
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
        className="group relative p-6 sm:p-7 rounded-[22px] sm:rounded-[26px] bg-white/70 hover:bg-white border border-white/90 hover:border-purple-200 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_32px_rgba(147,51,234,0.08)] text-left transition-all duration-200 flex flex-col justify-between cursor-pointer active:scale-[0.99] min-w-0"
      >
        {/* Soft Lavender Icon Badge */}
        <div className="w-12 h-12 rounded-[18px] bg-[#F5E8FF] text-[#9333EA] flex items-center justify-center mb-5 group-hover:scale-105 transition-transform shadow-xs shrink-0">
          <MoneyReceivedIcon className="w-6 h-6" />
        </div>

        <div>
          <h4 className="text-base sm:text-[17px] font-bold text-slate-900 tracking-tight mb-2 leading-snug font-sans">
            Money Received
          </h4>
          <p className="text-xs sm:text-[13px] text-slate-400 leading-relaxed font-normal">
            Member contributions, Sunday offerings, gifts, and donations.
          </p>
        </div>
      </button>

      {/* Money Spent Card (for leaders and admins) */}
      {canRecordExpense && (
        <button
          type="button"
          onClick={() => onSelect('expense')}
          className="group relative p-6 sm:p-7 rounded-[22px] sm:rounded-[26px] bg-white/70 hover:bg-white border border-white/90 hover:border-amber-200 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_32px_rgba(245,158,11,0.08)] text-left transition-all duration-200 flex flex-col justify-between cursor-pointer active:scale-[0.99] min-w-0"
        >
          {/* Soft Amber Icon Badge */}
          <div className="w-12 h-12 rounded-[18px] bg-[#FEF9C3] text-[#F59E0B] flex items-center justify-center mb-5 group-hover:scale-105 transition-transform shadow-xs shrink-0">
            <MoneySpentIcon className="w-6 h-6" />
          </div>

          <div>
            <h4 className="text-base sm:text-[17px] font-bold text-slate-900 tracking-tight mb-2 leading-snug font-sans">
              Money Spent
            </h4>
            <p className="text-xs sm:text-[13px] text-slate-400 leading-relaxed font-normal">
              Transport, uniforms/robes, rehearsal venue, sound & equipment.
            </p>
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
      className={`relative w-full max-w-xl sm:max-w-2xl bg-white/80 backdrop-blur-2xl rounded-[28px] sm:rounded-[34px] border border-white/90 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.1),0_0_0_1px_rgba(255,255,255,0.8)_inset] p-6 sm:p-8 z-10 transition-all duration-200 animate-in fade-in zoom-in-95 ${className}`}
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
