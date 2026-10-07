'use client'

import * as React from 'react'
import { Bell, Check, Clock, Info, CheckCircle2, AlertTriangle, AlertCircle, X } from 'lucide-react'
import { NotificationItem } from '@/types'
import { markNotificationReadAction } from '@/features/notifications/actions'
import { formatDateTime } from '@/lib/utils/date'

interface NotificationCenterProps {
  notifications: NotificationItem[]
}

export function NotificationCenter({ notifications: initialNotifications }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [notifications, setNotifications] = React.useState(initialNotifications)

  const unreadCount = notifications.filter((n) => !n.isRead).length

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

  return (
    <div className="relative">
      {/* Bell Trigger */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
        aria-label="Open notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
        )}
      </button>

      {/* Popover Card */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed sm:absolute top-16 sm:top-full right-3 sm:right-0 sm:mt-2 w-[calc(100vw-1.5rem)] max-w-sm sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-slate-900">Notifications</h4>
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

            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 text-xs">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
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
                      onClick={() => !item.isRead && handleMarkAsRead(item.id)}
                      className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer ${
                        item.isRead ? 'bg-white hover:bg-slate-50' : 'bg-indigo-50/40 hover:bg-indigo-50/70'
                      }`}
                    >
                      <span
                        className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                          isSuccess
                            ? 'bg-emerald-100 text-emerald-700'
                            : isWarning
                            ? 'bg-amber-100 text-amber-800'
                            : isAlert
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-indigo-100 text-indigo-700'
                        }`}
                      >
                        {isSuccess && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {isWarning && <AlertTriangle className="w-3.5 h-3.5" />}
                        {isAlert && <AlertCircle className="w-3.5 h-3.5" />}
                        {!isSuccess && !isWarning && !isAlert && <Info className="w-3.5 h-3.5" />}
                      </span>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-1 mb-0.5">
                          <h5 className="font-semibold text-xs text-slate-900 truncate">
                            {item.title}
                          </h5>
                          {!item.isRead && (
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          {item.message}
                        </p>
                        <span className="text-[10px] text-slate-400 block mt-1">
                          {formatDateTime(item.createdAt)}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

