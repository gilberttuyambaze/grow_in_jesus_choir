import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth/session'
import { getFinancialRecords, getFinancialCategories, getMemberByUserId } from '@/lib/db'
import { FinancesView } from '@/features/finances/FinancesView'

export default async function FinancesPage() {
  const session = await getSessionUser()
  if (!session) {
    redirect('/login')
  }

  const isLeader = session.role === 'LEADER' || session.role === 'ADMIN'
  const member = !isLeader ? await getMemberByUserId(session.userId) : null
  const records = isLeader
    ? await getFinancialRecords()
    : member
    ? await getFinancialRecords({ memberId: member.id })
    : []

  const categories = await getFinancialCategories()

  return (
    <FinancesView
      records={records}
      categories={categories}
      userRole={session.role}
    />
  )
}

