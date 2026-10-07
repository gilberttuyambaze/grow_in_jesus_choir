'use client'

import * as React from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'

export default function DashboardError({
  error,
  reset
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  React.useEffect(() => {
    console.error('Financial application runtime error:', error)
  }, [error])

  return (
    <div className="py-20 text-center max-w-md mx-auto">
      <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100">
        <AlertCircle className="w-7 h-7" />
      </div>

      <h2 className="text-xl font-serif text-[#1e382d] font-normal mb-2">
        We couldn&apos;t load your financial records
      </h2>

      <p className="text-xs text-[#71857a] leading-relaxed mb-6">
        An unexpected issue occurred while fetching financial data. Your entered information is secure.
      </p>

      <button
        onClick={() => reset()}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2e5748] hover:bg-[#234538] text-white text-xs font-semibold shadow-xs transition-all"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        <span>Try Again</span>
      </button>
    </div>
  )
}

