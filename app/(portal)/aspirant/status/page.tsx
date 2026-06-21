'use client'

import { Card } from '@/components/ui/card'
import { BadgeCheck, Clock3, Hourglass, ShieldCheck } from 'lucide-react'

export default function AspirantStatusPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-border bg-card p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Status</p>
        <h1 className="mt-3 text-3xl font-extrabold">Admission progress</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Submitted', icon: BadgeCheck, value: 'Yes' },
          { label: 'Under review', icon: Clock3, value: 'Yes' },
          { label: 'Correction needed', icon: Hourglass, value: 'No' },
          { label: 'Final decision', icon: ShieldCheck, value: 'Pending' },
        ].map((item) => {
          const Icon = item.icon
          return (
            <Card key={item.label} className="rounded-3xl p-6">
              <Icon className="h-5 w-5 text-primary" />
              <p className="mt-4 text-sm text-muted-foreground">{item.label}</p>
              <p className="mt-1 text-2xl font-bold">{item.value}</p>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
