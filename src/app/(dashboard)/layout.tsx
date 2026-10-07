import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth/session'
import { getFinancialCategories, getMembers, getFinancialSummary, getFinancialRecords, getNotifications } from '@/lib/db'
import { DashboardShell } from '@/components/layout/DashboardShell'

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  const session = await getSessionUser()
  if (!session) {
    redirect('/login')
  }

  const [categories, members, summary, records, notifications] = await Promise.all([
    getFinancialCategories(),
    getMembers(),
    getFinancialSummary(),
    getFinancialRecords({ limit: 100 }),
    getNotifications(session.userId)
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
    >
      {children}
    </DashboardShell>
  )
}

