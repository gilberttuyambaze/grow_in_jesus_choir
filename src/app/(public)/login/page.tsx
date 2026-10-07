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
      {/* Futuristic Isometric Diamond Lattice Grid Background (Pixel-matched to reference media_1791405968137_04664746.png) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <svg
          className="absolute w-full h-full opacity-65"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="isometric-cyber-grid"
              width="120"
              height="120"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <path
                d="M 120 0 L 0 0 0 120"
                fill="none"
                stroke="rgba(255, 255, 255, 0.75)"
                strokeWidth="1.2"
              />
              <circle cx="0" cy="0" r="3.5" fill="#ffffff" />
              <circle cx="120" cy="0" r="3.5" fill="#ffffff" />
              <circle cx="0" cy="120" r="3.5" fill="#ffffff" />
              <circle cx="120" cy="120" r="3.5" fill="#ffffff" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#isometric-cyber-grid)" />
        </svg>

        {/* Ambient soft glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-tr from-cyan-200/25 via-blue-200/35 to-indigo-200/20 rounded-full blur-3xl" />
      </div>

      {/* Top Left Glowing Brand Emblem matching reference image */}
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
          <Link href="/" className="inline-block group mb-3">
            <div className="w-14 h-14 rounded-2xl bg-white/70 backdrop-blur-md border border-white/90 shadow-[0_4px_16px_rgba(0,0,0,0.04)] flex items-center justify-center mx-auto group-hover:scale-105 transition-transform">
              <ChoirLogo className="w-8 h-8 rounded-lg object-contain" />
            </div>
          </Link>
          <h1 className="text-2xl sm:text-[28px] font-bold text-slate-900 tracking-tight font-sans leading-tight">
            Grow in Jesus Choir
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-normal mt-1.5">
            Sign in to access your financial monitoring platform
          </p>
        </div>

        {/* Glassmorphism Floating Login Card */}
        <div className="bg-white/60 backdrop-blur-2xl rounded-[28px] sm:rounded-[34px] border border-white/90 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.08),0_0_0_1px_rgba(255,255,255,0.85)_inset] p-6 sm:p-9 transition-all">
          {error && (
            <div className="mb-5 p-3 rounded-2xl bg-rose-50/90 border border-rose-200 text-rose-700 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* EMAIL ADDRESS */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                EMAIL ADDRESS
              </label>
              <div className="relative flex items-center rounded-2xl bg-[#EEF2FC]/80 border border-white/90 focus-within:bg-white focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-500/20 px-4 py-3.5 transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]">
                <Mail className="w-4 h-4 text-slate-400 mr-3 shrink-0" />
                <input
                  type="email"
                  name="email"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.org"
                  className="w-full bg-transparent text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none font-medium"
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div className="mt-4">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                PASSWORD
              </label>
              <div className="relative flex items-center rounded-2xl bg-[#EEF2FC]/80 border border-white/90 focus-within:bg-white focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-500/20 px-4 py-3.5 transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]">
                <Lock className="w-4 h-4 text-slate-400 mr-3 shrink-0" />
                <input
                  type="password"
                  name="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••••"
                  className="w-full bg-transparent text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none font-medium"
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
