import Link from 'next/link'
import { ArrowUpRight, ShieldCheck, Sparkles, WalletCards, Users, BarChart3, CheckCircle2 } from 'lucide-react'
import { getSessionUser } from '@/lib/auth/session'

export default async function LandingPage() {
  const session = await getSessionUser()

  return (
    <div className="min-h-screen bg-[#f4f6fc] text-slate-900 flex flex-col justify-between selection:bg-indigo-600 selection:text-white">
      {/* Navigation matching Reference */}
      <header className="h-20 px-6 sm:px-12 border-b border-slate-200/80 bg-white/70 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between max-w-7xl w-full mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-indigo-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight text-slate-900 block leading-tight">
              GROW IN JESUS CHOIR
            </span>
            <span className="text-[10px] text-slate-500 font-medium">Financial Monitoring Platform</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 rounded-full text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all"
          >
            Sign in
          </Link>
          <Link
            href={session ? '/dashboard' : '/login'}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 transition-all"
          >
            <span>{session ? 'Open Workspace' : 'Get Started'}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-16 sm:py-24 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-8 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>Futuristic Technology Underneath • Simple Human Experience</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-bold text-slate-900 tracking-tight leading-[1.15] max-w-3xl mx-auto font-sans">
          Faithful Stewardship. Total Transparency.
        </h1>

        <p className="mt-6 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
          A dedicated financial command center designed specifically for <strong>Grow in Jesus Choir</strong>. Track member contributions, manage transport and logistics, and monitor choir financial health with confidence.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href={session ? '/dashboard' : '/login'}
            className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2"
          >
            <span>Enter Financial Dashboard</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold shadow-xs transition-all flex items-center justify-center"
          >
            1-Click Demo Accounts
          </Link>
        </div>

        {/* 3 Pillar Features matching Reference Cards */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="card-surface p-6 bg-white space-y-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shadow-xs">
              <WalletCards className="w-5 h-5 stroke-[2.5]" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Human Simplicity</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              No complex accounting jargon. Clear records for money received and money spent in Rwandan Francs (RWF).
            </p>
          </div>

          <div className="card-surface p-6 bg-white space-y-3">
            <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold shadow-xs">
              <Users className="w-5 h-5 stroke-[2.5]" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Member Contributions</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Real-time tracking of monthly contributions across Soprano, Alto, Tenor, and Bass voice sections.
            </p>
          </div>

          <div className="card-surface p-6 bg-white space-y-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shadow-xs">
              <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Audited & Accountable</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Complete historical audit trail and encrypted document storage for every verified transaction.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 py-8 px-6 text-center text-xs text-slate-500">
        <p>© 2026 Grow in Jesus Choir. Built with care for faithful financial stewardship in Kigali, Rwanda.</p>
      </footer>
    </div>
  )
}
