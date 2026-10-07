import { notFound, redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth/session'
import { getChoirSessionOverview, getFinancialCategories, getMemberByUserId } from '@/lib/db'
import { SessionDetailView } from '@/features/sessions/SessionDetailView'
import { canManageMembers } from '@/lib/permissions'

export default async function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await getSessionUser()
  if (!actor) redirect('/login')
  const { id } = await params
  const canManage = canManageMembers(actor.role)
  const member = actor.role === 'MEMBER' ? await getMemberByUserId(actor.userId) : null
  const [overview, categories] = await Promise.all([
    getChoirSessionOverview(id, actor.role, member?.id),
    canManage ? getFinancialCategories('income') : Promise.resolve([])
  ])
  if (!overview) notFound()
  return <SessionDetailView overview={overview} userRole={actor.role} categories={categories} />
}
