'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  WalletCards,
  Users,
  BarChart3,
  FileText,
  Settings,
  CircleHelp,
  ArrowUpRight,
  LogOut,
  UserCheck,
  ChevronDown
} from 'lucide-react'
import { UserRole } from '@/types'
import { switchRoleAction, logoutAction } from '@/features/auth/actions'

interface SidebarProps {
  userRole: UserRole
  userName: string
  userInitials: string
  pendingCount?: number
}

export function Sidebar({
  userRole,
  userName,
  userInitials,
  pendingCount = 0
}: SidebarProps) {
  const pathname = usePathname()

  const mainNav = React.useMemo(() => {
    if (userRole === 'MEMBER') {
      return [
        { label: 'My Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { label: 'My Contributions', href: '/finances', icon: WalletCards },
        { label: 'Choir Activity', href: '/activity', icon: BarChart3 }
      ]
    }
    return [
      { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Financial Records', href: '/finances', icon: WalletCards, badge: pendingCount > 0 ? pendingCount : undefined },
      { label: 'Choir Members', href: '/members', icon: Users },
      { label: 'Financial Reports', href: '/reports', icon: BarChart3 },
      { label: 'Activity & Audit', href: '/activity', icon: FileText }
    ]
  }, [userRole, pendingCount])

  return (
    <aside className="w-64 shrink-0 bg-[#f0f4f0] border-r border-[#e3e9e4] flex flex-col justify-between p-5 min-h-screen select-none">
      <div>
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#386b59] to-[#204035] text-white flex items-center justify-center font-bold text-base shadow-sm">
            G
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-[#1c332b] leading-tight">
              Grow in Jesus
            </h1>
            <p className="text-[11px] text-[#718279]">Choir Finance</p>
          </div>
        </div>

        {/* Workspace Card with Demo Role Switcher */}
        <div className="mt-5 mb-6 p-2.5 rounded-xl border border-[#dbe5dd] bg-[#fafcfa] flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-7 h-7 rounded-lg bg-[#d5e7db] text-[#2c5344] font-bold text-[11px] flex items-center justify-center shrink-0">
              {userRole === 'LEADER' ? 'LD' : 'MB'}
            </span>
            <div className="truncate">
              <span className="font-semibold text-[#203a30] block truncate">
                {userRole === 'LEADER' ? 'Leader Command' : 'Member Portal'}
              </span>
              <span className="text-[10px] text-[#72837a] capitalize block">
                {userRole.toLowerCase()} Mode
              </span>
            </div>
          </div>

          {/* Quick Demo Switcher Button */}
          <button
            onClick={() => switchRoleAction(userRole === 'LEADER' ? 'MEMBER' : 'LEADER')}
            title="Switch demo role between Leader and Member"
            className="px-2 py-1 rounded-md bg-[#e3efe6] hover:bg-[#d4e6d9] text-[#2d5948] text-[10px] font-semibold transition-colors shrink-0 flex items-center gap-1"
          >
            <UserCheck className="w-3 h-3" />
            Switch
          </button>
        </div>

        {/* Main Nav */}
        <nav className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#93a299] px-2.5 mb-2">
            Navigation
          </p>
          {mainNav.map(({ label, href, icon: Icon, badge }) => {
            const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#dceade] text-[#204738] font-semibold shadow-xs'
                    : 'text-[#63756c] hover:bg-[#e4eee6] hover:text-[#254639]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{label}</span>
                </div>
                {badge !== undefined && (
                  <span className="px-1.5 py-0.2 rounded-full bg-[#fce8d5] text-[#935b24] text-[10px] font-bold">
                    {badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Footer Info & User Profile */}
      <div className="pt-4 border-t border-[#dbe4dd] space-y-3">
        <div className="p-3 rounded-xl border border-[#dbe4dd] bg-[#fafcfa] text-[11px] text-[#697970] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CircleHelp className="w-4 h-4 text-[#446d5c]" />
            <span>Financial Guide</span>
          </div>
          <ArrowUpRight className="w-3.5 h-3.5 text-[#8fa096]" />
        </div>

        {/* Profile with Logout */}
        <div className="flex items-center justify-between p-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#2e5748] text-white flex items-center justify-center text-xs font-bold shadow-xs">
              {userInitials}
            </div>
            <div>
              <p className="text-xs font-semibold text-[#1e382e] leading-tight">
                {userName}
              </p>
              <p className="text-[10px] text-[#718279] capitalize">
                {userRole.toLowerCase()}
              </p>
            </div>
          </div>

          <button
            onClick={() => logoutAction()}
            title="Sign out"
            className="p-1.5 rounded-lg text-[#7c8d84] hover:text-rose-700 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}

