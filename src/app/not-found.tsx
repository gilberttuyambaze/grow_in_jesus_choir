import Link from 'next/link'
import { ArrowLeft, Compass, Sparkles } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-6 text-center selection:bg-indigo-600 selection:text-white">
      <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-5 border border-indigo-150 shadow-md shadow-indigo-500/10">
        <Compass className="w-8 h-8 stroke-[2]" />
      </div>

      <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 block mb-2">
        Error 404
      </span>

      <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2 font-sans">
        Page Not Found
      </h1>

      <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed mb-6">
        The choir financial workspace page or record you requested does not exist or has been moved.
      </p>

      <Link
        href="/dashboard"
        className="brand-button inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-semibold"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Return to Dashboard</span>
      </Link>
    </div>
  )
}
