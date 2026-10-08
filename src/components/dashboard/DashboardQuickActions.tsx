'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  Plus,
  ArrowRight,
  CalendarDays,
  CircleDollarSign,
  QrCode,
  Sparkles,
  ArrowDownLeft,
  ArrowUpRight,
  Layers
} from 'lucide-react'
import { CrystalBadge } from '@/components/ui/CrystalBadge'
import { UserRole } from '@/types'
import { canCreateRecord, canManageMembers } from '@/lib/permissions'

interface DashboardQuickActionsProps {
  userRole: UserRole
}

/**
 * Triggers the global Add Record modal via custom event
 */
function openAddRecordModal(type?: 'income' | 'expense') {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('open-add-record', {
        detail: type ? { type } : undefined
      })
    )
  }
}

/**
 * Visual-Rich 1-Click Action Cards for the Dashboard
 * Styled with 3D Crystal Gemstone Medallions, frosted glassmorphism, and liquid silver buttons.
 */
export function DashboardQuickActions({ userRole }: DashboardQuickActionsProps) {
  const canRecord = canCreateRecord(userRole)
  const canManage = canManageMembers(userRole)

  if (!canRecord) return null

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 min-w-0">
      {/* 1-CLICK RECORD TRANSACTION CARD */}
      <div className="rounded-[28px] bg-white/85 backdrop-blur-xl border border-white/95 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.03),0_12px_32px_-4px_rgba(15,23,42,0.06),0_0_0_1px_rgba(255,255,255,0.9)_inset] hover:shadow-[0_12px_36px_-4px_rgba(147,51,234,0.12),0_24px_52px_-6px_rgba(15,23,42,0.08),0_0_0_1px_rgba(255,255,255,1)_inset] hover:-translate-y-1 transition-all duration-200 p-5 sm:p-6 flex flex-col justify-between group min-w-0">
        <div>
          {/* Top header row with Crystal Badge & Tag */}
          <div className="flex items-center justify-between gap-3 mb-4">
            <CrystalBadge
              type="purple"
              size="md"
              className="group-hover:scale-105 transition-transform shrink-0"
            />
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
              1-Click Finance
            </span>
          </div>

          {/* Title & Description */}
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight font-sans">
            {canManage ? 'Record Financial Transaction' : 'Record Choir Contribution'}
          </h3>
          <p className="text-xs sm:text-[13px] text-slate-500 mt-1.5 leading-relaxed">
            {canManage
              ? 'Instantly log choir income, Sunday collections, or register approved operational expenses.'
              : 'Submit your monthly contribution, special offering, or choir pledge directly to the ledger.'}
          </p>
        </div>

        {/* Action Controls */}
        <div className="mt-5 pt-4 border-t border-slate-100/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {canManage ? (
              <>
                <button
                  type="button"
                  onClick={() => openAddRecordModal('income')}
                  className="px-2.5 py-1 rounded-xl bg-purple-50/80 hover:bg-purple-100 text-purple-700 text-[11px] font-bold border border-purple-200/50 flex items-center gap-1 transition-colors"
                >
                  <ArrowDownLeft className="w-3 h-3 stroke-[2.5]" />
                  <span>+ Income</span>
                </button>
                <button
                  type="button"
                  onClick={() => openAddRecordModal('expense')}
                  className="px-2.5 py-1 rounded-xl bg-amber-50/80 hover:bg-amber-100 text-amber-700 text-[11px] font-bold border border-amber-200/50 flex items-center gap-1 transition-colors"
                >
                  <ArrowUpRight className="w-3 h-3 stroke-[2.5]" />
                  <span>- Expense</span>
                </button>
              </>
            ) : (
              <span className="text-[11px] font-medium text-slate-400">
                Direct member treasury submission
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => openAddRecordModal(canManage ? undefined : 'income')}
            className="liquid-silver-button flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-slate-800 shadow-xs hover:shadow active:scale-95 transition-all w-full sm:w-auto"
          >
            <Plus className="w-3.5 h-3.5 text-purple-600 stroke-[2.5]" />
            <span>{canManage ? 'Add Record' : 'Record Now'}</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* 1-CLICK CREATE / VIEW SESSION CARD */}
      <div className="rounded-[28px] bg-white/85 backdrop-blur-xl border border-white/95 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.03),0_12px_32px_-4px_rgba(15,23,42,0.06),0_0_0_1px_rgba(255,255,255,0.9)_inset] hover:shadow-[0_12px_36px_-4px_rgba(6,182,212,0.12),0_24px_52px_-6px_rgba(15,23,42,0.08),0_0_0_1px_rgba(255,255,255,1)_inset] hover:-translate-y-1 transition-all duration-200 p-5 sm:p-6 flex flex-col justify-between group min-w-0">
        <div>
          {/* Top header row with Crystal Badge & Tag */}
          <div className="flex items-center justify-between gap-3 mb-4">
            <CrystalBadge
              type="cyan"
              size="md"
              className="group-hover:scale-105 transition-transform shrink-0"
            />
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-50 text-cyan-700 border border-cyan-200/60">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
              Choir Sessions
            </span>
          </div>

          {/* Title & Description */}
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight font-sans">
            {canManage ? 'Create Choir Session' : 'Choir Sessions & Check-ins'}
          </h3>
          <p className="text-xs sm:text-[13px] text-slate-500 mt-1.5 leading-relaxed">
            {canManage
              ? 'Launch rehearsal attendance check-in, generate secure QR codes, or organize target collections.'
              : 'Check into rehearsal with your QR code, track attendance history, or view active campaigns.'}
          </p>
        </div>

        {/* Action Controls */}
        <div className="mt-5 pt-4 border-t border-slate-100/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href="/sessions"
              className="px-2.5 py-1 rounded-xl bg-cyan-50/80 hover:bg-cyan-100 text-cyan-800 text-[11px] font-bold border border-cyan-200/50 flex items-center gap-1 transition-colors"
            >
              <CalendarDays className="w-3 h-3 stroke-[2.2]" />
              <span>All Sessions</span>
            </Link>
            {canManage && (
              <span className="text-[11px] font-medium text-slate-400 hidden sm:inline">
                QR or Collection
              </span>
            )}
          </div>

          {canManage ? (
            <Link
              href="/sessions?create=1"
              className="liquid-silver-button flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-slate-800 shadow-xs hover:shadow active:scale-95 transition-all w-full sm:w-auto"
            >
              <Plus className="w-3.5 h-3.5 text-cyan-600 stroke-[2.5]" />
              <span>New Session</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          ) : (
            <Link
              href="/sessions"
              className="liquid-silver-button flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-slate-800 shadow-xs hover:shadow active:scale-95 transition-all w-full sm:w-auto"
            >
              <QrCode className="w-3.5 h-3.5 text-cyan-600 stroke-[2.2]" />
              <span>Open Check-in</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Compact 1-Click Action Buttons for Dashboard Header Row
 * Sits directly next to "Welcome back, {firstName} 👋"
 */
export function DashboardHeaderQuickButtons({ userRole }: DashboardQuickActionsProps) {
  const canRecord = canCreateRecord(userRole)
  const canManage = canManageMembers(userRole)

  return (
    <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 flex-wrap">
      {/* 1-Click Add Record Pill */}
      {canRecord && (
        <button
          type="button"
          onClick={() => openAddRecordModal(canManage ? undefined : 'income')}
          className="liquid-silver-button liquid-silver-button-sm flex items-center gap-1.5 px-3.5 py-2 font-semibold text-xs text-slate-800 shadow-xs hover:shadow transition-all active:scale-95"
        >
          <span className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
          <Plus className="w-3.5 h-3.5 text-purple-600 stroke-[2.5]" />
          <span>{canManage ? 'Add Record' : 'Record Contribution'}</span>
        </button>
      )}

      {/* 1-Click New Session / Section Pill */}
      {canManage ? (
        <Link
          href="/sessions?create=1"
          className="liquid-silver-button liquid-silver-button-sm flex items-center gap-1.5 px-3.5 py-2 font-semibold text-xs text-slate-800 shadow-xs hover:shadow transition-all active:scale-95"
        >
          <span className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
          <Plus className="w-3.5 h-3.5 text-cyan-600 stroke-[2.5]" />
          <span>New Session</span>
        </Link>
      ) : (
        <Link
          href="/sessions"
          className="liquid-silver-button liquid-silver-button-sm flex items-center gap-1.5 px-3.5 py-2 font-semibold text-xs text-slate-800 shadow-xs hover:shadow transition-all active:scale-95"
        >
          <span className="w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
          <CalendarDays className="w-3.5 h-3.5 text-cyan-600" />
          <span>Sessions</span>
        </Link>
      )}
    </div>
  )
}
