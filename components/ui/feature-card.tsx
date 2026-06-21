import React from 'react'
import { LucideIcon } from 'lucide-react'
import { PremiumCard } from './premium-card'
import { cn } from '@/lib/utils'

interface FeatureCardProps {
  icon: LucideIcon
  title: string
  description: string
  iconColor?: string
}

export function FeatureCard({
  icon: Icon,
  title,
  description,
  iconColor = 'text-blue-600 dark:text-blue-400',
}: FeatureCardProps) {
  return (
    <PremiumCard hoverable={true} glassEffect={true}>
      <div className="flex flex-col items-start gap-6">
        <div className={cn('p-4 rounded-xl bg-blue-100 dark:bg-blue-900/30')}>
          <Icon className={cn('h-8 w-8', iconColor)} />
        </div>
        <div>
          <h3 className="text-2xl font-bold mb-3">{title}</h3>
          <p className="text-muted-foreground text-base leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </PremiumCard>
  )
}
