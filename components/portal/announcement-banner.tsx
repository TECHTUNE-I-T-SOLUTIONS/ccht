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

// Cache key for announcements
const ANNOUNCEMENTS_CACHE_KEY = 'portal_announcements_cache'
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export function AnnouncementBanner({ sidebarCollapsed = false }: AnnouncementBannerProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        // Check cache first
        const cached = localStorage.getItem(ANNOUNCEMENTS_CACHE_KEY)
        if (cached) {
          const { data, timestamp } = JSON.parse(cached)
          if (Date.now() - timestamp < CACHE_DURATION) {
            setAnnouncements(data)
            setLoading(false)
            return
          }
        }

        const response = await fetch('/api/v1/announcements?limit=10', { cache: 'no-store' })
        const data = await response.json()
        if (data.success) {
          const announcementsData = data.data || []
          setAnnouncements(announcementsData)
          // Cache announcements
          localStorage.setItem(ANNOUNCEMENTS_CACHE_KEY, JSON.stringify({ data: announcementsData, timestamp: Date.now() }))
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
            {/* Repeat announcements 4 times for seamless infinite scroll - much more efficient than 40,000 */}
            {Array.from({ length: 4 }).flatMap(() => 
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
