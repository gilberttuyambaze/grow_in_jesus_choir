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
  ArrowRight,
  LogOut,
  ChevronDown,
  UserCheck,
  ShieldCheck,
  FolderLock,
  X
} from 'lucide-react'
import { UserRole } from '@/types'
import { switchRoleAction, logoutAction } from '@/features/auth/actions'
import { ChoirLogo } from '@/components/brand/ChoirLogo'

interface SidebarProps {
  userRole: UserRole
  userName: string
  userInitials: string
  pendingCount?: number
  onClose?: () => void
  onNavigate?: () => void
}

export function Sidebar({
  userRole,
  userName,
  userInitials,
  pendingCount = 0,
  onClose,
  onNavigate
}: SidebarProps) {
  const pathname = usePathname()

  const handleLinkClick = () => {
    if (onNavigate) onNavigate()
    if (onClose) onClose()
  }

  const navItems = React.useMemo(() => {
    if (userRole === 'MEMBER') {
      return [
        { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { label: 'My Contributions', href: '/finances', icon: WalletCards },
        { label: 'Documents', href: '/documents', icon: FileText },
        { label: 'Settings', href: '/settings', icon: Settings }
      ]
    }
    return [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Financial Records', href: '/finances', icon: WalletCards, count: pendingCount > 0 ? pendingCount : undefined },
      { label: 'Choir Members', href: '/members', icon: Users },
      { label: 'Reports & Analytics', href: '/reports', icon: BarChart3 },
      { label: 'Documents', href: '/documents', icon: FileText },
      { label: 'Audit Logs', href: '/activity', icon: ShieldCheck },
      { label: 'Settings', href: '/settings', icon: Settings }
    ]
  }, [userRole, pendingCount])

  return (
    <aside className="w-64 max-w-[85vw] shrink-0 bg-white/95 md:bg-white/80 backdrop-blur-md border-r border-slate-200/80 flex flex-col justify-between p-5 min-h-0 h-full select-none overflow-y-auto">
      <div>
        {/* Brand Header matching Reference */}
        <div className="flex items-center justify-between px-2 py-2 mb-6">
          <div className="flex items-center gap-3">
            <ChoirLogo className="w-9 h-9 rounded-xl object-contain shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-tight text-slate-900 leading-none truncate">
                  GROW IN JESUS
                </span>
                <span className="text-[9px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 shrink-0">
                  CHOIR
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5 truncate">Financial Workspace</p>
            </div>
          </div>

          {/* Close button for mobile drawer */}
          {onClose && (
            <button
              onClick={onClose}
              className="md:hidden p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation List matching Reference */}
        <nav className="space-y-1">
          {navItems.map(({ label, href, icon: Icon, count }) => {
            const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))

            return (
              <Link
                key={href}
                href={href}
                onClick={handleLinkClick}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-medium transition-all ${
                  isActive
                    ? 'active-nav-pill'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-indigo-600' : 'text-slate-500'
                    }`}
                  />
                  <span className="truncate">{label}</span>
                </div>

                {count && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold shrink-0">
                    {count}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Bottom Cards: Copilot and Profile */}
      <div className="pt-6 space-y-4">
        {/* Financial Copilot Card matching Reference */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-50/90 via-purple-50/50 to-blue-50/40 border border-indigo-100/80 shadow-xs">
          <ChoirLogo className="w-7 h-7 rounded-lg object-contain mb-2.5" />
          <h4 className="text-xs font-bold text-slate-900 mb-1">Financial Copilot</h4>
          <p className="text-[10px] text-slate-500 leading-relaxed mb-3">
            Ask, analyze and monitor choir finances with your intelligent Copilot.
          </p>
          <Link
            href="/reports"
            onClick={handleLinkClick}
            className="w-full py-2 px-3 rounded-xl bg-white hover:bg-indigo-50 border border-indigo-200/70 text-indigo-700 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs"
          >
            <span>Open Copilot</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* User Card matching Reference */}
        <div className="p-2 rounded-2xl bg-slate-50/80 border border-slate-200/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
              {userInitials}
            </div>
            <div className="truncate min-w-0">
              <span className="font-semibold text-xs text-slate-900 block truncate leading-tight">
                {userName}
              </span>
              <span className="text-[10px] text-slate-500 capitalize block truncate">
                {userRole.toLowerCase()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => {
                switchRoleAction(userRole === 'LEADER' ? 'MEMBER' : 'LEADER')
                handleLinkClick()
              }}
              title="Toggle role demo"
              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-white transition-colors"
            >
              <UserCheck className="w-4 h-4" />
            </button>
            <button
              onClick={() => logoutAction()}
              title="Sign out"
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-white transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}
