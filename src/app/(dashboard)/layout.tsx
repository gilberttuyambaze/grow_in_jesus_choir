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

  const categories = getFinancialCategories()
  const members = getMembers()
  const summary = getFinancialSummary()
  const records = getFinancialRecords({ limit: 100 })
  const notifications = getNotifications(session.userId)

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

