import { redirect } from 'next/navigation'
import { ShieldCheck, UserCheck, Settings as SettingsIcon, Globe, Bell } from 'lucide-react'
import { getSessionUser } from '@/lib/auth/session'
import { Card } from '@/components/ui/Card'

export default async function SettingsPage() {
  const session = await getSessionUser()
  if (!session) {
    redirect('/login')
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-serif text-[#1e382d] tracking-tight">
          Workspace Settings
        </h1>
        <p className="text-xs text-[#71857a] mt-0.5">
          Choir organization profile, currency standards, and security controls.
        </p>
      </div>

      {/* Choir Profile */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-[#e4efe6] text-[#2c5b48] flex items-center justify-center font-bold">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-serif text-[#1e382d]">Choir Identity</h3>
            <p className="text-[11px] text-[#71857a]">Organization profile & ministry details</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-[#7d9086] block text-[11px]">Organization Name</span>
            <strong className="text-[#203a30] text-sm font-semibold">Grow in Jesus Choir</strong>
          </div>
          <div>
            <span className="text-[#7d9086] block text-[11px]">Base Currency</span>
            <strong className="text-[#203a30] text-sm font-semibold">Rwandan Franc (RWF)</strong>
          </div>
          <div>
            <span className="text-[#7d9086] block text-[11px]">Active Choir Members</span>
            <strong className="text-[#203a30] text-sm font-semibold">50 Members</strong>
          </div>
          <div>
            <span className="text-[#7d9086] block text-[11px]">Financial Year</span>
            <strong className="text-[#203a30] text-sm font-semibold">2026 / 2027</strong>
          </div>
        </div>
      </Card>

      {/* User Profile Info */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-[#f2f6f3] text-[#2c5b48] flex items-center justify-center font-bold">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-serif text-[#1e382d]">Your Account Profile</h3>
            <p className="text-[11px] text-[#71857a]">Current user permissions & session</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-[#7d9086] block text-[11px]">Full Name</span>
            <strong className="text-[#203a30] text-sm font-semibold">{session.fullName}</strong>
          </div>
          <div>
            <span className="text-[#7d9086] block text-[11px]">Email Address</span>
            <strong className="text-[#203a30] text-sm font-semibold">{session.email}</strong>
          </div>
          <div>
            <span className="text-[#7d9086] block text-[11px]">Assigned Role</span>
            <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-full bg-[#e3efe6] text-[#2c5b48] font-bold text-[11px]">
              {session.role}
            </span>
          </div>
          <div>
            <span className="text-[#7d9086] block text-[11px]">Session Expiration</span>
            <span className="text-[#607469] block mt-0.5">Active (7-day secure token)</span>
          </div>
        </div>
      </Card>
    </div>
  )
}

