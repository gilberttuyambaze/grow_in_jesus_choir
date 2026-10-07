import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  WalletCards,
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  Calendar,
  ChevronRight
} from 'lucide-react'
import { getSessionUser } from '@/lib/auth/session'
import { getFinancialSummary, getFinancialRecords } from '@/lib/db'
import { formatCurrency } from '@/lib/utils/currency'
import { formatDate } from '@/lib/utils/date'
import { FinancialPulse } from '@/components/finance/FinancialPulse'
import { FinancialRecordTable } from '@/components/finance/FinancialRecordTable'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

export default async function DashboardPage() {
  const session = await getSessionUser()
  if (!session) {
    redirect('/login')
  }

  const summary = getFinancialSummary()
  const records = getFinancialRecords({ limit: 6 })

  const isLeader = session.role === 'LEADER' || session.role === 'ADMIN'

  return (
    <div className="space-y-7">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#798e82] block mb-1">
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
          <h1 className="text-2xl sm:text-3xl font-serif text-[#1e382d] tracking-tight">
            Good morning, {session.fullName.split(' ')[0]} 👋
          </h1>
          <p className="text-xs sm:text-sm text-[#6f8277] mt-1">
            {isLeader
              ? "Here's your choir's complete financial picture."
              : 'Here is your personal choir contribution overview.'}
          </p>
        </div>

        {/* Quick Role Context Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-[#dce6df] shadow-xs text-xs text-[#416153]">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="font-medium">
            Active as: <strong className="font-semibold">{session.role}</strong>
          </span>
        </div>
      </div>

      {/* LEADER DASHBOARD VIEW */}
      {isLeader ? (
        <>
          {/* SIGNATURE FINANCIAL PULSE */}
          <FinancialPulse summary={summary} />

          {/* 4 CORE METRIC CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-5">
              <div className="flex items-center justify-between text-xs text-[#708479] font-medium">
                <span>Current Balance</span>
                <span className="w-8 h-8 rounded-lg bg-[#eaf2ec] text-[#2f5c4a] flex items-center justify-center">
                  <WalletCards className="w-4 h-4" />
                </span>
              </div>
              <p className="text-xl sm:text-2xl font-serif font-semibold text-[#1d352b] mt-3">
                {formatCurrency(summary.currentBalance)}
              </p>
              <div className="mt-3 flex items-center gap-1.5 text-[11px] text-[#3e7751] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Healthy financial reserve</span>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between text-xs text-[#708479] font-medium">
                <span>Money Received</span>
                <span className="w-8 h-8 rounded-lg bg-[#e3efe6] text-[#3d7a52] flex items-center justify-center">
                  <ArrowDownLeft className="w-4 h-4" />
                </span>
              </div>
              <p className="text-xl sm:text-2xl font-serif font-semibold text-[#1d352b] mt-3">
                {formatCurrency(summary.totalIncome)}
              </p>
              <div className="mt-3 flex items-center gap-1.5 text-[11px] text-[#3d7a52] font-medium">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+12.5% vs last month</span>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between text-xs text-[#708479] font-medium">
                <span>Money Spent</span>
                <span className="w-8 h-8 rounded-lg bg-[#fbf0de] text-[#a16f2c] flex items-center justify-center">
                  <ArrowUpRight className="w-4 h-4" />
                </span>
              </div>
              <p className="text-xl sm:text-2xl font-serif font-semibold text-[#1d352b] mt-3">
                {formatCurrency(summary.totalExpenses)}
              </p>
              <div className="mt-3 text-[11px] text-[#718279]">
                <span>Within monthly budget allocation</span>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between text-xs text-[#708479] font-medium">
                <span>Needs Attention</span>
                <span className="w-8 h-8 rounded-lg bg-[#fdeeed] text-[#b65348] flex items-center justify-center">
                  <Bell className="w-4 h-4" />
                </span>
              </div>
              <p className="text-xl sm:text-2xl font-serif font-semibold text-[#1d352b] mt-3">
                {summary.pendingCount} <span className="text-xs font-sans text-[#73847b] font-normal">records</span>
              </p>
              <div className="mt-3 text-[11px] text-[#b65348] font-medium">
                <span>Pending leader verification</span>
              </div>
            </Card>
          </div>

          {/* TWO-COLUMN INSIGHT & CHART GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Trend Chart (2 columns) */}
            <Card className="lg:col-span-2 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#82938a] block">
                    Financial Flow
                  </span>
                  <h3 className="text-lg font-serif text-[#203a30]">Money Flow Trends</h3>
                </div>
                <span className="text-xs text-[#6e8076] bg-[#f0f4f1] px-2.5 py-1 rounded-lg">
                  Last 6 Months
                </span>
              </div>

              {/* Chart Visual Graphic */}
              <div className="py-2">
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-2xl font-serif font-medium text-[#254b3c]">
                    +{formatCurrency(summary.currentBalance)}
                  </span>
                  <span className="text-xs text-emerald-700 font-semibold flex items-center gap-0.5">
                    <TrendingUp className="w-3.5 h-3.5" /> +18.4%
                  </span>
                  <span className="text-[11px] text-[#788981]">growth over baseline</span>
                </div>

                <div className="h-44 w-full relative">
                  <svg viewBox="0 0 700 200" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                    <defs>
                      <linearGradient id="flowGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#315b4d" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#315b4d" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    {/* Area fill */}
                    <path
                      d="M0 150 C70 140 140 120 210 135 S350 75 420 85 S560 45 630 50 S680 30 700 35 L700 200 L0 200 Z"
                      fill="url(#flowGrad)"
                    />
                    {/* Income curve */}
                    <path
                      d="M0 150 C70 140 140 120 210 135 S350 75 420 85 S560 45 630 50 S680 30 700 35"
                      fill="none"
                      stroke="#2b5243"
                      strokeWidth="3"
                    />
                    {/* Expense curve */}
                    <path
                      d="M0 180 C70 165 140 170 210 160 S350 140 420 145 S560 120 630 130 S680 110 700 115"
                      fill="none"
                      stroke="#cf9b4e"
                      strokeWidth="2.5"
                      strokeDasharray="5 5"
                    />
                  </svg>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#86968f] pt-2 border-t border-[#edf2ee]">
                  <span>May</span>
                  <span>Jun</span>
                  <span>Jul</span>
                  <span>Aug</span>
                  <span>Sep</span>
                  <span>Oct</span>
                </div>

                <div className="flex items-center gap-6 mt-4 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#2b5243]" />
                    <span className="text-[#4e6459] font-medium">Money Received</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-1.5 rounded bg-[#cf9b4e]" />
                    <span className="text-[#4e6459] font-medium">Money Spent</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Financial Insight Card (1 column) */}
            <div className="rounded-3xl bg-[#2e5748] text-white p-6 shadow-md flex flex-col justify-between relative overflow-hidden">
              <div 
                className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full border border-white/10 pointer-events-none" 
                aria-hidden="true" 
              />
              <div>
                <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-emerald-200/80 font-bold mb-4">
                  <Sparkles className="w-4 h-4 text-[#e6c68b]" />
                  <span>Financial Insight</span>
                </div>

                <h3 className="text-xl font-serif font-normal leading-snug mb-3">
                  Steady growth is building a stronger choir foundation.
                </h3>
                <p className="text-xs text-white/80 leading-relaxed">
                  Income has grown steadily for three consecutive months, while choir expenditures remain within planned budgets.
                </p>
              </div>

              <div className="pt-6 border-t border-white/15 mt-6">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-white/80">Monthly Contributions</span>
                  <span className="font-bold text-[#f2d398]">{summary.contributionPercentage}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/20 overflow-hidden mb-2">
                  <div
                    className="h-full rounded-full bg-[#e3be7b]"
                    style={{ width: `${summary.contributionPercentage}%` }}
                  />
                </div>
                <p className="text-[11px] text-white/70">
                  {summary.membersContributed} of {summary.totalMembers} choir members recorded October
                </p>

                <Link
                  href="/reports"
                  className="mt-4 inline-flex items-center gap-1 text-xs text-[#edd5a4] hover:underline font-semibold"
                >
                  View full financial report →
                </Link>
              </div>
            </div>
          </div>

          {/* RECENT FINANCIAL RECORDS */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#82938a] block">
                  Recent Activity
                </span>
                <h3 className="text-lg font-serif text-[#203a30]">Financial Records</h3>
              </div>
              <Link
                href="/finances"
                className="text-xs font-semibold text-[#2f5c4b] hover:text-[#1e3e32] flex items-center gap-1"
              >
                <span>View all records</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <FinancialRecordTable records={records} userRole={session.role} />
          </Card>
        </>
      ) : (
        /* MEMBER DASHBOARD VIEW (Deliberately simplified human experience per Section 20) */
        <div className="space-y-6 max-w-4xl">
          {/* Member Personal Summary Card */}
          <div className="p-7 sm:p-8 rounded-3xl bg-gradient-to-br from-[#2f5c4d] to-[#1f3f33] text-white shadow-xl relative overflow-hidden">
            <div className="absolute right-0 top-0 w-64 h-64 bg-white/[0.04] rounded-full blur-2xl pointer-events-none" />
            <div className="relative z-10">
              <span className="text-xs uppercase tracking-widest text-emerald-200/80 font-bold block mb-1">
                Your Choir Contributions
              </span>
              <div className="text-4xl sm:text-5xl font-serif font-medium text-white my-3">
                {formatCurrency(50000)}
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-medium text-emerald-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>October contribution recorded</span>
              </div>
            </div>
          </div>

          {/* Member Contribution History */}
          <Card className="p-6">
            <h3 className="text-lg font-serif text-[#203a30] mb-4">Your Recent Contribution History</h3>
            <div className="divide-y divide-[#eef3ef] text-xs">
              <div className="py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                    <Calendar className="w-4 h-4" />
                  </span>
                  <div>
                    <h5 className="font-semibold text-sm text-[#20392e]">October 2026</h5>
                    <span className="text-[11px] text-[#718279]">Monthly member contribution</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-sm text-[#2f6644] block">
                    {formatCurrency(50000)}
                  </span>
                  <Badge variant="recorded">Recorded</Badge>
                </div>
              </div>

              <div className="py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                    <Calendar className="w-4 h-4" />
                  </span>
                  <div>
                    <h5 className="font-semibold text-sm text-[#20392e]">September 2026</h5>
                    <span className="text-[11px] text-[#718279]">Monthly member contribution</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-sm text-[#2f6644] block">
                    {formatCurrency(50000)}
                  </span>
                  <Badge variant="recorded">Recorded</Badge>
                </div>
              </div>

              <div className="py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                    <Calendar className="w-4 h-4" />
                  </span>
                  <div>
                    <h5 className="font-semibold text-sm text-[#20392e]">August 2026</h5>
                    <span className="text-[11px] text-[#718279]">Monthly member contribution</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-sm text-[#2f6644] block">
                    {formatCurrency(50000)}
                  </span>
                  <Badge variant="recorded">Recorded</Badge>
                </div>
              </div>
            </div>
          </Card>

          {/* Transparent Choir Health Card (Member overview without admin clutter) */}
          <Card className="p-6 bg-[#fafcfa]">
            <h4 className="text-sm font-semibold text-[#223d32] mb-1">Grow in Jesus Choir Financial Stewardship</h4>
            <p className="text-xs text-[#6e8076] leading-relaxed mb-4">
              Our choir operates with total financial transparency and accountability. All contributions directly support rehearsal transport, music equipment, choir robes, and Sunday worship ministry.
            </p>
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-[#e2ebe4]">
              <span className="text-xs font-medium text-[#405c50]">Choir Financial Status</span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Healthy & Stable
              </span>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

