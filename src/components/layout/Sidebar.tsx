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
  Bell,
  LogOut,
  ChevronDown,
  ShieldCheck,
  FolderLock,
  CalendarDays,
  Mail,
  UserRound,
  X,
  LoaderCircle
} from 'lucide-react'
import { UserRole } from '@/types'
import { logoutAction } from '@/features/auth/actions'
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
  const [isLoggingOut, setIsLoggingOut] = React.useState(false)
  const logoutLock = React.useRef(false)

  const handleLogout = async () => {
    if (logoutLock.current) return
    logoutLock.current = true
    setIsLoggingOut(true)
    try {
      await logoutAction()
    } catch {
      logoutLock.current = false
      setIsLoggingOut(false)
    }
  }

  const handleLinkClick = () => {
    if (onNavigate) onNavigate()
    if (onClose) onClose()
  }

  const navItems = React.useMemo(() => {
    if (userRole === 'MEMBER') {
      return [
        { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { label: 'My Contributions', href: '/finances', icon: WalletCards },
        { label: 'Sessions', href: '/sessions', icon: CalendarDays },
        { label: 'Notifications', href: '/notifications', icon: Bell },
        { label: 'Documents', href: '/documents', icon: FileText },
        { label: 'Settings', href: '/settings', icon: Settings }
      ]
    }
    return [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Financial Records', href: '/finances', icon: WalletCards, count: pendingCount > 0 ? pendingCount : undefined },
      { label: 'Sessions', href: '/sessions', icon: CalendarDays },
      { label: 'Choir Members', href: '/members', icon: Users },
      ...(userRole === 'LEADER' || userRole === 'ADMIN'
        ? [{ label: 'Communications', href: '/communications', icon: Mail }]
        : []),
      { label: 'Reports & Analytics', href: '/reports', icon: BarChart3 },
      { label: 'Documents', href: '/documents', icon: FileText },
      { label: 'Audit Logs', href: '/activity', icon: ShieldCheck },
      { label: 'Notifications', href: '/notifications', icon: Bell },
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

      {/* User Card */}
      <div className="pt-6">
        {/* User Card matching Reference */}
        <div className="p-2 rounded-2xl bg-slate-50/80 border border-slate-200/70 space-y-2">
          <div className="flex items-center justify-between gap-2">
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

            <button
              onClick={() => void handleLogout()}
              disabled={isLoggingOut}
              aria-busy={isLoggingOut}
              title={isLoggingOut ? 'Signing out…' : 'Sign out'}
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-white transition-colors disabled:cursor-wait disabled:opacity-50"
            >
              {isLoggingOut ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
              <span className="sr-only">{isLoggingOut ? 'Signing out' : 'Sign out'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1 border-t border-slate-200/70 pt-2">
            <Link
              href="/profile"
              onClick={handleLinkClick}
              aria-current={pathname === '/profile' ? 'page' : undefined}
              className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[10px] font-semibold transition-colors ${pathname === '/profile' ? 'text-indigo-700 bg-indigo-50' : 'text-slate-500 hover:text-indigo-700 hover:bg-white'}`}
            >
              <UserRound className="w-3.5 h-3.5" />
              Profile
            </Link>
            <Link
              href="/settings"
              onClick={handleLinkClick}
              aria-current={pathname.startsWith('/settings') ? 'page' : undefined}
              className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[10px] font-semibold transition-colors ${pathname.startsWith('/settings') ? 'text-indigo-700 bg-indigo-50' : 'text-slate-500 hover:text-indigo-700 hover:bg-white'}`}
            >
              <Settings className="w-3.5 h-3.5" />
              Settings
            </Link>
          </div>
        </div>
      </div>
    </aside>
  )
}
