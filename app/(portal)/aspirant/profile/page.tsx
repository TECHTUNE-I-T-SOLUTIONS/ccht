'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BadgeCheck, Mail, Phone, UserRound } from 'lucide-react'

type PortalUser = {
  firstName: string
  lastName: string
  email: string
  phone?: string
  role: string
  avatarUrl?: string
}

export default function AspirantProfilePage() {
  const [user, setUser] = useState<PortalUser | null>(null)

  useEffect(() => {
    const loadUser = async () => {
      const response = await fetch('/api/v1/auth/me')
      const payload = await response.json().catch(() => null)
      setUser(payload?.user || null)
    }

    loadUser()
  }, [])

  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Aspirant'

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-border bg-card p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Profile</p>
        <h1 className="mt-3 text-3xl font-extrabold">Personal details</h1>
      </div>

      <Card className="rounded-[2rem] p-6">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-border bg-background">
            {user?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatarUrl} alt={displayName} className="h-full w-full object-cover" />
            ) : (
              <UserRound className="h-8 w-8 text-primary" />
            )}
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Signed in</p>
            <h2 className="text-2xl font-bold">{displayName}</h2>
            <p className="text-sm text-muted-foreground">{user?.email || 'Email not available'}</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {[
            { label: 'Full name', value: displayName, icon: UserRound },
            { label: 'Email', value: user?.email || 'Registered email', icon: Mail },
            { label: 'Phone', value: user?.phone || 'Registered phone number', icon: Phone },
            { label: 'Status', value: user?.role || 'Aspirant', icon: BadgeCheck },
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
