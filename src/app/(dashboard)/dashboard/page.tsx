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
import { getFinancialSummary, getFinancialRecords } from '@/lib/db'
import { formatCurrency } from '@/lib/utils/currency'
import { MetricWaveCard } from '@/components/dashboard/MetricWaveCard'
import { MoneyFlowChart } from '@/components/dashboard/MoneyFlowChart'
import { RecentActivityFeed } from '@/components/dashboard/RecentActivityFeed'
import { TopCategoriesCard } from '@/components/dashboard/TopCategoriesCard'
import { ReviewQueueCard } from '@/components/dashboard/ReviewQueueCard'
import { DonutStatusCard } from '@/components/dashboard/DonutStatusCard'
import { FinancialRecordTable } from '@/components/finance/FinancialRecordTable'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

export default async function DashboardPage() {
  const session = await getSessionUser()
  if (!session) {
    redirect('/login')
  }

  const summary = getFinancialSummary()
  const records = getFinancialRecords({ limit: 6 })

  const isLeader = session.role === 'LEADER' || session.role === 'ADMIN'
  const firstName = session.fullName.split(' ')[0]

  return (
    <div className="space-y-6">
      {/* Welcome Greeting matching Reference */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-sans">
          Welcome back, {firstName} 👋
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          {isLeader
            ? "Here's what's happening in your choir finances today."
            : 'Here is your personal choir contribution overview.'}
        </p>
      </div>

      {/* LEADER DASHBOARD EXPERIENCE MATCHING REFERENCE IMAGE */}
      {isLeader ? (
        <>
          {/* TOP ROW: 5 KPI MINI CARDS WITH SPARKLINE WAVES */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <MetricWaveCard
              label="Current Balance"
              value="1.85M"
              subValue="RWF"
              trend="12% vs last month"
              color="blue"
              icon={<WalletCards className="w-4 h-4" />}
            />
            <MetricWaveCard
              label="Money Received"
              value="2.86M"
              subValue="RWF"
              trend="18% vs last month"
              color="purple"
              icon={<ArrowDownLeft className="w-4 h-4" />}
            />
            <MetricWaveCard
              label="Contribution Rate"
              value="84.0%"
              trend="2.4% vs last month"
              color="emerald"
              icon={<Percent className="w-4 h-4" />}
            />
            <MetricWaveCard
              label="Money Spent"
              value="1.02M"
              subValue="RWF"
              trend="15% vs budget"
              color="amber"
              icon={<ArrowUpRight className="w-4 h-4" />}
            />
            <MetricWaveCard
              label="Active Members"
              value="50"
              subValue="Choir"
              trend="8% recorded"
              color="cyan"
              icon={<Users className="w-4 h-4" />}
            />
          </div>

          {/* MIDDLE ROW: 2/3 CHART + 1/3 ACTIVITY FEED */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <MoneyFlowChart />
            </div>
            <div>
              <RecentActivityFeed />
            </div>
          </div>

          {/* BOTTOM ROW: 3 CARDS (TOP CATEGORIES, REVIEW QUEUE, DONUT STATUS) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <TopCategoriesCard />
            </div>
            <div>
              <ReviewQueueCard />
            </div>
            <div>
              <DonutStatusCard />
            </div>
          </div>

          {/* RECENT RECORDS TABLE SECTION */}
          <div className="card-surface p-6 bg-white">
            <div className="flex items-center justify-between mb-5">
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
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                View all records →
              </Link>
            </div>

            <FinancialRecordTable records={records} userRole={session.role} />
          </div>
        </>
      ) : (
        /* MEMBER DASHBOARD EXPERIENCE (SIMPLIFIED & ALIGNED WITH REFERENCE AESTHETIC) */
        <div className="space-y-6 max-w-4xl">
          {/* Member Card with Reference Wave */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricWaveCard
              label="Your Total Contributions"
              value="50,000"
              subValue="RWF"
              trend="October Recorded"
              color="emerald"
              icon={<CheckCircle2 className="w-4 h-4" />}
            />
            <MetricWaveCard
              label="Choir Financial Health"
              value="Healthy"
              trend="Audited & Stable"
              color="blue"
              icon={<WalletCards className="w-4 h-4" />}
            />
            <MetricWaveCard
              label="Active Choir Members"
              value="50"
              subValue="Members"
              trend="42 recorded"
              color="cyan"
              icon={<Users className="w-4 h-4" />}
            />
          </div>

          {/* Member Contribution History */}
          <div className="card-surface p-6 bg-white">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight mb-4">
              Your Contribution History
            </h3>
            <div className="divide-y divide-slate-100 text-xs">
              <div className="py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-semibold text-xs text-slate-900">October 2026</h5>
                    <span className="text-[11px] text-slate-500">Monthly member contribution</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-xs text-emerald-700 block">
                    {formatCurrency(50000)}
                  </span>
                  <Badge variant="recorded">Recorded</Badge>
                </div>
              </div>

              <div className="py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-semibold text-xs text-slate-900">September 2026</h5>
                    <span className="text-[11px] text-slate-500">Monthly member contribution</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-xs text-emerald-700 block">
                    {formatCurrency(50000)}
                  </span>
                  <Badge variant="recorded">Recorded</Badge>
                </div>
              </div>

              <div className="py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-semibold text-xs text-slate-900">August 2026</h5>
                    <span className="text-[11px] text-slate-500">Monthly member contribution</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-xs text-emerald-700 block">
                    {formatCurrency(50000)}
                  </span>
                  <Badge variant="recorded">Recorded</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
