import React from 'react'
import { cn } from '@/lib/utils'

interface PremiumCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  hoverable?: boolean
  glassEffect?: boolean
  gradient?: boolean
}

export function PremiumCard({
  children,
  hoverable = true,
  glassEffect = true,
  gradient = false,
  className,
  ...props
}: PremiumCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border transition-all duration-300',
        glassEffect
          ? 'bg-white/80 dark:bg-slate-900/80 border-white/20 dark:border-slate-700/30 backdrop-blur-xl'
          : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800',
        gradient && 'bg-gradient-to-br from-white/90 to-slate-50/90 dark:from-slate-900/90 dark:to-slate-950/90',
        hoverable && 'hover:shadow-2xl hover:scale-105 hover:border-slate-300/50 dark:hover:border-slate-600/50 cursor-pointer',
        'p-10 shadow-lg',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
