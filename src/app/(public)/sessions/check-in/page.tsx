import { notFound, redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth/session'
import { getChoirSessionOverview, getMemberByUserId } from '@/lib/db'
import { SessionCheckInCard } from '@/features/sessions/SessionCheckInCard'

export default async function SessionCheckInPage({ searchParams }: {
  searchParams: Promise<{ sessionId?: string; token?: string }>
}) {
  const { sessionId = '', token = '' } = await searchParams
  if (!/^[A-Za-z0-9-]{1,100}$/.test(sessionId) || !/^[A-Za-z0-9_-]{40,50}$/.test(token)) notFound()
  const actor = await getSessionUser()
  if (!actor) {
    const next = `/sessions/check-in?${new URLSearchParams({ sessionId, token }).toString()}`
    redirect(`/login?next=${encodeURIComponent(next)}`)
  }
  const member = actor.role === 'AUDITOR' ? null : await getMemberByUserId(actor.userId)
  const overview = await getChoirSessionOverview(sessionId, actor.role, member?.id)
  if (!overview || overview.session.type !== 'ATTENDANCE') notFound()
  return <SessionCheckInCard session={overview.session} token={token} role={actor.role} hasMemberProfile={member?.status === 'active'} />
}
