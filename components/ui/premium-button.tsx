import React from 'react'
import { cn } from '@/lib/utils'

interface PremiumButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export function PremiumButton({
  children,
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: PremiumButtonProps) {
  return (
    <button
      className={cn(
        'font-semibold rounded-xl transition-all duration-300 cursor-pointer',
        'hover:shadow-lg active:scale-95',
        // Sizes
        size === 'sm' && 'px-4 py-2 text-sm',
        size === 'md' && 'px-6 py-3 text-base',
        size === 'lg' && 'px-8 py-4 text-lg',
        size === 'xl' && 'px-10 py-5 text-xl',
        // Variants
        variant === 'primary' && 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 hover:scale-105',
        variant === 'secondary' && 'bg-gradient-to-r from-slate-700 to-slate-800 text-white hover:from-slate-800 hover:to-slate-900 hover:scale-105',
        variant === 'outline' && 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20',
        variant === 'ghost' && 'text-foreground hover:bg-slate-100 dark:hover:bg-slate-800',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
