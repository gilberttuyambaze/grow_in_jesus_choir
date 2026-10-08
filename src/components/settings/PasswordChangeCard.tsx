'use client'

import * as React from 'react'
import { KeyRound, LoaderCircle } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import { changePasswordAction } from '@/features/auth/actions'
import { getPasswordRequirements } from '@/lib/auth/password-rules'

export function PasswordChangeCard() {
  const { success, error } = useToast()
  const [isSaving, setIsSaving] = React.useState(false)
  const [newPassword, setNewPassword] = React.useState('')
  const saveLock = React.useRef(false)
  const passwordRequirements = getPasswordRequirements(newPassword)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saveLock.current) return
    saveLock.current = true
    setIsSaving(true)
    const form = event.currentTarget
    try {
      const result = await changePasswordAction(new FormData(form))
      if (result.success) {
        form.reset()
        setNewPassword('')
        success('Password updated', result.message)
      } else {
        error('Password not changed', result.error)
      }
    } catch {
      error('Password not changed', 'Please try again.')
    } finally {
      saveLock.current = false
      setIsSaving(false)
    }
  }

  return (
    <div className="card-surface p-4 sm:p-6 space-y-5 min-w-0">
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
            minLength={6}
            maxLength={128}
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            aria-describedby="new-password-requirements"
            className="mt-1.5 w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <span id="new-password-requirements" aria-live="polite" className="mt-1 block text-[10px] font-normal text-slate-500">
            {newPassword.length === 0
              ? 'Use at least 6 characters and at least 3 character types: lowercase, uppercase, number, or symbol.'
              : passwordRequirements.isValid
                ? 'Password is strong.'
                : !passwordRequirements.minLength
                  ? 'Use at least 6 characters.'
                  : 'Use at least 3 character types: lowercase, uppercase, number, or symbol.'}
          </span>
        </label>
        <button
          type="submit"
          disabled={isSaving}
          aria-busy={isSaving}
          className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 rounded-full bg-slate-900 text-white text-xs font-semibold disabled:cursor-wait disabled:opacity-50"
        >
          {isSaving && <LoaderCircle className="h-3.5 w-3.5 animate-spin" />}
          {isSaving ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </div>
  )
}
