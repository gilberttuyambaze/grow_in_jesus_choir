'use client'

import * as React from 'react'
import Link from 'next/link'
import { ArrowUpRight, ShieldCheck, UserCheck, Lock, Mail } from 'lucide-react'
import { loginAction, switchRoleAction } from '@/features/auth/actions'

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
    <div className="min-h-screen bg-[#f7f9f7] flex flex-col justify-center items-center p-4 sm:p-8">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#2e5748] to-[#1c3a30] text-white flex items-center justify-center font-bold text-xl shadow-md">
              G
            </div>
          </Link>
          <h1 className="text-2xl font-serif text-[#1e382d] font-normal tracking-tight">
            Grow in Jesus Choir
          </h1>
          <p className="text-xs text-[#71857a] mt-1">
            Sign in to access your financial workspace
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-white rounded-3xl border border-[#dce6df] p-7 sm:p-8 shadow-[0_8px_30px_rgba(46,87,72,0.06)]">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#52665c] uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#8a9b91] absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  name="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@growinjesus.rw"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#dbe4dd] bg-[#fafcfa] text-xs text-[#203a30] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3b6654] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#52665c] uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#8a9b91] absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  name="password"
                  defaultValue="••••••••"
                  placeholder="Password"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#dbe4dd] bg-[#fafcfa] text-xs text-[#203a30] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3b6654] transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-[#2e5748] hover:bg-[#224438] text-white text-xs font-semibold shadow-md shadow-[#2e5748]/20 transition-all disabled:opacity-50 mt-2"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Quick 1-Click Demo Profiles Section */}
          <div className="mt-8 pt-6 border-t border-[#edf2ee]">
            <p className="text-[11px] font-semibold text-[#7d9086] uppercase tracking-wider mb-3 text-center">
              Quick 1-Click Demo Access
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => switchRoleAction('LEADER')}
                className="p-3 rounded-2xl border border-[#cfe0d5] bg-[#f2f8f4] hover:bg-[#e4efe8] text-left transition-all"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#275241] mb-0.5">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Sarah (Leader)</span>
                </div>
                <span className="text-[10px] text-[#6b7f74] block">
                  Full financials & approvals
                </span>
              </button>

              <button
                type="button"
                onClick={() => switchRoleAction('MEMBER')}
                className="p-3 rounded-2xl border border-[#dce6df] bg-[#fafcfa] hover:bg-[#f3f6f4] text-left transition-all"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#355446] mb-0.5">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>John (Member)</span>
                </div>
                <span className="text-[10px] text-[#71857a] block">
                  Personal contributions
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Back Link */}
        <p className="text-center mt-6 text-xs text-[#71857a]">
          <Link href="/" className="hover:text-[#213b30] underline font-medium">
            ← Return to main page
          </Link>
        </p>
      </div>
    </div>
  )
}

