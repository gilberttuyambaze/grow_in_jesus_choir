'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  WalletCards,
  CalendarDays,
  Plus,
  Menu
} from 'lucide-react'
import { UserRole } from '@/types'
import { canCreateRecord } from '@/lib/permissions'

interface MobileBottomNavProps {
  userRole: UserRole
  onOpenAddRecord: () => void
  onToggleMobileNav: () => void
}

export function MobileBottomNav({
  userRole,
  onOpenAddRecord,
  onToggleMobileNav
}: MobileBottomNavProps) {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/80 px-2 py-1.5 flex items-center justify-around safe-area-bottom shadow-lg shadow-slate-900/5">
      {/* Home / Dashboard */}
      <Link
        href="/dashboard"
        className={`flex flex-col items-center justify-center p-1.5 rounded-xl text-[10px] font-semibold transition-colors ${
          pathname === '/dashboard'
            ? 'text-indigo-600 font-bold'
            : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        <LayoutDashboard className="w-5 h-5 mb-0.5" />
        <span>Home</span>
      </Link>

      {/* Finances */}
      <Link
        href="/finances"
        className={`flex flex-col items-center justify-center p-1.5 rounded-xl text-[10px] font-semibold transition-colors ${
          pathname.startsWith('/finances')
            ? 'text-indigo-600 font-bold'
            : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        <WalletCards className="w-5 h-5 mb-0.5" />
        <span>Finances</span>
      </Link>

      {canCreateRecord(userRole) && (
        <div className="-mt-5">
          <button
            onClick={onOpenAddRecord}
            className="brand-button w-12 h-12 rounded-full flex items-center justify-center"
            aria-label="Add financial record"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>
      )}

      {/* Session attendance and collections */}
      <Link
        href="/sessions"
        className={`flex flex-col items-center justify-center p-1.5 rounded-xl text-[10px] font-semibold transition-colors ${
          pathname.startsWith('/sessions')
            ? 'text-indigo-600 font-bold'
            : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        <CalendarDays className="w-5 h-5 mb-0.5" />
        <span>Sessions</span>
      </Link>

      {/* More / Menu Drawer */}
      <button
        onClick={onToggleMobileNav}
        className="flex flex-col items-center justify-center p-1.5 rounded-xl text-[10px] font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        aria-label="Open full menu"
      >
        <Menu className="w-5 h-5 mb-0.5" />
        <span>More</span>
      </button>
    </nav>
  )
}
