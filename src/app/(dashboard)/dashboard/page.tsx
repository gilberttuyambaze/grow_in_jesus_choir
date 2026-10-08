import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  WalletCards,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  Users,
  CheckCircle2,
  Calendar,
  Sparkles,
  Percent
} from 'lucide-react'
import { getSessionUser } from '@/lib/auth/session'
import {
  getFinancialSummary,
  getFinancialRecords,
  getMemberByUserId,
  getMembers,
  getAuditLogs
} from '@/lib/db'
import { formatCurrency, formatCompactCurrency } from '@/lib/utils/currency'
import { formatDate } from '@/lib/utils/date'
import { MetricWaveCard } from '@/components/dashboard/MetricWaveCard'
import { MoneyFlowChart } from '@/components/dashboard/MoneyFlowChart'
import { RecentActivityFeed } from '@/components/dashboard/RecentActivityFeed'
import { TopCategoriesCard } from '@/components/dashboard/TopCategoriesCard'
import { ReviewQueueCard } from '@/components/dashboard/ReviewQueueCard'
import { DonutStatusCard } from '@/components/dashboard/DonutStatusCard'
import { FinancialRecordTable } from '@/components/finance/FinancialRecordTable'
import { Badge } from '@/components/ui/Badge'
import { canViewAllFinances } from '@/lib/permissions'
import { DashboardQuickActions, DashboardHeaderQuickButtons } from '@/components/dashboard/DashboardQuickActions'

