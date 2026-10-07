import Link from 'next/link'
import { ArrowUpRight, ShieldCheck, Sparkles, WalletCards, Users, BarChart3, CheckCircle2 } from 'lucide-react'
import { getSessionUser } from '@/lib/auth/session'

export default async function LandingPage() {
  const session = await getSessionUser()

  return (
    <div className="min-h-screen bg-[#f7f9f7] text-[#1c3329] flex flex-col justify-between selection:bg-[#315b4d] selection:text-white">
      {/* Navigation */}
      <header className="h-20 px-6 sm:px-12 border-b border-[#e2eae4] bg-[#f7f9f7]/80 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between max-w-7xl w-full mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2f5c4d] to-[#1c3a30] text-white flex items-center justify-center font-bold text-lg shadow-sm">
            G
          </div>
          <div>
            <span className="font-semibold text-sm tracking-tight text-[#1b352b] block leading-tight">
              Grow in Jesus Choir
            </span>
            <span className="text-[11px] text-[#71857a]">Financial Platform</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[#486356] hover:text-[#1e382d] hover:bg-[#eaf1ec] transition-all"
          >
            Sign in
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2e5748] hover:bg-[#224438] text-white text-xs font-semibold shadow-xs transition-all"
          >
            <span>Open Workspace</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-16 sm:py-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e3efe6] border border-[#cfe2d4] text-[#326149] text-xs font-medium mb-8">
          <Sparkles className="w-3.5 h-3.5 text-[#cf9b4e]" />
          <span>Futuristic Technology Underneath • Simple Human Experience</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-serif font-normal text-[#1a3329] tracking-tight leading-[1.15] max-w-3xl mx-auto">
          Faithful Stewardship. Total Transparency.
        </h1>

        <p className="mt-6 text-sm sm:text-base text-[#657a70] max-w-2xl mx-auto leading-relaxed">
          A dedicated financial monitoring platform designed specifically for <strong>Grow in Jesus Choir</strong>. Track member contributions, manage music and transport expenses, and monitor financial health with clarity and confidence.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#2e5748] hover:bg-[#224438] text-white text-sm font-semibold shadow-lg shadow-[#2e5748]/20 transition-all flex items-center justify-center gap-2"
          >
            <span>Go to Financial Dashboard</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-white hover:bg-[#f1f6f2] border border-[#dce6df] text-[#3b594b] text-sm font-semibold transition-all flex items-center justify-center"
          >
            Member & Leader Sign In
          </Link>
        </div>

        {/* 3 Pillar Features */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="p-6 rounded-3xl bg-white border border-[#e2eae4] shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-[#e3efe6] text-[#34694e] flex items-center justify-center mb-4">
              <WalletCards className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-[#1e382d] mb-1">Human Simplicity</h3>
            <p className="text-xs text-[#6e8277] leading-relaxed">
              No complex accounting jargon. Clear records for money received and money spent in Rwandan Francs (RWF).
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-[#e2eae4] shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-[#fbf0de] text-[#a4712b] flex items-center justify-center mb-4">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-[#1e382d] mb-1">Member Participation</h3>
            <p className="text-xs text-[#6e8277] leading-relaxed">
              Real-time monitoring of monthly contributions across Soprano, Alto, Tenor, and Bass voice parts.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-[#e2eae4] shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-[#e6edf4] text-[#355b82] flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-[#1e382d] mb-1">Audited & Accountable</h3>
            <p className="text-xs text-[#6e8277] leading-relaxed">
              Complete historical audit trail for every submitted, verified, and approved record.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#e2eae4] py-8 px-6 text-center text-xs text-[#7c8f85]">
        <p>© 2026 Grow in Jesus Choir. Built with care for faithful stewardship.</p>
      </footer>
    </div>
  )
}

