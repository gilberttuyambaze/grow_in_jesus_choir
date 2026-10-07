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

      {/* Futuristic Metric Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
        <div className="card-surface p-4 sm:p-5 bg-white flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Total Notifications
            </span>
            <span className="text-2xl font-bold text-slate-900 font-sans tracking-tight">
              {notifications.length}
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shadow-xs">
            <Bell className="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>

        <div className="card-surface p-4 sm:p-5 bg-white flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Unread Updates
            </span>
            <span className="text-2xl font-bold text-indigo-600 font-sans tracking-tight">
              {unreadCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shadow-xs">
            <Clock className="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>

        <div className="card-surface p-4 sm:p-5 bg-white flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Actionable Reviews
            </span>
            <span className="text-2xl font-bold text-amber-600 font-sans tracking-tight">
              {warningCount}
            </span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shadow-xs">
            <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card-surface p-4 sm:p-5 bg-white space-y-4 min-w-0">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5 pb-4 border-b border-slate-100">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100/80 text-xs font-medium overflow-x-auto max-w-full">
            <button
              onClick={() => setFilter('all')}
              className={`px-3.5 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                filter === 'all'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3.5 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                filter === 'unread'
                  ? 'bg-white text-indigo-700 font-bold shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Unread ({unreadCount})
            </button>
            <button
              onClick={() => setFilter('warning')}
              className={`px-3.5 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                filter === 'warning'
                  ? 'bg-white text-amber-700 font-bold shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Reviews ({warningCount})
            </button>
            <button
              onClick={() => setFilter('success')}
              className={`px-3.5 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                filter === 'success'
                  ? 'bg-white text-emerald-700 font-bold shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Milestones ({successCount})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-full border border-slate-200 bg-slate-50/60 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
          <div className="space-y-3 pt-1">
            {filteredNotifications.map((item) => {
              const isPending = pendingIds.has(item.id) || isMarkingAll
              const isWarning = item.type === 'warning'
              const isSuccess = item.type === 'success'
              const isAlert = item.type === 'alert'

              return (
                <div
                  key={item.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    item.isRead
                      ? 'border-slate-100 bg-white hover:border-slate-200'
                      : 'border-indigo-150 bg-indigo-50/30 hover:bg-indigo-50/50'
                  }`}
                >
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    {/* Reference Circle Icon matching media_1791402053359_0b6949c6.png */}
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5 shadow-xs ${
                        isWarning
                          ? 'bg-amber-100/80 text-amber-800'
                          : isSuccess
                          ? 'bg-emerald-100/80 text-emerald-800'
                          : isAlert
                          ? 'bg-rose-100/80 text-rose-800'
                          : 'bg-indigo-100/80 text-indigo-800'
                      }`}
                    >
                      {isWarning && <AlertTriangle className="w-5 h-5 stroke-[2.2]" />}
                      {isSuccess && <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />}
                      {isAlert && <AlertCircle className="w-5 h-5 stroke-[2.2]" />}
                      {!isWarning && !isSuccess && !isAlert && <Info className="w-5 h-5 stroke-[2.2]" />}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <h4 className="font-bold text-sm text-slate-900 tracking-tight">
                          {item.title}
                        </h4>
                        {!item.isRead && (
                          <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold">
                            New
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {item.message}
                      </p>
                      <span className="text-[11px] text-slate-400 block mt-1.5 font-medium">
                        {formatDateTime(item.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {!item.isRead && (
                      <button
                        onClick={() => void handleMarkAsRead(item.id)}
                        disabled={isPending}
                        aria-busy={isPending}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:cursor-wait disabled:opacity-50"
                        title="Mark as read"
                      >
                        {isPending ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 stroke-[2.2]" />}
                      </button>
                    )}

                    <button
                      onClick={() => void handleNavigate(item)}
                      disabled={isPending}
                      aria-busy={isPending}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-all active:scale-[0.99] disabled:cursor-wait disabled:opacity-60"
                    >
                      <span>{isPending ? 'Opening…' : item.type === 'warning' ? 'Review Record' : 'View Record'}</span>
                      {isPending ? <LoaderCircle className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
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
