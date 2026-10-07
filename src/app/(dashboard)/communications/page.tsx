import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth/session'
import { canManageMembers } from '@/lib/permissions'
import { getCommunicationAudience, getMemberCommunications } from '@/lib/db/member-workflows'
import { CommunicationsView } from '@/features/communications/CommunicationsView'

export default async function CommunicationsPage() {
  const actor = await getSessionUser()
  if (!actor) redirect('/login')
  if (!canManageMembers(actor.role)) redirect('/dashboard')
  const [audience, history] = await Promise.all([getCommunicationAudience(), getMemberCommunications()])
  return <CommunicationsView audience={audience} history={history} />
}

