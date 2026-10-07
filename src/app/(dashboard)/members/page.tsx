import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth/session'
import { getMembers } from '@/lib/db'
import { MembersView } from '@/features/members/MembersView'

export default async function MembersPage() {
  const session = await getSessionUser()
  if (!session) {
    redirect('/login')
  }

  if (session.role === 'MEMBER') {
    redirect('/dashboard')
  }

  const members = await getMembers()

  return (
    <MembersView
      members={members}
      userRole={session.role}
    />
  )
}

