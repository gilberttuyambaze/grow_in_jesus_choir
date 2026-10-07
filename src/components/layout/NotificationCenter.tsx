'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bell, Check, Clock, Info, CheckCircle2, AlertTriangle, AlertCircle, ArrowRight } from 'lucide-react'
import { NotificationItem } from '@/types'
import { markNotificationReadAction } from '@/features/notifications/actions'
import { formatDateTime } from '@/lib/utils/date'

interface NotificationCenterProps {
  notifications: NotificationItem[]
}

export function NotificationCenter({ notifications: initialNotifications }: NotificationCenterProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = React.useState(false)
  const [notifications, setNotifications] = React.useState(initialNotifications)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  // Sync state if initialNotifications updates
  React.useEffect(() => {
    setNotifications(initialNotifications)
  }, [initialNotifications])

  const unreadCount = notifications.filter((n) => !n.isRead).length

  // Click outside listener to dismiss notifications popover
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleMarkAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    )
    await markNotificationReadAction(id)
  }

  const handleMarkAll = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    for (const n of notifications.filter((item) => !item.isRead)) {
      await markNotificationReadAction(n.id)
    }
  }

  const handleNotificationClick = async (item: NotificationItem) => {
    if (!item.isRead) {
      await handleMarkAsRead(item.id)
    }
    setIsOpen(false)

    // Direct routing to record or linked destination (Section 73 & user requirement)
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
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
        aria-label="Open notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
        )}
      </button>

      {/* Popover Card matching Reference Image media_1791402053359_0b6949c6.png */}
      {isOpen && (
        <div className="fixed sm:absolute top-16 sm:top-full right-3 sm:right-0 sm:mt-2.5 w-[calc(100vw-1.5rem)] max-w-sm sm:w-96 bg-white rounded-[22px] sm:rounded-[26px] shadow-2xl border border-slate-200/90 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-4 sm:p-4.5 border-b border-slate-100 flex items-center justify-between bg-white">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-slate-900 tracking-tight">Notifications</h4>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold">
                  {unreadCount} unread
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAll}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold transition-colors"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 text-xs">
            {notifications.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400">
                No notifications at this time.
              </div>
            ) : (
              notifications.map((item) => {
                const isSuccess = item.type === 'success'
                const isWarning = item.type === 'warning'
                const isAlert = item.type === 'alert'

                return (
                  <div
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    className={`p-4 flex items-start gap-3.5 transition-colors cursor-pointer group ${
                      item.isRead ? 'bg-white hover:bg-slate-50/80' : 'bg-indigo-50/30 hover:bg-indigo-50/60'
                    }`}
                  >
                    {/* Circle Icon Badge matching Reference Image */}
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 shadow-xs ${
                        isWarning
                          ? 'bg-amber-100/80 text-amber-800'
                          : isSuccess
                          ? 'bg-emerald-100/80 text-emerald-800'
                          : isAlert
                          ? 'bg-rose-100/80 text-rose-800'
                          : 'bg-indigo-100/80 text-indigo-800'
                      }`}
                    >
                      {isWarning && <AlertTriangle className="w-4 h-4 stroke-[2.2]" />}
                      {isSuccess && <CheckCircle2 className="w-4 h-4 stroke-[2.2]" />}
                      {isAlert && <AlertCircle className="w-4 h-4 stroke-[2.2]" />}
                      {!isWarning && !isSuccess && !isAlert && <Info className="w-4 h-4 stroke-[2.2]" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-1 mb-0.5">
                        <h5 className="font-bold text-xs sm:text-[13px] text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                          {item.title}
                        </h5>
                        {!item.isRead && (
                          <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] sm:text-xs text-slate-500 leading-snug">
                        {item.message}
                      </p>
                      <span className="text-[10px] text-slate-400 block mt-1.5 font-medium">
                        {formatDateTime(item.createdAt)}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer linking to dedicated notifications page */}
          <div className="p-3 bg-slate-50/70 border-t border-slate-100 text-center">
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors inline-flex items-center gap-1"
            >
              <span>View all notifications</span>
              <span className="transition-transform group-hover:translate-x-0.5">→</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
