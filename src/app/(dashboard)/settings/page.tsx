import { redirect } from 'next/navigation'
import {
  ShieldCheck,
  UserCheck,
  Settings as SettingsIcon,
  Globe,
  Bell,
  Coins,
  Users,
  Calendar,
  Layers
} from 'lucide-react'
import { getSessionUser } from '@/lib/auth/session'
import { getFinancialCategories, getMembers, getOnboardingUserProgress } from '@/lib/db'
import { PasswordChangeCard } from '@/components/settings/PasswordChangeCard'
import { OnboardingProgressCard } from '@/components/settings/OnboardingProgressCard'
import { canManageMembers } from '@/lib/permissions'
import { WORKSPACE_TOUR_ID, WORKSPACE_TOUR_VERSION } from '@/features/onboarding/config'

export default async function SettingsPage() {
  const session = await getSessionUser()
  if (!session) {
    redirect('/login')
  }

  const [incomeCategories, expenseCategories, members, onboardingUsers] = await Promise.all([
    getFinancialCategories('income'),
    getFinancialCategories('expense'),
    canManageMembers(session.role) ? getMembers() : Promise.resolve([]),
    canManageMembers(session.role)
      ? getOnboardingUserProgress(WORKSPACE_TOUR_ID, WORKSPACE_TOUR_VERSION)
      : Promise.resolve([])
  ])
  const activeCount = members.filter((m) => m.status === 'active').length

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-sans">
          Workspace Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Choir organization identity, currency standards, categories, and account configuration.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Choir Identity Card matching Reference */}
        <div className="card-surface p-6 bg-white space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shadow-xs">
              <Globe className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Choir Identity
              </h3>
              <p className="text-[11px] text-slate-400">Organization profile & ministry details</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs pt-2">
            <div>
              <span className="text-slate-400 block text-[11px] font-medium">Organization</span>
              <strong className="text-slate-900 text-xs font-bold block mt-0.5">
                Grow in Jesus Choir
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] font-medium">Base Currency</span>
              <strong className="text-slate-900 text-xs font-bold block mt-0.5">
                Rwandan Franc (RWF)
              </strong>
            </div>
            {canManageMembers(session.role) && (
              <div>
                <span className="text-slate-400 block text-[11px] font-medium">Active Choir Members</span>
                <strong className="text-slate-900 text-xs font-bold block mt-0.5">
                  {activeCount} Members
                </strong>
              </div>
            )}
          </div>
        </div>

      </div>

      <div className="max-w-2xl">
        <PasswordChangeCard />
      </div>

      {canManageMembers(session.role) && (
        <OnboardingProgressCard users={onboardingUsers} />
      )}

      {/* Financial Categories Management Overview (Section 16 & 127) */}
      <div className="card-surface p-6 bg-white space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shadow-xs">
            <Layers className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Configured Financial Categories
            </h3>
            <p className="text-[11px] text-slate-400">
              Active classification categories for income streams and choir expenses.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Income Categories */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Income Streams ({incomeCategories.length})
            </span>
            <div className="flex flex-wrap gap-2">
              {incomeCategories.map((c) => (
                <span
                  key={c.id}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-semibold text-slate-800"
                >
                  {c.name}
                </span>
              ))}
            </div>
          </div>

          {/* Expense Categories */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Expense Categories ({expenseCategories.length})
            </span>
            <div className="flex flex-wrap gap-2">
              {expenseCategories.map((c) => (
                <span
                  key={c.id}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-semibold text-slate-800"
                >
                  {c.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
