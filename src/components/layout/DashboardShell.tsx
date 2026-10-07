'use client'

import * as React from 'react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { MobileBottomNav } from './MobileBottomNav'
import { AddRecordDialog } from '@/components/finance/AddRecordDialog'
import { CommandSearchModal } from './CommandSearchModal'
import { WelcomeGuideModal } from './WelcomeGuideModal'
import { FinancialCategory, FinancialRecord, Member, NotificationItem, UserRole } from '@/types'

interface DashboardShellProps {
  userRole: UserRole
  userName: string
  userInitials: string
  pendingCount: number
  categories: FinancialCategory[]
  members: Member[]
  records: FinancialRecord[]
  notifications: NotificationItem[]
  children: React.ReactNode
}

export function DashboardShell({
  userRole,
  userName,
  userInitials,
  pendingCount,
  categories,
  members,
  records,
  notifications,
  children
}: DashboardShellProps) {
  const [isAddRecordOpen, setIsAddRecordOpen] = React.useState(false)
  const [isSearchOpen, setIsSearchOpen] = React.useState(false)
  const [isMobileNavOpen, setIsMobileNavOpen] = React.useState(false)

  return (
    <div className="h-dvh w-full flex bg-[#f4f6fc] overflow-hidden">
      {/* Desktop Persistent Sidebar */}
      <div className="hidden md:block h-full shrink-0">
        <Sidebar
          userRole={userRole}
          userName={userName}
          userInitials={userInitials}
          pendingCount={pendingCount}
        />
      </div>

      {/* Mobile Drawer Backdrop and Off-Canvas Sidebar */}
      {isMobileNavOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs md:hidden animate-in fade-in duration-200"
          onClick={() => setIsMobileNavOpen(false)}
        >
          <div
            className="w-72 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-left duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <Sidebar
              userRole={userRole}
              userName={userName}
              userInitials={userInitials}
              pendingCount={pendingCount}
              onClose={() => setIsMobileNavOpen(false)}
              onNavigate={() => setIsMobileNavOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 w-full h-full overflow-y-auto overscroll-contain pb-20 md:pb-6">
        <Topbar
          pageTitle="Financial Workspace"
          userRole={userRole}
          notifications={notifications}
          onOpenAddRecord={() => setIsAddRecordOpen(true)}
          onOpenSearch={() => setIsSearchOpen(true)}
          onToggleMobileNav={() => setIsMobileNavOpen((prev) => !prev)}
        />

        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto min-w-0">
          {children}
        </main>
      </div>

      {/* Mobile Fixed Bottom Navigation Bar (Section 26) */}
      <MobileBottomNav
        userRole={userRole}
        onOpenAddRecord={() => setIsAddRecordOpen(true)}
        onToggleMobileNav={() => setIsMobileNavOpen(true)}
      />

      {/* Global Add Record Dialog */}
      <AddRecordDialog
        isOpen={isAddRecordOpen}
        onClose={() => setIsAddRecordOpen(false)}
        categories={categories}
        members={members}
        userRole={userRole}
      />

      {/* Global Command Search Modal */}
      <CommandSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        records={records}
        members={members}
        onOpenAddRecord={() => setIsAddRecordOpen(true)}
      />

      {/* First-time Onboarding Guide (Section 114) */}
      <WelcomeGuideModal />
    </div>
  )
}
