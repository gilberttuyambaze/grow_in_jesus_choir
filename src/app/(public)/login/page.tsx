'use client'

import * as React from 'react'
import Link from 'next/link'
import { Lock, Mail } from 'lucide-react'
import { loginAction } from '@/features/auth/actions'
import { ChoirLogo } from '@/components/brand/ChoirLogo'

export default function LoginPage() {
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const res = await loginAction(formData)
    if (res && !res.success) {
      setError(res.error)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative flex flex-col justify-center items-center p-4 sm:p-8 bg-gradient-to-br from-[#dfe6f0] via-[#e8edf6] to-[#d6dfec] overflow-hidden selection:bg-indigo-600 selection:text-white">
      {/* Pristine Clean Ambient Background (Matching reference media_1791405995630_d6fd4dd5.png) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {/* Ambient soft glow without any grid lines */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-tr from-cyan-200/20 via-blue-200/30 to-indigo-200/15 rounded-full blur-3xl" />
      </div>

      {/* Top Left Glowing Brand Emblem */}
      <div className="absolute top-5 left-5 sm:top-8 sm:left-8 z-20">
        <Link
          href="/"
          className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-tr from-[#00d2ff] via-[#3b82f6] to-[#7c3aed] p-[2.5px] shadow-lg shadow-indigo-500/25 hover:scale-105 active:scale-95 transition-all flex items-center justify-center group"
          title="Grow in Jesus Choir Home"
        >
          <div className="w-full h-full rounded-full bg-gradient-to-tr from-[#2563eb] to-[#7c3aed] flex items-center justify-center text-white font-extrabold text-base tracking-wider shadow-inner">
            N
          </div>
        </Link>
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 w-full max-w-[440px] sm:max-w-[460px] mx-auto min-w-0">
        {/* Floating Brand Squircle & Titles */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-block group mb-3 sm:mb-4">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-[22px] sm:rounded-[30px] bg-white/90 backdrop-blur-md border border-white/90 shadow-[0_10px_28px_rgba(0,0,0,0.06),0_0_0_1px_rgba(255,255,255,0.9)_inset] overflow-hidden flex items-center justify-center mx-auto group-hover:scale-105 transition-transform duration-300">
              <ChoirLogo className="w-full h-full object-cover" />
            </div>
          </Link>
          <h1 className="text-2xl sm:text-[28px] font-bold text-slate-900 tracking-tight font-sans leading-tight">
            Grow in Jesus Choir
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-normal mt-1.5">
            Sign in to access your financial monitoring platform
          </p>
        </div>

        {/* Solid Pure White Login Card Container (Eliminates any line shine-through) */}
        <div className="bg-white rounded-[28px] sm:rounded-[34px] border border-white/90 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] p-6 sm:p-9 transition-all">
          {error && (
            <div className="mb-5 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* EMAIL ADDRESS */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                EMAIL ADDRESS
              </label>
              <div className="relative flex items-center rounded-2xl bg-[#EEF2FC] px-4 py-3.5 border-0 outline-none ring-0 transition-all">
                <Mail className="w-4 h-4 text-slate-400 mr-3 shrink-0" />
                <input
                  type="email"
                  name="email"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="bizimungu50@gmail.com"
                  className="w-full bg-transparent text-xs sm:text-sm text-slate-800 placeholder-slate-400 border-0 outline-none focus:outline-none focus-visible:outline-none ring-0 focus:ring-0 focus-visible:ring-0 shadow-none font-medium"
                  style={{ outline: 'none', border: 'none', boxShadow: 'none' }}
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div className="mt-4">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                PASSWORD
              </label>
              <div className="relative flex items-center rounded-2xl bg-[#EEF2FC] px-4 py-3.5 border-0 outline-none ring-0 transition-all">
                <Lock className="w-4 h-4 text-slate-400 mr-3 shrink-0" />
                <input
                  type="password"
                  name="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••••"
                  className="w-full bg-transparent text-xs sm:text-sm text-slate-800 placeholder-slate-400 border-0 outline-none focus:outline-none focus-visible:outline-none ring-0 focus:ring-0 focus-visible:ring-0 shadow-none font-medium"
                  style={{ outline: 'none', border: 'none', boxShadow: 'none' }}
                />
              </div>
            </div>

            {/* Cyan-to-Purple Gradient Sign-In Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-[#00d2ff] via-[#3b82f6] to-[#6366f1] hover:from-[#00c0f0] hover:via-[#2563eb] hover:to-[#4f46e5] text-white text-xs sm:text-sm font-semibold tracking-wide shadow-[0_12px_28px_-6px_rgba(59,130,246,0.5)] hover:shadow-[0_16px_34px_-6px_rgba(59,130,246,0.65)] transition-all duration-200 active:scale-[0.99] disabled:opacity-50 mt-6 flex items-center justify-center cursor-pointer"
            >
              {isLoading ? 'Signing in...' : 'Sign In to Workspace'}
            </button>
          </form>

          {/* Reference Footnote Note */}
          <p className="mt-5 text-center text-[11px] sm:text-xs text-slate-400 font-normal leading-relaxed">
            Need an account? Ask your choir administrator to create one.
          </p>
        </div>

        {/* Back to Home Link */}
        <div className="text-center mt-5">
          <Link
            href="/"
            className="text-xs text-slate-500 hover:text-slate-800 transition-colors inline-flex items-center gap-1"
          >
            ← Back to public homepage
          </Link>
        </div>
      </div>
    </div>
  )
}
