'use client'

import * as React from 'react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { MobileBottomNav } from './MobileBottomNav'
import { AddRecordDialog } from '@/components/finance/AddRecordDialog'
import { CommandSearchModal } from './CommandSearchModal'
import { WelcomeGuideModal } from './WelcomeGuideModal'
import { FinancialCategory, FinancialRecord, Member, NotificationItem, UserRole } from '@/types'
import { canCreateRecord, canManageMembers } from '@/lib/permissions'
import type { OnboardingProgress } from '@/lib/db'
import { SessionForm } from '@/features/sessions/SessionForm'

interface DashboardShellProps {
  userRole: UserRole
  userName: string
  userInitials: string
  pendingCount: number
  categories: FinancialCategory[]
  members: Member[]
  records: FinancialRecord[]
  notifications: NotificationItem[]
  onboardingProgress: OnboardingProgress
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
  onboardingProgress,
  children
}: DashboardShellProps) {
  const [isAddRecordOpen, setIsAddRecordOpen] = React.useState(false)
  const [initialRecordType, setInitialRecordType] = React.useState<'income' | 'expense' | null>(null)
  const [isSearchOpen, setIsSearchOpen] = React.useState(false)
  const [isSessionFormOpen, setIsSessionFormOpen] = React.useState(false)
  const [isMobileNavOpen, setIsMobileNavOpen] = React.useState(false)
  const [isTourOpen, setIsTourOpen] = React.useState(onboardingProgress.status === 'not_started')

  const handleOpenTour = React.useCallback(() => setIsTourOpen(true), [])
  const handleCloseTour = React.useCallback(() => setIsTourOpen(false), [])

  // Listen for 1-click open-add-record event across the platform
  React.useEffect(() => {
    const handleOpenRecord = (event?: Event) => {
      const customEvent = event as CustomEvent<{ type?: 'income' | 'expense' }> | undefined
      if (customEvent?.detail?.type) {
        setInitialRecordType(customEvent.detail.type)
      } else {
        setInitialRecordType(null)
      }
      setIsAddRecordOpen(true)
    }

    window.addEventListener('open-add-record', handleOpenRecord)

    // Check query params if record=1 or record=true
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      if (urlParams.get('record') === '1' || urlParams.get('record') === 'true') {
        const typeParam = urlParams.get('type')
        if (typeParam === 'income' || typeParam === 'expense') {
          setInitialRecordType(typeParam)
        }
        setIsAddRecordOpen(true)
      }
    }

    return () => {
      window.removeEventListener('open-add-record', handleOpenRecord)
    }
  }, [])

  const unreadNotificationCount = React.useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  )

  return (
    <div className="dashboard-shell h-dvh w-full flex overflow-hidden">
      {/* Desktop Persistent Sidebar */}
      <div className="hidden md:block h-full shrink-0">
        <Sidebar
          userRole={userRole}
          userName={userName}
          userInitials={userInitials}
          pendingCount={pendingCount}
          unreadNotificationCount={unreadNotificationCount}
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
              unreadNotificationCount={unreadNotificationCount}
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
          onOpenCreateSession={() => setIsSessionFormOpen(true)}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenTour={handleOpenTour}
          onToggleMobileNav={() => setIsMobileNavOpen((prev) => !prev)}
        />

        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto min-w-0">
          {children}
        </main>
      </div>

      {/* Mobile Fixed Bottom Navigation Bar (Section 26) */}
      <MobileBottomNav
        userRole={userRole}
        unreadNotificationCount={unreadNotificationCount}
        onOpenAddRecord={() => setIsAddRecordOpen(true)}
        onToggleMobileNav={() => setIsMobileNavOpen(true)}
      />

      {/* Global Add Record Dialog */}
      {canCreateRecord(userRole) && (
        <AddRecordDialog
          isOpen={isAddRecordOpen}
          onClose={() => {
            setIsAddRecordOpen(false)
            setInitialRecordType(null)
          }}
          categories={categories}
          members={members}
          userRole={userRole}
          initialRecordType={initialRecordType}
        />
      )}

      {canManageMembers(userRole) && isSessionFormOpen && (
        <SessionForm
          categories={categories.filter((category) => category.type === 'income')}
          onClose={() => setIsSessionFormOpen(false)}
        />
      )}

      {/* Global Command Search Modal */}
      <CommandSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        records={records}
        members={members}
        onOpenAddRecord={() => setIsAddRecordOpen(true)}
        canAddRecords={canCreateRecord(userRole)}
      />

      <WelcomeGuideModal
        isOpen={isTourOpen}
        onClose={handleCloseTour}
        onOpenNewRecord={() => setIsAddRecordOpen(true)}
        progress={onboardingProgress}
        userRole={userRole}
      />
    </div>
  )
}
