'use client'

import * as React from 'react'
import { AlertCircle, RefreshCw, LoaderCircle } from 'lucide-react'

export default function DashboardError({
  error,
  reset
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const [isRetrying, startRetry] = React.useTransition()
  React.useEffect(() => {
    console.error('Financial application runtime error:', error)
  }, [error])

  return (
    <div className="py-20 text-center max-w-md mx-auto">
      <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100">
        <AlertCircle className="w-7 h-7" />
      </div>

      <h2 className="text-xl font-semibold text-slate-900 tracking-tight mb-2">
        We couldn&apos;t load your financial records
      </h2>

      <p className="text-xs text-slate-500 leading-relaxed mb-6">
        An unexpected issue occurred while fetching financial data. Your entered information is secure.
      </p>

      <button
        onClick={() => startRetry(() => reset())}
        disabled={isRetrying}
        aria-busy={isRetrying}
        className="brand-button inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold disabled:cursor-wait disabled:opacity-60"
      >
        {isRetrying ? <LoaderCircle className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
        <span>{isRetrying ? 'Retrying…' : 'Try Again'}</span>
      </button>
    </div>
  )
}
