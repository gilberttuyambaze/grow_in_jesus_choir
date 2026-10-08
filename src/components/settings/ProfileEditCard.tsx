'use client'

import * as React from 'react'
import { UserCheck, Phone, User, Check, LoaderCircle, CalendarDays, ShieldCheck } from 'lucide-react'
import { updateMemberProfileAction } from '@/features/members/actions'
import { useToast } from '@/components/ui/Toast'
import { useRouter } from 'next/navigation'

interface ProfileEditCardProps {
  initialFullName: string
  initialPhone?: string | null
  email: string
  role: string
  voicePart?: string
  memberStatus?: string
  joinedDate?: string
}

export function ProfileEditCard({
  initialFullName,
  initialPhone,
  email,
  role,
  voicePart,
  memberStatus,
  joinedDate
}: ProfileEditCardProps) {
  const router = useRouter()
  const { success: showToastSuccess, error: showToastError } = useToast()
  const [fullName, setFullName] = React.useState(initialFullName)
  const [phone, setPhone] = React.useState(initialPhone || '')
  const [isSaving, setIsSaving] = React.useState(false)
  const saveLock = React.useRef(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (saveLock.current) return
    saveLock.current = true
    setIsSaving(true)

    const formData = new FormData()
    formData.append('fullName', fullName)
    formData.append('phone', phone)

    try {
      const res = await updateMemberProfileAction(formData)
      if (res.success) {
        showToastSuccess('Profile Saved', 'Your member details have been updated.')
        router.refresh()
      } else {
        showToastError('Update Failed', res.error)
      }
    } catch {
      showToastError('Update Failed', 'Please try again.')
    } finally {
      saveLock.current = false
      setIsSaving(false)
    }
  }

  return (
    <div className="card-surface p-4 sm:p-6 space-y-5 min-w-0">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold shadow-xs shrink-0">
          <UserCheck className="w-5 h-5 stroke-[2.5]" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            Your Profile
          </h3>
          <p className="text-[11px] text-slate-400">
            Update your name and phone number. Email, role, and voice part are managed separately.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4 pt-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Full Name *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/60 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Phone Number (SMS Reminders)
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={phone}
                placeholder="+250 788 000 000"
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/60 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs border-t border-slate-100">
          <div>
            <span className="text-slate-400 block text-[11px] font-medium">Email Address</span>
            <span className="text-slate-900 text-xs font-semibold block mt-0.5 truncate">
              {email}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px] font-medium">Choir Voice Part</span>
            <span className="text-indigo-700 font-bold block mt-0.5">
              {voicePart || 'General Choir'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px] font-medium">Assigned Role</span>
            <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold text-[11px]">
              {role}
            </span>
          </div>
        </div>

        {(memberStatus || joinedDate) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 text-xs border-t border-slate-100">
            {memberStatus && (
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <span className="text-slate-400 block text-[11px] font-medium">Member Status</span>
                  <span className="text-slate-900 font-semibold capitalize block mt-0.5">{memberStatus}</span>
                </div>
              </div>
            )}
            {joinedDate && (
              <div className="flex items-start gap-2">
                <CalendarDays className="w-4 h-4 text-slate-400 mt-0.5" />
                <div>
                  <span className="text-slate-400 block text-[11px] font-medium">Joined Choir</span>
                  <span className="text-slate-900 font-semibold block mt-0.5">{joinedDate}</span>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            aria-busy={isSaving}
            className="brand-button w-full sm:w-auto px-6 py-2.5 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            {isSaving && <LoaderCircle className="h-3.5 w-3.5 animate-spin" />}
            <span>{isSaving ? 'Saving…' : 'Save Profile Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  )
}
