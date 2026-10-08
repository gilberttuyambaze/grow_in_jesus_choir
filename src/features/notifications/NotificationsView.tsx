'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  Check,
  Search,
  ExternalLink,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  LoaderCircle
} from 'lucide-react'
import { NotificationItem, UserRole } from '@/types'
import { markNotificationReadAction } from '@/features/notifications/actions'
import { formatDateTime } from '@/lib/utils/date'
import { useToast } from '@/components/ui/Toast'
import { CrystalBadge } from '@/components/ui/CrystalBadge'

interface NotificationsViewProps {
  notifications: NotificationItem[]
  userRole: UserRole
}

export function NotificationsView({
  notifications: initialNotifications,
  userRole
}: NotificationsViewProps) {
  const router = useRouter()
  const { success: showToastSuccess, error: showToastError } = useToast()
  const [notifications, setNotifications] = React.useState(initialNotifications)
  const [filter, setFilter] = React.useState<'all' | 'unread' | 'warning' | 'success'>('all')
  const [search, setSearch] = React.useState('')
  const [isMarkingAll, setIsMarkingAll] = React.useState(false)
  const [pendingIds, setPendingIds] = React.useState<Set<string>>(() => new Set())
  const pendingIdsRef = React.useRef(new Set<string>())
  const markingAllRef = React.useRef(false)

  React.useEffect(() => {
    setNotifications(initialNotifications)
  }, [initialNotifications])

  const unreadCount = notifications.filter((n) => !n.isRead).length
  const warningCount = notifications.filter((n) => n.type === 'warning').length
  const successCount = notifications.filter((n) => n.type === 'success').length

  const filteredNotifications = React.useMemo(() => {
    return notifications.filter((item) => {
      if (filter === 'unread' && item.isRead) return false
      if (filter === 'warning' && item.type !== 'warning') return false
      if (filter === 'success' && item.type !== 'success') return false

      if (search.trim()) {
        const query = search.toLowerCase()
        const matchTitle = item.title.toLowerCase().includes(query)
        const matchMsg = item.message.toLowerCase().includes(query)
        if (!matchTitle && !matchMsg) return false
      }

      return true
    })
  }, [notifications, filter, search])

  const handleMarkAsRead = async (id: string): Promise<boolean> => {
    if (pendingIdsRef.current.has(id) || markingAllRef.current) return false
    const original = notifications.find((item) => item.id === id)
    if (!original || original.isRead) return true
    pendingIdsRef.current.add(id)
    setPendingIds(new Set(pendingIdsRef.current))
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
    try {
      const result = await markNotificationReadAction(id)
      if (!result.success) throw new Error(result.error || 'Could not mark this notification as read.')
      return true
    } catch (error) {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: false } : n)))
      showToastError('Could not update notification', error instanceof Error ? error.message : 'Please try again.')
      return false
    } finally {
      pendingIdsRef.current.delete(id)
      setPendingIds(new Set(pendingIdsRef.current))
    }
  }

  const handleMarkAllAsRead = async () => {
    if (markingAllRef.current || pendingIdsRef.current.size > 0) return
    markingAllRef.current = true
    setIsMarkingAll(true)
    const unread = notifications.filter((item) => !item.isRead)
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    try {
      const results = await Promise.all(unread.map((item) => markNotificationReadAction(item.id)))
      const failedIds = unread.filter((_, index) => !results[index].success).map((item) => item.id)
      if (failedIds.length) {
        setNotifications((prev) => prev.map((n) => failedIds.includes(n.id) ? { ...n, isRead: false } : n))
        showToastError('Some notifications were not updated', 'Please try again for the remaining unread items.')
      } else {
        showToastSuccess('All Caught Up', 'All notifications marked as read.')
      }
    } catch {
      setNotifications((prev) => prev.map((n) => unread.some((item) => item.id === n.id) ? { ...n, isRead: false } : n))
      showToastError('Could not update notifications', 'Please try again.')
    } finally {
      markingAllRef.current = false
      setIsMarkingAll(false)
    }
  }

  const handleNavigate = async (item: NotificationItem) => {
    if (!item.isRead) {
      const marked = await handleMarkAsRead(item.id)
      if (!marked) return
    }
    if (item.link) {
      router.push(item.link)
    } else if (
      item.title.toLowerCase().includes('record') ||
      item.message.toLowerCase().includes('contribution')
    ) {
      router.push('/finances')
    }
  }

  const indicators = [
    {
      id: 'all' as const,
      alt: `All (${notifications.length})`,
      count: notifications.length,
      Icon: Bell,
      color: 'text-purple-600',
      activeStyle: 'bg-purple-100 text-purple-700 ring-2 ring-purple-500/80',
      badgeBg: 'bg-purple-600',
    },
    {
      id: 'unread' as const,
      alt: `Unread (${unreadCount})`,
      count: unreadCount,
      Icon: Clock,
      color: 'text-indigo-600',
      activeStyle: 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-500/80',
      badgeBg: 'bg-indigo-600',
    },
    {
      id: 'warning' as const,
      alt: `Actionable (${warningCount})`,
      count: warningCount,
      Icon: AlertTriangle,
      color: 'text-amber-600',
      activeStyle: 'bg-amber-100 text-amber-700 ring-2 ring-amber-500/80',
      badgeBg: 'bg-amber-500',
    },
    {
      id: 'success' as const,
      alt: `Milestones (${successCount})`,
      count: successCount,
      Icon: CheckCircle2,
      color: 'text-emerald-600',
      activeStyle: 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-500/80',
      badgeBg: 'bg-emerald-600',
    },
  ]

  return (
    <div className="space-y-6 max-w-4xl min-w-0">
      {/* Top Banner matching Reference Mood */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-sans">
            Notifications & Alerts
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time financial activity updates, member contribution milestones, and review requests.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            disabled={isMarkingAll || pendingIds.size > 0}
            aria-busy={isMarkingAll || pendingIds.size > 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white hover:bg-slate-50 border border-slate-200/90 text-xs font-semibold text-slate-700 shadow-xs transition-all shrink-0 active:scale-[0.99] disabled:cursor-wait disabled:opacity-60"
          >
            {isMarkingAll || pendingIds.size > 0 ? <LoaderCircle className="w-4 h-4 animate-spin text-indigo-600" /> : <Check className="w-4 h-4 text-emerald-600 stroke-[2.5]" />}
            <span>{isMarkingAll ? 'Marking as read…' : pendingIds.size > 0 ? 'Updating…' : 'Mark all as read'}</span>
          </button>
        )}
      </div>

      {/* Space-Optimized Pure Icon Indicators Dock (No pop-up card, micro-alt message, pure icons at best size, futuristic seamless design) */}
      <div className="flex items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 p-1.5 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-xs">
          {indicators.map((item) => {
            const isActive = filter === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                title={item.alt}
                aria-label={item.alt}
                className={`relative group w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer ${
                  isActive
                    ? `${item.activeStyle} shadow-xs scale-105`
                    : 'bg-slate-50/80 hover:bg-slate-100/90 text-slate-500 hover:text-slate-800 border border-slate-200/50 hover:scale-105'
                }`}
              >
                {/* Meaningful Icon at Best Size */}
                <item.Icon className={`w-5 h-5 sm:w-5.5 sm:h-5.5 stroke-[2.2] ${item.color}`} />

                {/* Number Indicator Badge */}
                <span
                  className={`absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-white shadow-xs ${item.badgeBg} text-white`}
                >
                  {item.count}
                </span>

                {/* Minimal Micro Alt Tooltip (Smallest possible size, never blocks content) */}
                <span className="pointer-events-none absolute -bottom-6 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-slate-900/90 text-white text-[10px] font-semibold whitespace-nowrap shadow-xs opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-20">
                  {item.alt}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Notifications List Card */}
      <div className="card-surface p-4 sm:p-5 bg-white space-y-4 min-w-0">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-700">
              {filter === 'all'
                ? 'All Notifications'
                : filter === 'unread'
                ? 'Unread Notifications'
                : filter === 'warning'
                ? 'Actionable Reviews'
                : 'Milestones'}
            </span>
            <span className="glowing-count-pill px-3 py-1 text-xs">
              {filteredNotifications.length} {filteredNotifications.length === 1 ? 'container' : 'containers'}
            </span>
            {filter !== 'all' && (
              <button
                type="button"
                onClick={() => setFilter('all')}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold ml-1 cursor-pointer"
              >
                Clear filter
              </button>
            )}
          </div>

          {/* Frosted Glass Search Box matching reference media_1791454046098_7779ab90.png */}
          <div className="frosted-search-pill relative w-full sm:w-64 px-3.5 py-1.5 flex items-center">
            <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none border-0 ring-0 shadow-none"
            />
          </div>
        </div>

        {/* Notifications List */}
        {filteredNotifications.length === 0 ? (
          <div className="py-12 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 shadow-xs">
              <CheckCircle2 className="w-6 h-6 stroke-[2.2]" />
            </div>
            <p className="text-sm font-semibold text-slate-800">You are all caught up!</p>
            <span className="text-xs text-slate-400 mt-0.5">
              No notifications matching your selected criteria.
            </span>
          </div>
        ) : (
          <div className="space-y-3.5 pt-1">
            {filteredNotifications.map((item) => {
              const isPending = pendingIds.has(item.id) || isMarkingAll
              const isWarning = item.type === 'warning'
              const isSuccess = item.type === 'success'
              const isAlert = item.type === 'alert'

              return (
                <div
                  key={item.id}
                  className={`p-4 sm:p-5 rounded-[22px] sm:rounded-[26px] bg-white/85 backdrop-blur-xl border border-white/95 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.03),0_12px_32px_-4px_rgba(15,23,42,0.06),0_0_0_1px_rgba(255,255,255,0.9)_inset] hover:shadow-[0_8px_28px_-2px_rgba(15,23,42,0.06),0_20px_44px_-4px_rgba(15,23,42,0.08),0_0_0_1px_rgba(255,255,255,1)_inset] transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group ${
                    !item.isRead ? 'ring-1 ring-indigo-200/50 bg-gradient-to-r from-white/95 via-indigo-50/15 to-white/90' : ''
                  }`}
                >
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    {/* 3D Crystal Gem Emblem matching media_1791454046098_7779ab90.png and media_1791454111794_e621fd98.png */}
                    <CrystalBadge
                      type={isWarning ? 'warning' : isSuccess ? 'success' : isAlert ? 'alert' : 'info'}
                      size="md"
                      className="shrink-0 mt-0.5"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <h4 className="font-bold text-sm sm:text-base text-slate-900 tracking-tight">
                          {item.title}
                        </h4>
                        {!item.isRead && (
                          <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold">
                            New
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        {item.message}
                      </p>
                      <span className="text-[11px] text-slate-400 block mt-1.5 font-medium">
                        {formatDateTime(item.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
                    {!item.isRead && (
                      <button
                        onClick={() => void handleMarkAsRead(item.id)}
                        disabled={isPending}
                        aria-busy={isPending}
                        className="p-2.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100/80 transition-colors disabled:cursor-wait disabled:opacity-50"
                        title="Mark as read"
                      >
                        {isPending ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 stroke-[2.2]" />}
                      </button>
                    )}

                    {/* Liquid Silver Action Button matching reference */}
                    <button
                      onClick={() => void handleNavigate(item)}
                      disabled={isPending}
                      aria-busy={isPending}
                      className="liquid-silver-button px-5 py-2.5 text-xs sm:text-sm font-semibold tracking-tight shadow-md flex items-center gap-1.5 active:scale-[0.98] transition-all group-hover:shadow-lg shrink-0 cursor-pointer"
                    >
                      <span>{isPending ? 'Opening…' : item.type === 'warning' ? 'Review Record' : 'View Record'}</span>
                      {isPending ? (
                        <LoaderCircle className="w-3.5 h-3.5 animate-spin text-slate-700" />
                      ) : (
                        <ArrowRight className="w-3.5 h-3.5 stroke-[2.2] text-slate-700 transition-transform group-hover:translate-x-0.5" />
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
