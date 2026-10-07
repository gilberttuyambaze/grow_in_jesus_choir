'use client'

import * as React from 'react'
import { KeyRound } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import { changePasswordAction } from '@/features/auth/actions'

export function PasswordChangeCard() {
  const { success, error } = useToast()
  const [isSaving, setIsSaving] = React.useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)
    const form = event.currentTarget
    try {
      const result = await changePasswordAction(new FormData(form))
      if (result.success) {
        form.reset()
        success('Password updated', result.message)
      } else {
        error('Password not changed', result.error)
      }
    } catch {
      error('Password not changed', 'Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="card-surface p-4 sm:p-6 bg-white space-y-5 min-w-0">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
          <KeyRound className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900">Password & Sessions</h3>
          <p className="text-[11px] text-slate-400">Change your password and close other signed-in sessions.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block text-xs font-semibold text-slate-700">
          Current password
          <input
            type="password"
            name="currentPassword"
            required
            autoComplete="current-password"
            className="mt-1.5 w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </label>
        <label className="block text-xs font-semibold text-slate-700">
          New password
          <input
            type="password"
            name="newPassword"
            required
            minLength={12}
            maxLength={128}
            autoComplete="new-password"
            className="mt-1.5 w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <span className="mt-1 block text-[10px] font-normal text-slate-400">Use at least 12 characters.</span>
        </label>
        <button
          type="submit"
          disabled={isSaving}
          className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-slate-900 text-white text-xs font-semibold disabled:opacity-50"
        >
          {isSaving ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </div>
  )
}
