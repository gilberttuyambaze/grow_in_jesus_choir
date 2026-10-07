import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth/session'
import { getChoirSessions, getFinancialCategories, getMemberByUserId, getMemberSessionHistory } from '@/lib/db'
import { SessionsView } from '@/features/sessions/SessionsView'
import { canManageMembers } from '@/lib/permissions'

export default async function SessionsPage() {
  const actor = await getSessionUser()
  if (!actor) redirect('/login')
  const canManage = canManageMembers(actor.role)
  const member = actor.role === 'MEMBER' ? await getMemberByUserId(actor.userId) : null
  const [sessions, categories, memberHistory] = await Promise.all([
    getChoirSessions(actor.role),
    canManage ? getFinancialCategories('income') : Promise.resolve([]),
    actor.role === 'MEMBER' && member ? getMemberSessionHistory(member.id) : Promise.resolve([])
  ])
  return <SessionsView sessions={sessions} categories={categories} userRole={actor.role} memberHistory={memberHistory} />
}
