import React from 'react'
import { PremiumCard } from './premium-card'
import { cn } from '@/lib/utils'

interface StepCardProps {
  step: number
  title: string
  description: string
  isActive?: boolean
}

export function StepCard({
  step,
  title,
  description,
  isActive = false,
}: StepCardProps) {
  return (
    <PremiumCard
      hoverable={false}
      glassEffect={true}
      className={cn(
        'relative',
        isActive && 'ring-2 ring-blue-500'
      )}
    >
      <div className="flex gap-6">
        <div className={cn(
          'flex items-center justify-center w-16 h-16 rounded-2xl font-bold text-xl flex-shrink-0',
          isActive
            ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white'
            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
        )}>
          {step}
        </div>
        <div className="flex flex-col justify-center">
          <h3 className="text-2xl font-bold mb-2">{title}</h3>
          <p className="text-muted-foreground text-base leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </PremiumCard>
  )
}
