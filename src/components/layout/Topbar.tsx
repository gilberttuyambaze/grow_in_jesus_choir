'use client'

import * as React from 'react'
import { Search, Bell, Plus, Menu } from 'lucide-react'
import { UserRole } from '@/types'

interface TopbarProps {
  pageTitle: string
  userRole: UserRole
  onOpenAddRecord: () => void
  onToggleMobileNav?: () => void
  searchQuery?: string
  onSearchChange?: (val: string) => void
}

export function Topbar({
  pageTitle,
  userRole,
  onOpenAddRecord,
  onToggleMobileNav,
  searchQuery,
  onSearchChange
}: TopbarProps) {
  return (
    <header className="h-16 px-4 sm:px-8 border-b border-[#e2e8e4] bg-[#f8faf8]/90 backdrop-blur-sm sticky top-0 z-30 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        {onToggleMobileNav && (
          <button
            onClick={onToggleMobileNav}
            className="md:hidden p-2 rounded-lg text-[#556960] hover:bg-[#ebf2ed]"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="flex items-center gap-2 text-xs text-[#809187]">
          <span>Grow in Jesus</span>
          <span>/</span>
          <span className="font-semibold text-[#234235]">{pageTitle}</span>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Search input (if enabled) */}
        {onSearchChange !== undefined && (
          <div className="relative hidden sm:block w-48 lg:w-64">
            <Search className="w-4 h-4 text-[#8a9990] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search records..."
              value={searchQuery || ''}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#dbe4dd] bg-white text-xs text-[#203a30] placeholder-[#95a49c] focus:outline-none focus:ring-2 focus:ring-[#4c7562]"
            />
          </div>
        )}

        {/* Global Add Record Action Button */}
        <button
          onClick={onOpenAddRecord}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2e5748] hover:bg-[#234538] text-white text-xs font-semibold shadow-xs transition-all active:scale-[0.98]"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>{userRole === 'MEMBER' ? 'Record Contribution' : 'Add Record'}</span>
        </button>
      </div>
    </header>
  )
}

