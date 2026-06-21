'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { UserRound, Mail, Phone, BadgeCheck } from 'lucide-react'

export default function AspirantProfilePage() {
  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-border bg-card p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Profile</p>
        <h1 className="mt-3 text-3xl font-extrabold">Personal details</h1>
      </div>
      <Card className="rounded-[2rem] p-6">
        <div className="grid gap-4 md:grid-cols-2">
          {[
            { label: 'Full name', value: 'Update from your profile', icon: UserRound },
            { label: 'Email', value: 'Registered email', icon: Mail },
            { label: 'Phone', value: 'Registered phone number', icon: Phone },
            { label: 'Status', value: 'Aspirant', icon: BadgeCheck },
          ].map((item) => {
            const Icon = item.icon
            return (
              <div key={item.label} className="rounded-2xl border border-border bg-background p-4">
                <Icon className="h-5 w-5 text-primary" />
                <p className="mt-3 text-sm text-muted-foreground">{item.label}</p>
                <p className="mt-1 font-semibold">{item.value}</p>
              </div>
            )
          })}
        </div>
        <Button className="mt-6 rounded-2xl">Update profile</Button>
      </Card>
    </div>
  )
}
