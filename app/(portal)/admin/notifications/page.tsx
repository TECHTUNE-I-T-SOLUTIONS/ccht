'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Bell, BellOff, ArrowRight, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

type AdminNotification = {
  id: string
  title: string
  message: string
  notification_type: string
  category: string | null
  deep_link: string | null
  priority: string
  is_read: boolean
  read_at: string | null
  created_at: string
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const response = await fetch('/api/v1/admin/notifications')
        const payload = await response.json().catch(() => null)
        setNotifications(payload?.data || [])
      } catch (error) {
        console.error('Failed to load admin notifications:', error)
        toast.error('Failed to load notifications')
      } finally {
        setLoading(false)
      }
    }

    loadNotifications()
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-3 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading notifications...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Admin Notifications</h1>
          <p className="mt-1 text-muted-foreground">Track notices, alerts, and actions that need attention</p>
        </div>
        <Badge variant="outline" className="h-8 rounded-full px-3">
          {notifications.filter((item) => !item.is_read).length} unread
        </Badge>
      </div>

      {notifications.length === 0 ? (
        <Card className="flex min-h-[320px] flex-col items-center justify-center gap-4 border-dashed p-10 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <BellOff className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">No notifications yet</h2>
            <p className="mt-1 text-sm text-muted-foreground">Notifications created for this admin account will appear here.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card key={notification.id} className={`p-5 ${notification.is_read ? 'opacity-80' : 'border-primary/20 shadow-sm'}`}>
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold">{notification.title}</h2>
                    <Badge variant={notification.is_read ? 'outline' : 'default'}>{notification.is_read ? 'Read' : 'Unread'}</Badge>
                    <Badge variant="outline" className="capitalize">{notification.priority}</Badge>
                    {notification.category ? <Badge variant="secondary" className="capitalize">{notification.category}</Badge> : null}
                  </div>
                  <p className="max-w-3xl text-sm text-muted-foreground">{notification.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(notification.created_at).toLocaleString()}
                  </p>
                </div>

                {notification.deep_link ? (
                  <Button asChild variant="outline" size="sm" className="shrink-0 rounded-xl">
                    <a href={notification.deep_link}>
                      Open
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}