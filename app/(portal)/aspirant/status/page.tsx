'use client'

import { Card } from '@/components/ui/card'
import { BadgeCheck, Clock3, Hourglass, ShieldCheck } from 'lucide-react'

export default function AspirantStatusPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-border bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.12),transparent_30%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--accent-soft)))] p-6 md:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Status</p>
        <h1 className="mt-3 text-3xl font-extrabold">Admission progress</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-foreground/70">
          Track where you are in the admissions process: profile, documents, exam, offer, and student migration.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Submitted', icon: BadgeCheck, value: 'Yes' },
          { label: 'Documents complete', icon: Clock3, value: 'In progress' },
          { label: 'Entrance exam', icon: Hourglass, value: 'Pending' },
          { label: 'Final decision', icon: ShieldCheck, value: 'Pending' },
        ].map((item) => {
          const Icon = item.icon
          return (
            <Card key={item.label} className="rounded-3xl border bg-white p-6 shadow-sm dark:bg-blue-800/20">
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
