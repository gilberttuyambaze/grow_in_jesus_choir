'use client'

import * as React from 'react'
import Link from 'next/link'
import { UserCheck, Lock, Mail } from 'lucide-react'
import { loginAction, switchRoleAction } from '@/features/auth/actions'
import { ChoirLogo } from '@/components/brand/ChoirLogo'

export default function LoginPage() {
  const [email, setEmail] = React.useState('sarah@growinjesus.rw')
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
    <div className="min-h-screen bg-[#f4f6fc] flex flex-col justify-center items-center p-3.5 sm:p-8 selection:bg-indigo-600 selection:text-white">
      <div className="w-full max-w-md min-w-0">
        {/* Brand Header matching Reference */}
        <div className="text-center mb-6 sm:mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-3">
            <ChoirLogo className="w-12 h-12 rounded-2xl object-contain" />
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-sans">
            Grow in Jesus Choir
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Sign in to access your financial monitoring platform
          </p>
        </div>

        {/* Card Container */}
        <div className="card-surface p-6 sm:p-8 bg-white shadow-xl shadow-slate-900/5 min-w-0">
          {error && (
            <div className="mb-5 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  name="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@growinjesus.rw"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/60 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  name="password"
                  defaultValue="••••••••"
                  placeholder="Password"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/60 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-xs font-semibold shadow-md shadow-indigo-500/25 transition-all disabled:opacity-50 mt-2"
            >
              {isLoading ? 'Signing in...' : 'Sign In to Workspace'}
            </button>
          </form>

          {/* Quick 1-Click Demo Profiles Section */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3 text-center">
              Quick 1-Click Demo Access
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => switchRoleAction('LEADER')}
                className="p-3.5 rounded-2xl border border-indigo-150 bg-indigo-50/40 hover:bg-indigo-50/80 text-left transition-all active:scale-[0.99]"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 mb-0.5">
                  <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Sarah (Leader)</span>
                </div>
                <span className="text-[10px] text-indigo-700/70 block">
                  Full financials & approvals
                </span>
              </button>

              <button
                type="button"
                onClick={() => switchRoleAction('MEMBER')}
                className="p-3.5 rounded-2xl border border-purple-150 bg-purple-50/40 hover:bg-purple-50/80 text-left transition-all active:scale-[0.99]"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900 mb-0.5">
                  <UserCheck className="w-3.5 h-3.5 text-purple-600" />
                  <span>John (Member)</span>
                </div>
                <span className="text-[10px] text-purple-700/70 block">
                  Personal contributions
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Back to home link */}
        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-xs text-slate-500 hover:text-slate-900 transition-colors inline-flex items-center gap-1"
          >
            <span>← Back to public homepage</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
