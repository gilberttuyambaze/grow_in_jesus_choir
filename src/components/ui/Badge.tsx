import * as React from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'recorded' | 'review' | 'rejected' | 'voided' | 'default' | 'neutral'
}

export function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
  const variantStyles = {
    recorded: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80',
    review: 'bg-amber-50 text-amber-700 border border-amber-200/80',
    rejected: 'bg-rose-50 text-rose-700 border border-rose-200/80',
    voided: 'bg-slate-100 text-slate-500 border border-slate-200',
    neutral: 'bg-slate-50 text-slate-600 border border-slate-200',
    default: 'bg-indigo-50 text-indigo-700 border border-indigo-200/80'
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium tracking-tight',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" aria-hidden="true" />
      {children}
    </span>
  )
}

