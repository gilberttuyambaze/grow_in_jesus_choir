'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  WalletCards,
  Users,
  Plus,
  Menu,
  FileText
} from 'lucide-react'
import { UserRole } from '@/types'

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

  const isLeader = userRole === 'LEADER' || userRole === 'ADMIN'

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

      {/* Floating Center Primary Action Button */}
      <div className="-mt-5">
        <button
          onClick={onOpenAddRecord}
          className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white flex items-center justify-center shadow-lg shadow-indigo-500/35 active:scale-95 transition-all"
          aria-label="Add financial record"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>
      </div>

      {/* Members / Documents */}
      {isLeader ? (
        <Link
          href="/members"
          className={`flex flex-col items-center justify-center p-1.5 rounded-xl text-[10px] font-semibold transition-colors ${
            pathname.startsWith('/members')
              ? 'text-indigo-600 font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Users className="w-5 h-5 mb-0.5" />
          <span>Members</span>
        </Link>
      ) : (
        <Link
          href="/documents"
          className={`flex flex-col items-center justify-center p-1.5 rounded-xl text-[10px] font-semibold transition-colors ${
            pathname.startsWith('/documents')
              ? 'text-indigo-600 font-bold'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileText className="w-5 h-5 mb-0.5" />
          <span>Docs</span>
        </Link>
      )}

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

