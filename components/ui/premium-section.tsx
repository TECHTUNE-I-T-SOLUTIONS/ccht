import React from 'react'
import { cn } from '@/lib/utils'

interface PremiumSectionProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode
  title?: string
  subtitle?: string
  centered?: boolean
  darkBg?: boolean
}

export function PremiumSection({
  children,
  title,
  subtitle,
  centered = true,
  darkBg = false,
  className,
  ...props
}: PremiumSectionProps) {
  return (
    <section
      className={cn(
        'py-24 px-4 sm:px-6 lg:px-8',
        darkBg ? 'bg-slate-900 dark:bg-slate-950' : 'bg-white dark:bg-slate-900',
        className
      )}
      {...props}
    >
      <div className="mx-auto max-w-7xl">
        {title && (
          <div className={cn('mb-16', centered && 'text-center')}>
            <h2 className="text-5xl sm:text-6xl font-bold mb-6 tracking-tight">
              {title}
            </h2>
            {subtitle && (
              <p className={cn(
                'text-xl text-muted-foreground max-w-2xl',
                centered && 'mx-auto'
              )}>
                {subtitle}
              </p>
            )}
          </div>
        )}
        {children}
      </div>
    </section>
  )
}