export default async function DashboardPage() {
  const session = await getSessionUser()
  if (!session) {
    redirect('/login')
  }

  const canViewOrganizationData = canViewAllFinances(session.role)
  const member = canViewOrganizationData ? null : await getMemberByUserId(session.userId)
  const noSummary = {
    totalIncome: 0,
    totalExpenses: 0,
    currentBalance: 0,
    pendingCount: 0,
    totalTransactions: 0,
    totalMembers: 0,
    membersContributed: 0,
    contributionPercentage: 0,
    healthStatus: 'Healthy' as const
  }
  const [summary, allRecords, members, auditLogs] = await Promise.all([
    canViewOrganizationData ? getFinancialSummary() : member ? getFinancialSummary({ memberId: member.id }) : Promise.resolve(noSummary),
    canViewOrganizationData
      ? getFinancialRecords()
      : member
      ? getFinancialRecords({ memberId: member.id, limit: 12 })
      : Promise.resolve([]),
    canViewOrganizationData ? getMembers() : Promise.resolve([]),
    canViewOrganizationData ? getAuditLogs(10) : Promise.resolve([])
  ])

  const isLeader = canViewOrganizationData
  const memberRecords = isLeader ? [] : allRecords
  const memberTotal = memberRecords
    .filter((r) => r.type === 'income' && r.status === 'recorded')
    .reduce((sum, r) => sum + r.amount, 0)
  const memberPending = memberRecords.filter((r) => r.status === 'needs_review')

  const activeMembersCount = members.filter((m) => m.status === 'active').length
  const recordedContributionMemberIds = new Set(
    allRecords
      .filter((r) => r.type === 'income' && (r.status === 'recorded' || r.status === 'needs_review') && r.memberId)
      .map((r) => r.memberId)
  )
  const recordedContribCount = recordedContributionMemberIds.size
  const contributionRate = activeMembersCount > 0 ? ((recordedContribCount / activeMembersCount) * 100).toFixed(1) : '0.0'
  const pendingRate = activeMembersCount > 0 ? Math.round(((activeMembersCount - recordedContribCount) / activeMembersCount) * 100) : 0

  const firstName = session.fullName.split(' ')[0]

  return (
    <div className="space-y-6 min-w-0 w-full">
      {/* Welcome Greeting and 1-Click Header Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-sans truncate">
            Welcome back, {firstName} 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {isLeader
              ? "Here's what's happening in your choir finances today."
              : 'Here is your personal choir contribution overview.'}
          </p>
        </div>
        <DashboardHeaderQuickButtons userRole={session.role} />
      </div>

      {/* Prominent 1-Click Visual Communication Cards for Recording & Creation */}
      <DashboardQuickActions userRole={session.role} />

      {/* LEADER DASHBOARD EXPERIENCE MATCHING REFERENCE IMAGE */}
      {isLeader ? (
        <>
          {/* TOP ROW: 5 KPI MINI CARDS WITH SPARKLINE WAVES (RESPONSIVE GRID) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3.5 sm:gap-4">
            <MetricWaveCard
              label="Current Balance"
              value={formatCompactCurrency(summary.currentBalance)}
              subValue="RWF"
              trend="Reconciled net"
              color="blue"
              icon={<WalletCards className="w-4 h-4" />}
            />
            <MetricWaveCard
              label="Money Received"
              value={formatCompactCurrency(summary.totalIncome)}
              subValue="RWF"
              trend={`${allRecords.filter((r) => r.type === 'income' && r.status === 'recorded').length} income records`}
              color="purple"
              icon={<ArrowDownLeft className="w-4 h-4" />}
            />
            <MetricWaveCard
              label="Contribution Rate"
              value={`${contributionRate}%`}
              trend={`${recordedContribCount} of ${activeMembersCount} members`}
              color="emerald"
              icon={<Percent className="w-4 h-4" />}
            />
            <MetricWaveCard
              label="Money Spent"
              value={formatCompactCurrency(summary.totalExpenses)}
              subValue="RWF"
              trend={`${allRecords.filter((r) => r.type === 'expense' && r.status === 'recorded').length} expense records`}
              color="amber"
              icon={<ArrowUpRight className="w-4 h-4" />}
            />
            <MetricWaveCard
              label="Active Members"
              value={`${activeMembersCount}`}
              subValue="Choir"
              trend={`${pendingRate}% pending`}
              color="cyan"
              icon={<Users className="w-4 h-4" />}
            />
          </div>

          {/* MIDDLE ROW: 2/3 CHART + 1/3 ACTIVITY FEED (RESPONSIVE ON ALL DEVICES) */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 sm:gap-6 min-w-0">
            <div className="xl:col-span-2 min-w-0">
              <MoneyFlowChart records={allRecords} />
            </div>
            <div className="min-w-0">
              <RecentActivityFeed auditLogs={auditLogs} records={allRecords} />
            </div>
          </div>

          {/* BOTTOM ROW: 3 CARDS (RESPONSIVE ON TABLETS & PHONES) */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6 min-w-0">
            <div className="min-w-0">
              <TopCategoriesCard records={allRecords} />
            </div>
            <div className="min-w-0">
              <ReviewQueueCard records={allRecords} />
            </div>
            <div className="min-w-0 md:col-span-2 xl:col-span-1">
              <DonutStatusCard records={allRecords} />
            </div>
          </div>

          {/* RECENT RECORDS TABLE SECTION */}
          <div className="card-surface p-4 sm:p-6 min-w-0 overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  Financial Records Ledger
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Recent recorded income, member tithes, and expenditures.
                </p>
              </div>
              <Link
                href="/finances"
                className="liquid-silver-button liquid-silver-button-sm text-[11px] font-semibold text-slate-700"
              >
                <span>View all records →</span>
              </Link>
            </div>

            <FinancialRecordTable records={allRecords.slice(0, 12)} userRole={session.role} />
          </div>
        </>
      ) : (
        /* MEMBER DASHBOARD EXPERIENCE (SIMPLIFIED & ALIGNED WITH REFERENCE AESTHETIC) */
        <div className="space-y-6 max-w-4xl min-w-0">
          {/* Member Card with Reference Wave */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
            <MetricWaveCard
              label="Your Total Contributions"
              value={formatCompactCurrency(memberTotal)}
              subValue="RWF"
              trend={memberRecords.length > 0 ? `${memberRecords.length} recorded on ledger` : 'No contributions recorded'}
              color="emerald"
              icon={<CheckCircle2 className="w-4 h-4" />}
            />
            <MetricWaveCard
              label="Submission Status"
              value={memberPending.length > 0 ? `${memberPending.length} In Review` : 'Verified'}
              trend={memberPending.length > 0 ? 'Leader review pending' : 'Audited & Reconciled'}
              color="blue"
              icon={<WalletCards className="w-4 h-4" />}
            />
            <MetricWaveCard
              label="Your Membership"
              value={member?.status === 'active' ? 'Active' : 'Inactive'}
              subValue="Status"
              trend={member ? member.voicePart : 'No member profile linked'}
              color="cyan"
              icon={<Users className="w-4 h-4" />}
            />
          </div>

          {/* Member Contribution History */}
          <div className="card-surface p-4 sm:p-6 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  Your Contribution History
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Real-time ledger of your personal payments and submissions.
                </p>
              </div>
              <Link
                href="/finances"
                className="liquid-silver-button liquid-silver-button-sm text-[11px] font-semibold text-slate-700"
              >
                <span>View all records →</span>
              </Link>
            </div>

            {memberRecords.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
                <p className="font-semibold text-slate-700">No contributions recorded yet</p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                  Use the "+ New Record" button at the top to record your monthly contribution.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {memberRecords.map((rec) => (
                  <div key={rec.id} className="py-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h5 className="font-semibold text-xs text-slate-900 truncate">
                          {rec.description}
                        </h5>
                        <span className="text-[11px] text-slate-500 truncate block">
                          {formatDate(rec.recordDate)} • {rec.categoryName || 'Contribution'}
                        </span>
                        {rec.rejectionReason && (
                          <span className="text-[10px] text-rose-600 font-medium block truncate mt-0.5">
                            Note: {rec.rejectionReason}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-bold text-xs text-emerald-700 block">
                        {formatCurrency(rec.amount)}
                      </span>
                      {rec.status === 'recorded' && <Badge variant="recorded">Recorded</Badge>}
                      {rec.status === 'needs_review' && <Badge variant="review">Needs review</Badge>}
                      {rec.status === 'rejected' && <Badge variant="rejected">Rejected</Badge>}
                      {rec.status === 'voided' && <Badge variant="voided">Voided</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
