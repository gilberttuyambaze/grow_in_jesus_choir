import { notFound, redirect } from 'next/navigation'

export default async function CompactAttendanceQrPage({ params }: {
  params: Promise<{ sessionId: string; token: string }>
}) {
  const { sessionId, token } = await params
  if (!/^[A-Za-z0-9-]{1,100}$/.test(sessionId) || !/^[A-Za-z0-9_-]{40,50}$/.test(token)) notFound()
  const query = new URLSearchParams({ sessionId, token })
  redirect(`/sessions/check-in?${query.toString()}`)
}
