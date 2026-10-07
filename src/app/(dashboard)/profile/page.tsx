import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Settings2 } from 'lucide-react'
import { ProfileEditCard } from '@/components/settings/ProfileEditCard'
import { getSessionUser } from '@/lib/auth/session'
import { getMemberByUserId } from '@/lib/db'

export default async function ProfilePage() {
  const session = await getSessionUser()
  if (!session) redirect('/login')

  const member = await getMemberByUserId(session.userId)
  const joinedDate = member?.joinedDate
    ? new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeZone: 'UTC' })
        .format(new Date(`${member.joinedDate.slice(0, 10)}T00:00:00Z`))
    : undefined

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-indigo-600">Account</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">My Profile</h1>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-500 sm:text-sm">
            Keep your personal contact details up to date. Email, role, and voice part are protected account assignments.
          </p>
        </div>
        <Link
          href="/settings"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-indigo-200 hover:text-indigo-700"
        >
          <Settings2 className="h-4 w-4" />
          Settings
        </Link>
      </div>

      <ProfileEditCard
        initialFullName={session.fullName}
        initialPhone={member?.phone}
        email={session.email}
        role={session.role}
        voicePart={member?.voicePart}
        memberStatus={member?.status}
        joinedDate={joinedDate}
      />
    </div>
  )
}
