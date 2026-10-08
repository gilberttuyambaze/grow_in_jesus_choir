import { CheckCircle2, CircleDashed, ListChecks, Timer } from 'lucide-react'
import type { OnboardingUserProgress } from '@/lib/db'
import { getWorkspaceTourSteps } from '@/features/onboarding/config'

interface OnboardingProgressCardProps {
  users: OnboardingUserProgress[]
}

function formatDate(value: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-RW', { dateStyle: 'medium', timeZone: 'Africa/Kigali' }).format(date)
}

export function OnboardingProgressCard({ users }: OnboardingProgressCardProps) {
  const completedCount = users.filter((user) => user.status === 'completed').length
  const inProgressCount = users.filter((user) => user.status === 'in_progress').length
  const notStartedCount = users.length - completedCount - inProgressCount

  return (
    <section className="card-surface space-y-5 p-5 sm:p-6" aria-labelledby="onboarding-progress-heading">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
          <ListChecks className="h-5 w-5" />
        </div>
        <div>
          <h2 id="onboarding-progress-heading" className="text-sm font-bold tracking-tight text-slate-900">
            User onboarding progress
          </h2>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
            See which active accounts have completed the workspace tour. Progress saves automatically for each user.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3.5">
          <div className="flex items-center gap-2 text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-xs font-semibold">Completed</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{completedCount}</p>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-3.5">
          <div className="flex items-center gap-2 text-amber-700">
            <Timer className="h-4 w-4" />
            <span className="text-xs font-semibold">In progress</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{inProgressCount}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
          <div className="flex items-center gap-2 text-slate-600">
            <CircleDashed className="h-4 w-4" />
            <span className="text-xs font-semibold">Not started</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{notStartedCount}</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full min-w-[650px] text-left text-xs">
          <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3 font-bold">User</th>
              <th className="px-4 py-3 font-bold">Role</th>
              <th className="px-4 py-3 font-bold">Tour progress</th>
              <th className="px-4 py-3 font-bold">Status</th>
              <th className="px-4 py-3 font-bold">Completed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {users.map((user) => {
              const totalSteps = getWorkspaceTourSteps(user.role).length
              const completed = user.status === 'completed'
              const started = user.status !== 'not_started'
              const visitedSteps = completed ? totalSteps : started ? Math.min(user.currentStep + 1, totalSteps) : 0
              const statusClasses = completed
                ? 'bg-emerald-50 text-emerald-700'
                : user.status === 'in_progress'
                ? 'bg-amber-50 text-amber-700'
                : 'bg-slate-100 text-slate-600'

              return (
                <tr key={user.userId}>
                  <td className="px-4 py-3.5">
                    <span className="block font-semibold text-slate-900">{user.fullName}</span>
                    <span className="mt-0.5 block text-[11px] text-slate-500">{user.email}</span>
                  </td>
                  <td className="px-4 py-3.5 font-medium text-slate-600">{user.role}</td>
                  <td className="px-4 py-3.5">
                    <span className="font-semibold text-slate-800">{visitedSteps} / {totalSteps} steps</span>
                    <div className="mt-1.5 h-1.5 w-28 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${completed ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                        style={{ width: `${totalSteps ? (visitedSteps / totalSteps) * 100 : 0}%` }}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${statusClasses}`}>
                      {user.status === 'not_started' ? 'Not started' : user.status === 'in_progress' ? 'In progress' : 'Completed'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-500">{formatDate(user.completedAt)}</td>
                </tr>
              )
            })}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                  No active user accounts were found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
