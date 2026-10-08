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
  ArrowUpRight
} from 'lucide-react'
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
 * Replaced bulky multi-line cards with a zero-footprint clean state.
 * All 1-click actions are unified into DashboardHeaderQuickButtons for optimal dashboard ergonomics.
 */
export function DashboardQuickActions(_props: DashboardQuickActionsProps) {
  return null
}

/**
 * High-Density 1-Click Action Button Bar for Dashboard Header Row
 * Sits directly next to "Welcome back, {firstName} 👋" without consuming vertical dashboard height.
 */
export function DashboardHeaderQuickButtons({ userRole }: DashboardQuickActionsProps) {
  const canRecord = canCreateRecord(userRole)
  const canManage = canManageMembers(userRole)

  return (
    <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 flex-wrap">
      {/* 1-Click Quick Inflow Pill (Leaders/Admins) */}
      {canManage && (
        <button
          type="button"
          onClick={() => openAddRecordModal('income')}
          className="px-2.5 py-1.5 rounded-xl bg-purple-50/80 hover:bg-purple-100/90 text-purple-700 text-xs font-bold border border-purple-200/60 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-2xs hover:shadow-xs"
          title="Directly record choir income"
        >
          <ArrowDownLeft className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>+ Income</span>
        </button>
      )}

      {/* 1-Click Quick Outflow Pill (Leaders/Admins) */}
      {canManage && (
        <button
          type="button"
          onClick={() => openAddRecordModal('expense')}
          className="px-2.5 py-1.5 rounded-xl bg-amber-50/80 hover:bg-amber-100/90 text-amber-700 text-xs font-bold border border-amber-200/60 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-2xs hover:shadow-xs"
          title="Directly record choir expenditure"
        >
          <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>- Expense</span>
        </button>
      )}

      {/* Primary 1-Click Add Record Pill */}
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
