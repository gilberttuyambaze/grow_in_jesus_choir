'use client'

import * as React from 'react'
import { CheckCircle2, AlertCircle, Info, XCircle, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastItem {
  id: string
  title: string
  description?: string
  type: ToastType
  duration?: number
}

interface ToastContextValue {
  showToast: (props: { title: string; description?: string; type?: ToastType; duration?: number }) => void
  success: (title: string, description?: string) => void
  error: (title: string, description?: string) => void
  info: (title: string, description?: string) => void
  warning: (title: string, description?: string) => void
}

const ToastContext = React.createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([])

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = React.useCallback(
    ({
      title,
      description,
      type = 'success',
      duration = 3500
    }: {
      title: string
      description?: string
      type?: ToastType
      duration?: number
    }) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
      const newToast: ToastItem = { id, title, description, type, duration }
      setToasts((prev) => [...prev, newToast])

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id)
        }, duration)
      }
    },
    [removeToast]
  )

  const success = React.useCallback(
    (title: string, description?: string) => showToast({ title, description, type: 'success' }),
    [showToast]
  )
  const error = React.useCallback(
    (title: string, description?: string) => showToast({ title, description, type: 'error' }),
    [showToast]
  )
  const info = React.useCallback(
    (title: string, description?: string) => showToast({ title, description, type: 'info' }),
    [showToast]
  )
  const warning = React.useCallback(
    (title: string, description?: string) => showToast({ title, description, type: 'warning' }),
    [showToast]
  )

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, warning }}>
      {children}
      {/* Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success'
          const isError = toast.type === 'error'
          const isWarning = toast.type === 'warning'
          const isInfo = toast.type === 'info'

          return (
            <div
              key={toast.id}
              className="pointer-events-auto flex items-start gap-3 p-4 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-xl shadow-slate-900/5 transition-all transform animate-in fade-in slide-in-from-bottom-3"
            >
              {/* Icon */}
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  isSuccess
                    ? 'bg-emerald-50 text-emerald-600'
                    : isError
                    ? 'bg-rose-50 text-rose-600'
                    : isWarning
                    ? 'bg-amber-50 text-amber-600'
                    : 'bg-indigo-50 text-indigo-600'
                }`}
              >
                {isSuccess && <CheckCircle2 className="w-4 h-4" />}
                {isError && <XCircle className="w-4 h-4" />}
                {isWarning && <AlertCircle className="w-4 h-4" />}
                {isInfo && <Info className="w-4 h-4" />}
              </div>

              {/* Text content */}
              <div className="flex-1 min-w-0">
                <h5 className="font-semibold text-xs text-slate-900 leading-tight">
                  {toast.title}
                </h5>
                {toast.description && (
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                    {toast.description}
                  </p>
                )}
              </div>

              {/* Close Button */}
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-600 p-0.5 rounded-lg transition-colors shrink-0"
                aria-label="Dismiss notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    // Return safe fallbacks if used outside provider
    return {
      showToast: () => {},
      success: () => {},
      error: () => {},
      info: () => {},
      warning: () => {}
    }
  }
  return context
}

