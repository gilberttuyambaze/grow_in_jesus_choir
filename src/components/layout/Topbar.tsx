'use client'

import * as React from 'react'
import Link from 'next/link'
import { Search, Plus, Menu, FolderLock } from 'lucide-react'
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
    <header className="h-20 px-6 sm:px-10 border-b border-slate-200/60 bg-white/60 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between gap-6">
      <div className="flex items-center gap-3">
        {onToggleMobileNav && (
          <button
            onClick={onToggleMobileNav}
            className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Centered Pill Search Bar matching Reference */}
      <div className="flex-1 max-w-xl mx-auto">
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-4 py-2.5 rounded-full bg-white/95 border border-slate-200/80 shadow-xs hover:border-indigo-300 text-xs text-slate-500 transition-all group"
        >
          <div className="flex items-center gap-2.5">
            <Search className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
            <span>Search records, members, categories, docs...</span>
          </div>
          <kbd className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[10px] font-mono text-slate-500">
            ⌘ K
          </kbd>
        </button>
      </div>

      {/* Right Side Actions matching Reference */}
      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <div className="rounded-full bg-white border border-slate-200/80 shadow-xs p-1 flex items-center justify-center">
          <NotificationCenter notifications={notifications} />
        </div>

        {/* Documents Quick Link */}
        <Link
          href="/documents"
          className="rounded-full bg-white border border-slate-200/80 shadow-xs p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/50 transition-colors"
          title="Receipts & Documents"
        >
          <FolderLock className="w-4 h-4" />
        </Link>

        {/* Gradient Primary CTA Pill matching Reference */}
        <button
          onClick={onOpenAddRecord}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-xs font-semibold shadow-md shadow-indigo-500/25 transition-all active:scale-[0.98]"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>{userRole === 'MEMBER' ? '+ Record Contribution' : '+ New Record'}</span>
        </button>
      </div>
    </header>
  )
}
