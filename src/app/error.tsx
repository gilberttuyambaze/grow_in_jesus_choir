'use client'

import * as React from 'react'
import Link from 'next/link'
import { AlertCircle, RotateCcw, LayoutDashboard, LoaderCircle } from 'lucide-react'
import { ChoirLogo } from '@/components/brand/ChoirLogo'

export default function ErrorPage({
  error,
  reset
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const [isRetrying, startRetry] = React.useTransition()
  React.useEffect(() => {
    console.error('Unhandled platform error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-6 text-center selection:bg-indigo-600 selection:text-white">
      <div className="flex flex-col items-center mb-8">
        <ChoirLogo className="w-16 h-16 object-contain rounded-2xl mb-3" />
        <span className="text-sm font-bold tracking-tight text-slate-900">
          Grow in Jesus Choir
        </span>
      </div>

      <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mb-5 border border-rose-150 shadow-md shadow-rose-500/10">
        <AlertCircle className="w-8 h-8 stroke-[2]" />
      </div>

      <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 block mb-2">
        Platform Notice
      </span>

      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-2 font-sans">
        Something Needs Attention
      </h1>

      <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed mb-6">
        An unexpected situation occurred while loading your financial workspace.
        Your choir records are protected in the database.
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={() => startRetry(() => reset())}
          disabled={isRetrying}
          aria-busy={isRetrying}
          className="brand-button w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full text-xs font-semibold disabled:cursor-wait disabled:opacity-60"
        >
          {isRetrying ? <LoaderCircle className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
          <span>{isRetrying ? 'Retrying…' : 'Try Again'}</span>
        </button>

        <Link
          href="/dashboard"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold shadow-xs transition-all"
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span>Go to Dashboard</span>
        </Link>
      </div>
    </div>
  )
}
