'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { BellRing, MessageCircleWarning, ShieldCheck, UploadCloud, ArrowRight } from 'lucide-react'

type Notification = {
  id: string
  title: string
  description: string
  status: string
  time: string
  deep_link?: string | null
}

export default function AspirantNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    const load = async () => {
      const response = await fetch('/api/v1/notifications/aspirant')
      const payload = await response.json().catch(() => null)
      const items = Array.isArray(payload?.data)
        ? payload.data.map((item: {
            id: string
            title: string
            message: string
            notification_type?: string
            created_at?: string
            deep_link?: string | null
          }) => ({
            id: item.id,
            title: item.title,
            description: item.message,
            status: item.notification_type || 'general',
            time: item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recently',
            deep_link: item.deep_link,
          }))
        : []

      setNotifications(items)
    }

    load()
  }, [])

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-border bg-card p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Notifications</p>
        <h1 className="mt-3 text-3xl font-extrabold">Latest updates</h1>
      </div>

      <Card className="rounded-[2rem] p-6">
        <div className="grid gap-4">
          {notifications.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-background p-6 text-sm text-muted-foreground">
              You do not have any notifications yet.
            </div>
          ) : (
            notifications.map((item) => (
              <div key={item.id} className="rounded-2xl border border-border bg-background p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                    {item.status.includes('passport') ? <UploadCloud className="h-5 w-5" /> : item.status.includes('review') ? <ShieldCheck className="h-5 w-5" /> : <MessageCircleWarning className="h-5 w-5" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h2 className="font-semibold">{item.title}</h2>
                      <span className="rounded-full border border-border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        {item.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <p className="text-xs text-muted-foreground">{item.time}</p>
                      {item.deep_link && (
                        <Link href={item.deep_link} className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                          Open
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  )
}
