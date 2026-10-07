'use client'

import * as React from 'react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { AddRecordDialog } from '@/components/finance/AddRecordDialog'
import { CommandSearchModal } from './CommandSearchModal'
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
    <div className="min-h-screen bg-[#f7f9f7] flex">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar
          userRole={userRole}
          userName={userName}
          userInitials={userInitials}
          pendingCount={pendingCount}
        />
      </div>

      {/* Mobile Drawer Backdrop */}
      {isMobileNavOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#162a22]/50 backdrop-blur-xs md:hidden"
          onClick={() => setIsMobileNavOpen(false)}
        >
          <div
            className="w-72 bg-white h-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Sidebar
              userRole={userRole}
              userName={userName}
              userInitials={userInitials}
              pendingCount={pendingCount}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          pageTitle="Financial Workspace"
          userRole={userRole}
          notifications={notifications}
          onOpenAddRecord={() => setIsAddRecordOpen(true)}
          onOpenSearch={() => setIsSearchOpen(true)}
          onToggleMobileNav={() => setIsMobileNavOpen((prev) => !prev)}
        />

        <main className="flex-1 p-4 sm:p-7 lg:p-9 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

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
    </div>
  )
}
