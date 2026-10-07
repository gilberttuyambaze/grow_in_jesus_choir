import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth/session'
import { getMembers } from '@/lib/db'
import { MembersView } from '@/features/members/MembersView'

export default async function MembersPage() {
  const session = await getSessionUser()
  if (!session) {
    redirect('/login')
  }

  const members = getMembers()

  return (
    <MembersView
      members={members}
      userRole={session.role}
    />
  )
}
