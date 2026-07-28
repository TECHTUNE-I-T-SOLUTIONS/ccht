'use client'

import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'

type Announcement = {
  id: string
  title: string
  content: string
  published_at: string
}

interface AnnouncementBannerProps {
  sidebarCollapsed?: boolean
}

export function AnnouncementBanner({ sidebarCollapsed = false }: AnnouncementBannerProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const response = await fetch('/api/v1/announcements?limit=10')
        const data = await response.json()
        if (data.success) {
          setAnnouncements(data.data || [])
        }
      } catch (error) {
        console.error('Failed to fetch announcements:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnnouncements()
  }, [])

  if (loading || announcements.length === 0) {
    return null
  }

  return (
    <div className={`bg-gradient-to-r from-blue-200 to-blue-850 dark:bg-gradient-to-r dark:from-blue-800 dark:to-blue-950 text-primary overflow-hidden transition-all duration-infinite ${sidebarCollapsed ? 'xl:pl-[4.75rem]' : 'xl:pl-[18rem]'}`}>
      <div className="flex items-center">
        <div className="flex items-center gap-2 px-4 py-3 bg-blue-700/50 shrink-0">
          <Bell className="h-4 w-4" />
          <span className="font-semibold text-sm whitespace-nowrap">Announcements</span>
        </div>
        <div className="relative flex-1 overflow-hidden">
          <div className="flex animate-marquee whitespace-nowrap">
            {/* Repeat announcements multiple times for seamless infinite scroll */}
            {[...Array(40000)].flatMap(() => 
              announcements.map((announcement) => (
                <div key={`${announcement.id}-${Math.random()}`} className="flex items-center gap-4 px-6 py-3">
                  <span className="font-semibold">{announcement.title}</span>
                  <span className="text-primary">{announcement.content}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
