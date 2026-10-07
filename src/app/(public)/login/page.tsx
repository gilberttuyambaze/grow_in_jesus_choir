'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Lock, Mail, Eye, EyeOff, LoaderCircle } from 'lucide-react'
import { loginAction } from '@/features/auth/actions'

export default function LoginPage() {
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [showPassword, setShowPassword] = React.useState(false)
  const [nextPath, setNextPath] = React.useState('')
  const [loginState, formAction, isLoading] = React.useActionState(loginAction, { error: null })

  React.useEffect(() => {
    setNextPath(new URLSearchParams(window.location.search).get('next') || '')
  }, [])

  return (
    <div className="min-h-screen relative flex flex-col justify-center items-center p-4 sm:p-8 overflow-hidden selection:bg-indigo-600 selection:text-white">
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
        <Image
          src="/images/brand/grow-in-jesus-choir-logo.gif"
          alt=""
          width={600}
          height={600}
          unoptimized
          className="absolute left-[8%] top-[18%] h-10 w-10 object-contain opacity-20 mix-blend-multiply sm:h-14 sm:w-14"
        />
        <Image
          src="/images/brand/grow-in-jesus-choir-logo.gif"
          alt=""
          width={600}
          height={600}
          unoptimized
          className="absolute right-[9%] top-[28%] h-16 w-16 object-contain opacity-15 mix-blend-multiply sm:h-24 sm:w-24"
        />
        <Image
          src="/images/brand/grow-in-jesus-choir-logo.gif"
          alt=""
          width={600}
          height={600}
          unoptimized
          className="absolute bottom-[14%] left-[15%] h-20 w-20 object-contain opacity-15 mix-blend-multiply sm:h-28 sm:w-28"
        />
        <Image
          src="/images/brand/grow-in-jesus-choir-logo.gif"
          alt=""
          width={600}
          height={600}
          unoptimized
          className="absolute bottom-[10%] right-[12%] h-12 w-12 object-contain opacity-20 mix-blend-multiply sm:h-[4.5rem] sm:w-[4.5rem]"
        />
      </div>

      {/* Top Left Glowing Brand Emblem */}
      <div className="absolute top-5 left-5 sm:top-8 sm:left-8 z-20">
        <Link
          href="/"
          className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-tr from-[#00d2ff] via-[#3b82f6] to-[#7c3aed] p-[2.5px] shadow-lg shadow-indigo-500/25 hover:scale-105 active:scale-95 transition-all flex items-center justify-center group"
          title="Grow in Jesus Choir Home"
        >
          <div className="w-full h-full rounded-full bg-white overflow-hidden flex items-center justify-center shadow-inner">
            <Image
              src="/android-chrome-512x512.png"
              alt="Grow in Jesus Choir harp logo"
              width={512}
              height={512}
              className="w-full h-full object-cover"
              priority
            />
          </div>
        </Link>
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 w-full max-w-[440px] sm:max-w-[460px] mx-auto min-w-0">
        {/* Floating Brand Squircle & Titles */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-block group mb-3 sm:mb-4">
            <Image
              src="/images/brand/grow-in-jesus-choir-logo.gif"
              alt="Grow in Jesus Choir logo"
              width={475}
              height={475}
              className="w-24 h-24 sm:w-28 sm:h-28 object-contain mix-blend-multiply group-hover:scale-[1.02] transition-transform duration-300"
              priority
              unoptimized
            />
          </Link>
          <h1 className="text-2xl sm:text-[28px] font-bold text-slate-900 tracking-tight font-sans leading-tight">
            Grow in Jesus Choir
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-normal mt-1.5">
            Sign in to access your financial monitoring platform
          </p>
        </div>

        {/* Frosted glass card follows the shared geometric background. */}
        <div className="glass-panel rounded-[28px] sm:rounded-[34px] p-6 sm:p-9 transition-all">
          {loginState.error && (
            <div className="mb-5 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {loginState.error}
            </div>
          )}

          <form action={formAction} className="space-y-4">
            <input type="hidden" name="next" value={nextPath} />
            {/* EMAIL ADDRESS */}
            <div>
              <label htmlFor="login-email" className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                EMAIL ADDRESS
              </label>
              <div className="relative flex items-center rounded-2xl bg-[#EEF2FC] px-4 py-3.5 border-0 outline-none ring-0 transition-all">
                <Mail className="w-4 h-4 text-slate-400 mr-3 shrink-0" />
                <input
                  id="login-email"
                  type="email"
                  name="email"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-transparent text-xs sm:text-sm text-slate-800 placeholder-slate-400 border-0 outline-none focus:outline-none focus-visible:outline-none ring-0 focus:ring-0 focus-visible:ring-0 shadow-none font-medium"
                  style={{ outline: 'none', border: 'none', boxShadow: 'none' }}
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div className="mt-4">
              <label htmlFor="login-password" className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                PASSWORD
              </label>
              <div className="relative flex items-center rounded-2xl bg-[#EEF2FC] px-4 py-3.5 border-0 outline-none ring-0 transition-all">
                <Lock className="w-4 h-4 text-slate-400 mr-3 shrink-0" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••••"
                  className="w-full bg-transparent text-xs sm:text-sm text-slate-800 placeholder-slate-400 border-0 outline-none focus:outline-none focus-visible:outline-none ring-0 focus:ring-0 focus-visible:ring-0 shadow-none font-medium"
                  style={{ outline: 'none', border: 'none', boxShadow: 'none' }}
                />
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="ml-2 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/80 bg-white/70 text-slate-500 shadow-sm transition-colors hover:bg-white hover:text-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 disabled:cursor-wait disabled:opacity-50"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  aria-controls="login-password"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 stroke-[2.2]" />
                  ) : (
                    <Eye className="w-4 h-4 stroke-[2.2]" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              aria-busy={isLoading}
              className="brand-button mt-6 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl py-3.5 text-xs font-semibold tracking-wide text-white transition-all duration-200 disabled:cursor-wait disabled:opacity-70 sm:py-4 sm:text-sm"
            >
              {isLoading && <LoaderCircle className="h-4 w-4 animate-spin" />}
              {isLoading ? 'Signing in…' : 'Sign In to Workspace'}
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
