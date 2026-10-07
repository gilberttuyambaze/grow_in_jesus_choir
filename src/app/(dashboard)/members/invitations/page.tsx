import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth/session'
import { canManageMembers } from '@/lib/permissions'
import { getMemberInvitations } from '@/lib/db/member-workflows'
import { InvitationsView } from '@/features/invitations/InvitationsView'

export default async function MemberInvitationsPage() {
  const actor = await getSessionUser()
  if (!actor) redirect('/login')
  if (!canManageMembers(actor.role)) redirect('/dashboard')
  const invitations = await getMemberInvitations()
  return <InvitationsView invitations={invitations} />
}
