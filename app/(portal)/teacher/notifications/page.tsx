'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Bell, Mail, Clock3, CheckCheck, UserRound } from 'lucide-react'

type TeacherNotification = {
  id: string
  title: string
  message: string
  notification_type: string
  category?: string | null
  deep_link?: string | null
  is_read: boolean
  created_at: string
  sender?: {
    first_name?: string | null
    last_name?: string | null
    email?: string | null
  } | null
}

export default function TeacherNotificationsPage() {
  const [notifications, setNotifications] = useState<TeacherNotification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/v1/teacher/notifications')
        const data = await res.json()
        setNotifications(data.data || [])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <div className="p-8">Loading notifications...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground">Messages, alerts, and updates for your account</p>
        </div>
        <Badge variant="secondary" className="gap-2 rounded-full px-3 py-1">
          <Bell className="h-3.5 w-3.5" />
          {notifications.length}
        </Badge>
      </div>

      {notifications.length === 0 ? (
        <Card className="rounded-[2rem] p-8 text-center text-muted-foreground">
          No notifications yet.
        </Card>
      ) : (
        <div className="grid gap-4">
          {notifications.map((item) => (
            <Card key={item.id} className="rounded-[1.5rem] p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold">{item.title}</h2>
                      {!item.is_read && <Badge>New</Badge>}
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{item.message}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{new Date(item.created_at).toLocaleString()}</span>
                      <span className="inline-flex items-center gap-1"><UserRound className="h-3.5 w-3.5" />{item.sender ? `${item.sender.first_name || ''} ${item.sender.last_name || ''}`.trim() || item.sender.email || 'System' : 'System'}</span>
                      <span className="inline-flex items-center gap-1"><CheckCheck className="h-3.5 w-3.5" />{item.notification_type}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
