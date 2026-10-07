'use client'

import * as React from 'react'
import Link from 'next/link'
import { useActionState } from 'react'
import { Eye, EyeOff, LockKeyhole, ShieldCheck, UserRoundCheck, LoaderCircle } from 'lucide-react'
import { acceptMemberInvitationAction } from './actions'

export function InvitationAcceptForm({ token, invitation }: {
  token: string
  invitation: { email: string; fullName: string; voicePart: string; expiresAt: string; expiresAtLabel: string }
}) {
  const [state, formAction, busy] = useActionState(acceptMemberInvitationAction, { error: '' })
  const [visible, setVisible] = React.useState(false)
  const [confirmVisible, setConfirmVisible] = React.useState(false)
  return <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-xl items-center justify-center p-4 sm:p-8">
    <section className="glass-panel w-full rounded-[28px] border border-white/80 p-5 shadow-[0_22px_70px_rgba(42,47,96,0.16)] sm:p-8">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700"><UserRoundCheck className="h-6 w-6" /></div>
      <p className="text-center text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-600">Grow in Jesus Choir invitation</p>
      <h1 className="mt-2 text-center text-2xl font-bold text-slate-900">Welcome, {invitation.fullName}</h1>
      <p className="mt-2 text-center text-xs leading-relaxed text-slate-500">Set a password to activate your Member account. Your email and voice part are already attached to this invitation.</p>
      <div className="mt-5 rounded-2xl border border-indigo-100 bg-white/65 p-4 text-xs text-slate-600"><div className="font-semibold text-slate-800">{invitation.email}</div><div className="mt-1">{invitation.voicePart} · Expires {invitation.expiresAtLabel}</div></div>
      {state.error && <div role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{state.error}</div>}
      <form action={formAction} className="mt-5 space-y-4">
        <input type="hidden" name="token" value={token} />
        <div><label htmlFor="invite-password" className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-slate-500">Create password</label><div className="flex items-center rounded-xl border border-slate-200 bg-white px-3"><LockKeyhole className="h-4 w-4 shrink-0 text-slate-400" /><input id="invite-password" name="password" type={visible ? 'text' : 'password'} minLength={12} maxLength={1024} autoComplete="new-password" required className="min-w-0 flex-1 border-0 bg-transparent px-3 py-3 text-sm outline-none focus:ring-0" /><button type="button" disabled={busy} onClick={() => setVisible((value) => !value)} aria-label={visible ? 'Hide password' : 'Show password'} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50">{visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div><p className="mt-1 text-[10px] text-slate-400">Use at least 12 characters.</p></div>
        <div><label htmlFor="invite-confirm-password" className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-slate-500">Confirm password</label><div className="flex items-center rounded-xl border border-slate-200 bg-white px-3"><LockKeyhole className="h-4 w-4 shrink-0 text-slate-400" /><input id="invite-confirm-password" name="confirmPassword" type={confirmVisible ? 'text' : 'password'} minLength={12} maxLength={1024} autoComplete="new-password" required className="min-w-0 flex-1 border-0 bg-transparent px-3 py-3 text-sm outline-none focus:ring-0" /><button type="button" disabled={busy} onClick={() => setConfirmVisible((value) => !value)} aria-label={confirmVisible ? 'Hide password confirmation' : 'Show password confirmation'} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50">{confirmVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></div>
        <div className="flex gap-2 rounded-xl bg-emerald-50 p-3 text-[11px] leading-relaxed text-emerald-800"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" /><span>This secure invitation can only create a Member account and is invalid after it is accepted.</span></div>
        <button disabled={busy} aria-busy={busy} className="brand-button inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white disabled:cursor-wait disabled:opacity-60">{busy && <LoaderCircle className="h-4 w-4 animate-spin" />}{busy ? 'Creating account…' : 'Create my account'}</button>
      </form>
      <p className="mt-5 text-center text-[10px] text-slate-400">Already have an account? <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-800">Sign in</Link></p>
    </section>
  </main>
}
