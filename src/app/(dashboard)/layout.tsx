import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth/session'
import {
  getFinancialCategories,
  getMembers,
  getFinancialSummary,
  getFinancialRecords,
  getNotifications,
  getMemberByUserId,
  getOnboardingProgress
} from '@/lib/db'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { canViewAllFinances } from '@/lib/permissions'
import { WORKSPACE_TOUR_ID, WORKSPACE_TOUR_VERSION } from '@/features/onboarding/config'

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  const session = await getSessionUser()
  if (!session) {
    redirect('/login')
  }

  const canSeeAllFinances = canViewAllFinances(session.role)
  const member = canSeeAllFinances ? null : await getMemberByUserId(session.userId)
  const noSummary = {
    totalIncome: 0,
    totalExpenses: 0,
    currentBalance: 0,
    pendingCount: 0,
    totalTransactions: 0,
    totalMembers: 0,
    membersContributed: 0,
    contributionPercentage: 0,
    healthStatus: 'Healthy' as const
  }

  const [categories, members, summary, records, notifications, onboardingProgress] = await Promise.all([
    getFinancialCategories(),
    canSeeAllFinances ? getMembers() : member ? Promise.resolve([member]) : Promise.resolve([]),
    canSeeAllFinances ? getFinancialSummary() : member ? getFinancialSummary({ memberId: member.id }) : Promise.resolve(noSummary),
    canSeeAllFinances
      ? getFinancialRecords({ limit: 100 })
      : member
      ? getFinancialRecords({ memberId: member.id, limit: 100 })
      : Promise.resolve([]),
    getNotifications(session.userId),
    getOnboardingProgress(session.userId, WORKSPACE_TOUR_ID, WORKSPACE_TOUR_VERSION)
  ])

  return (
    <DashboardShell
      userRole={session.role}
      userName={session.fullName}
      userInitials={session.avatarInitials}
      pendingCount={summary.pendingCount}
      categories={categories}
      members={members}
      records={records}
      notifications={notifications}
      onboardingProgress={onboardingProgress}
    >
      {children}
    </DashboardShell>
  )
}
