'use client'

import * as React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl'
  closeDisabled?: boolean
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'md',
  closeDisabled = false
}: ModalProps) {
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const maxWidthClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-3xl'
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/25 backdrop-blur-md transition-opacity overflow-y-auto"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className={cn(
          'w-full bg-white/95 backdrop-blur-xl rounded-[28px] sm:rounded-[32px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.12),0_0_0_1px_rgba(255,255,255,0.9)_inset] border border-white/80 p-5 sm:p-7 relative max-h-[92vh] sm:max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150 my-auto',
          maxWidthClasses[maxWidth]
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0 pr-2">
            {title && (
              <h2 id="modal-title" className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            disabled={closeDisabled}
            aria-disabled={closeDisabled}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors shrink-0 disabled:cursor-wait disabled:opacity-50"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4 stroke-[2.2]" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
