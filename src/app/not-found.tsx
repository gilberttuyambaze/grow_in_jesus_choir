import Link from 'next/link'
import { ArrowLeft, Compass } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#f7f9f7] flex flex-col justify-center items-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#e3efe6] text-[#2c5b48] flex items-center justify-center mb-5 border border-[#cfe2d4]">
        <Compass className="w-8 h-8 stroke-[1.75]" />
      </div>

      <span className="text-[11px] font-bold uppercase tracking-widest text-[#798e83] block mb-2">
        Error 404
      </span>

      <h1 className="text-3xl font-serif text-[#1e382d] font-normal tracking-tight mb-2">
        Page Not Found
      </h1>

      <p className="text-xs text-[#6e8276] max-w-sm mx-auto leading-relaxed mb-6">
        The financial page or record view you requested does not exist or has been relocated.
      </p>

      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2e5748] hover:bg-[#234538] text-white text-xs font-semibold shadow-xs transition-all"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Return to Dashboard</span>
      </Link>
    </div>
  )
}

