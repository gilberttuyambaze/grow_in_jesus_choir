import * as React from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'recorded' | 'review' | 'rejected' | 'default' | 'neutral'
}

export function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
  const variantStyles = {
    recorded: 'bg-[#eaf4ec] text-[#3e7d50] border border-[#d2e8d7]',
    review: 'bg-[#fbf2e5] text-[#a57338] border border-[#f3dfc5]',
    rejected: 'bg-[#fdeeed] text-[#b8564b] border border-[#fad2cf]',
    neutral: 'bg-[#f0f3f0] text-[#63736b] border border-[#e1e7e2]',
    default: 'bg-[#e8f1ec] text-[#315b4d] border border-[#d3e3d8]'
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

