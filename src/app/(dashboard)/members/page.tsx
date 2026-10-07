import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth/session'
import { getMembers, getFinancialRecords } from '@/lib/db'
import { MembersView } from '@/features/members/MembersView'

export default async function MembersPage() {
  const session = await getSessionUser()
  if (!session) {
    redirect('/login')
  }

  if (session.role === 'MEMBER') {
    redirect('/dashboard')
  }

  const [members, records] = await Promise.all([
    getMembers(),
    getFinancialRecords({ type: 'income' })
  ])

  return (
    <MembersView
      members={members}
      records={records}
      userRole={session.role}
    />
  )
}

