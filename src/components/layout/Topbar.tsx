'use client'

import * as React from 'react'
import { Search, Plus, Menu } from 'lucide-react'
import { UserRole, NotificationItem } from '@/types'
import { NotificationCenter } from './NotificationCenter'

interface TopbarProps {
  pageTitle: string
  userRole: UserRole
  notifications: NotificationItem[]
  onOpenAddRecord: () => void
  onOpenSearch: () => void
  onToggleMobileNav?: () => void
}

export function Topbar({
  pageTitle,
  userRole,
  notifications,
  onOpenAddRecord,
  onOpenSearch,
  onToggleMobileNav
}: TopbarProps) {
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        onOpenSearch()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onOpenSearch])

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

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Search Button (⌘K) */}
        <button
          onClick={onOpenSearch}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#dbe4dd] bg-white text-xs text-[#71857a] hover:border-[#86a895] transition-all"
        >
          <Search className="w-3.5 h-3.5 text-[#889b90]" />
          <span>Quick search...</span>
          <kbd className="ml-3 px-1.5 py-0.5 rounded-md bg-[#edf2ee] border border-[#dce4de] text-[10px] font-mono text-[#6c7f75]">
            ⌘K
          </kbd>
        </button>

        {/* Notification Center Popover */}
        <NotificationCenter notifications={notifications} />

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
