'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Bell, BellDot, Check, ExternalLink, Clock3, AlertCircle, Info, CheckCircle, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

type Notification = {
  id: string
  student_id: string
  title: string
  message: string
  notification_type: string
  category: string
  deep_link: string | null
  is_read: boolean
  read_at: string | null
  sent_by: string | null
  created_at: string
  updated_at: string
}

export default function StudentNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [markingAsRead, setMarkingAsRead] = useState(false)

  useEffect(() => {
    loadNotifications()
  }, [])

  const loadNotifications = async () => {
    try {
      const response = await fetch('/api/v1/student/notifications')
      const data = await response.json()
      setNotifications(data.data || [])
    } catch (error) {
      toast.error('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationIds: string[]) => {
    setMarkingAsRead(true)
    try {
      const response = await fetch('/api/v1/student/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds, markAsRead: true }),
      })
      if (!response.ok) throw new Error('Failed to mark as read')
      
      setNotifications(prev => 
        prev.map(n => 
          notificationIds.includes(n.id) 
            ? { ...n, is_read: true, read_at: new Date().toISOString() }
            : n
        )
      )
      toast.success('Notifications marked as read')
    } catch (error) {
      toast.error('Failed to mark as read')
    } finally {
      setMarkingAsRead(false)
    }
  }

  const markAllAsRead = () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id)
    if (unreadIds.length > 0) {
      markAsRead(unreadIds)
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (seconds < 60) return 'just now'
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`
    const weeks = Math.floor(days / 7)
    if (weeks < 4) return `${weeks} week${weeks > 1 ? 's' : ''} ago`
    return date.toLocaleDateString()
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'enrollment':
        return <CheckCircle className="h-5 w-5 text-emerald-600" />
      case 'payment':
        return <Check className="h-5 w-5 text-blue-600" />
      case 'alert':
        return <AlertTriangle className="h-5 w-5 text-amber-600" />
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-600" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'academics':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
      case 'finance':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
      case 'administrative':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
      case 'alert':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300'
    }
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  if (loading) return <div className="p-8">Loading notifications...</div>

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-border bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.12),transparent_30%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--accent-soft)))] p-6 md:p-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-border bg-white dark:bg-black">
              {unreadCount > 0 ? (
                <BellDot className="h-8 w-8 text-primary" />
              ) : (
                <Bell className="h-8 w-8 text-primary" />
              )}
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Notifications</p>
              <h1 className="mt-2 text-3xl font-extrabold md:text-5xl">Your Notifications</h1>
              <p className="mt-1 text-sm text-foreground/75">
                {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <Button 
              onClick={markAllAsRead} 
              disabled={markingAsRead}
              className="rounded-xl"
            >
              <Check className="mr-2 h-4 w-4" />
              {markingAsRead ? 'Marking...' : 'Mark All as Read'}
            </Button>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <Card className="p-12 text-center">
          <Bell className="mx-auto mb-4 h-16 w-16 text-muted-foreground opacity-50" />
          <h3 className="text-xl font-semibold">No notifications yet</h3>
          <p className="mt-2 text-muted-foreground">You'll see your notifications here when they arrive.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <Card 
              key={notification.id} 
              className={`p-6 transition-all hover:shadow-md ${
                !notification.is_read ? 'border-l-4 border-l-primary bg-primary/5' : ''
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="mt-1">
                  {getNotificationIcon(notification.notification_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{notification.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getCategoryColor(notification.category)}`}>
                          {notification.category}
                        </span>
                        {!notification.is_read && (
                          <span className="flex h-2 w-2 rounded-full bg-primary" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{notification.message}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock3 className="h-3 w-3" />
                          {formatTimeAgo(notification.created_at)}
                        </div>
                        {notification.read_at && (
                          <span>Read {formatTimeAgo(notification.read_at)}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!notification.is_read && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markAsRead([notification.id])}
                          disabled={markingAsRead}
                          className="rounded-xl"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      {notification.deep_link && (
                        <Button
                          size="sm"
                          variant="outline"
                          asChild
                          className="rounded-xl"
                        >
                          <a href={notification.deep_link}>
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
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
