'use client'

import * as React from 'react'
import Link from 'next/link'
import gsap from 'gsap'
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
  const headerRef = React.useRef<HTMLElement>(null)

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

  React.useEffect(() => {
    const header = headerRef.current
    if (!header) return

    const scrollContainer = header.parentElement
    if (!scrollContainer) return

    let previousScrollY = scrollContainer.scrollTop
    let previousDirection = 0
    let accumulatedScrollDelta = 0
    let isHidden = false

    const showHeader = () => {
      if (!isHidden) return
      isHidden = false
      gsap.to(header, { yPercent: 0, duration: 0.3, ease: 'power2.out', overwrite: true })
    }

    const hideHeader = () => {
      if (isHidden) return
      isHidden = true
      gsap.to(header, { yPercent: -110, duration: 0.3, ease: 'power2.in', overwrite: true })
    }

    const handleScroll = () => {
      const currentScrollY = scrollContainer.scrollTop
      const scrollDelta = currentScrollY - previousScrollY
      const direction = Math.sign(scrollDelta)

      if (direction !== 0 && direction !== previousDirection) {
        accumulatedScrollDelta = 0
      }
      accumulatedScrollDelta += scrollDelta

      if (currentScrollY <= header.offsetHeight) {
        showHeader()
        accumulatedScrollDelta = 0
      } else if (direction < 0 && accumulatedScrollDelta <= -8) {
        showHeader()
      } else if (direction > 0 && accumulatedScrollDelta >= 8) {
        hideHeader()
      }

      if (direction !== 0) previousDirection = direction
      previousScrollY = currentScrollY
    }

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll)
      gsap.killTweensOf(header)
    }
  }, [])

  return (
    <header ref={headerRef} className="h-16 sm:h-20 px-3 sm:px-8 lg:px-10 border-b border-slate-200/60 bg-white/70 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between gap-2 sm:gap-6">
      {/* Left: Mobile Drawer Trigger */}
      <div className="flex items-center gap-2">
        {onToggleMobileNav && (
          <button
            onClick={onToggleMobileNav}
            className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
            aria-label="Open navigation drawer"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Center: Search Bar (Desktop: Full Pill / Mobile: Compact Trigger) */}
      <div className="flex-1 max-w-xl mx-auto px-1 sm:px-0">
        {/* Desktop Search Pill matching Reference */}
        <button
          onClick={onOpenSearch}
          className="hidden sm:flex w-full items-center justify-between px-4 py-2.5 rounded-full bg-white/95 border border-slate-200/80 shadow-xs hover:border-indigo-300 text-xs text-slate-500 transition-all group"
        >
          <div className="flex items-center gap-2.5 truncate">
            <Search className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors shrink-0" />
            <span className="truncate">Search records, members, categories, docs...</span>
          </div>
          <kbd className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[10px] font-mono text-slate-500 shrink-0">
            ⌘ K
          </kbd>
        </button>

        {/* Mobile Search Button */}
        <button
          onClick={onOpenSearch}
          className="sm:hidden w-full flex items-center justify-between px-3 py-2 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-400"
          aria-label="Search"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px]">Quick search...</span>
          </div>
          <kbd className="px-1.5 py-0.5 rounded bg-white text-[9px] font-mono text-slate-400 border border-slate-200">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right Side Actions matching Reference */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Notification Bell */}
        <div className="rounded-full bg-white border border-slate-200/80 shadow-xs p-1 flex items-center justify-center shrink-0">
          <NotificationCenter notifications={notifications} />
        </div>

        {/* Documents Quick Link (Desktop/Tablet) */}
        <Link
          href="/documents"
          className="hidden sm:flex rounded-full bg-white border border-slate-200/80 shadow-xs p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/50 transition-colors shrink-0"
          title="Receipts & Documents"
        >
          <FolderLock className="w-4 h-4" />
        </Link>

        {/* Primary CTA Button (Responsive) */}
        <button
          onClick={onOpenAddRecord}
          className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-xs font-semibold shadow-md shadow-indigo-500/25 transition-all active:scale-[0.98] shrink-0"
        >
          <Plus className="w-3.5 sm:w-4 h-3.5 sm:h-4 stroke-[2.5]" />
          <span className="hidden xs:inline sm:inline">
            {userRole === 'MEMBER' ? 'Record' : 'New Record'}
          </span>
        </button>
      </div>
    </header>
  )
}
