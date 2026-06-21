'use client'

import { Card } from '@/components/ui/card'
import { BadgeCheck, ClipboardList, FileText, UserRound } from 'lucide-react'

export default function AspirantApplicationPage() {
  const stages = [
    { label: 'Profile details', icon: UserRound, status: 'Completed' },
    { label: 'Course selection', icon: ClipboardList, status: 'Completed' },
    { label: 'Screening', icon: BadgeCheck, status: 'In review' },
    { label: 'Admission decision', icon: FileText, status: 'Pending' },
  ]

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-border bg-card p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Application</p>
        <h1 className="mt-3 text-3xl font-extrabold">Your admission application</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-foreground/70">
          View the current state of your application and the steps that still need attention.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stages.map((stage) => {
          const Icon = stage.icon
          return (
            <Card key={stage.label} className="rounded-3xl p-6">
              <Icon className="h-5 w-5 text-primary" />
              <p className="mt-4 text-sm text-muted-foreground">{stage.label}</p>
              <p className="mt-1 text-lg font-semibold">{stage.status}</p>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
