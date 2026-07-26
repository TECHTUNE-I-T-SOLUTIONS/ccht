'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Video, CalendarDays, Clock, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

type OnlineClass = {
  id: string
  course_id: string
  teacher_id: string
  day_of_week: string
  start_time: string
  end_time: string
  meet_link: string
  meet_link_display_name?: string
  notes?: string
  is_active: boolean
  course?: { code: string; title: string; level: string; semester: number }
  teacher?: { first_name: string; last_name: string }
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function StudentOnlineClassesPage() {
  const [onlineClasses, setOnlineClasses] = useState<OnlineClass[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch('/api/v1/student/online-classes')
        const data = await res.json()
        console.log('Online classes data:', data)
        setOnlineClasses(data.data || [])
      } catch (error) {
        console.error('Failed to load online classes:', error)
        toast.error('Failed to load online classes')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Group by day of week
  const classesByDay = onlineClasses.reduce((acc, onlineClass) => {
    const day = onlineClass.day_of_week
    if (!acc[day]) {
      acc[day] = []
    }
    acc[day].push(onlineClass)
    return acc
  }, {} as Record<string, OnlineClass[]>)

  const sortedDays = DAYS_OF_WEEK.filter(day => classesByDay[day]?.length > 0)

  if (loading) return <div className="p-8">Loading online classes...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Video className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-bold">Online Classes</h1>
      </div>

      {onlineClasses.length === 0 ? (
        <Card className="p-8">
          <p className="text-center text-muted-foreground">No online classes scheduled for your courses</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {sortedDays.map((day) => (
            <div key={day} className="space-y-4">
              <h2 className="text-xl font-semibold text-primary">{day}</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {classesByDay[day].map((onlineClass) => (
                  <Card key={onlineClass.id} className="p-5 hover:shadow-md transition-shadow">
                    <div className="mb-3">
                      <p className="font-semibold">{onlineClass.course?.code}</p>
                      <p className="text-sm text-muted-foreground">{onlineClass.course?.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Level {onlineClass.course?.level} • Semester {onlineClass.course?.semester}
                      </p>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{onlineClass.start_time.substring(0, 5)} - {onlineClass.end_time.substring(0, 5)}</span>
                      </div>

                      {onlineClass.teacher && (
                        <p className="text-xs text-muted-foreground">
                          Instructor: {onlineClass.teacher.first_name} {onlineClass.teacher.last_name}
                        </p>
                      )}

                      {onlineClass.notes && (
                        <p className="text-xs text-muted-foreground italic">{onlineClass.notes}</p>
                      )}
                    </div>

                    <Button
                      asChild
                      className="w-full mt-4"
                      size="sm"
                    >
                      <a
                        href={onlineClass.meet_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        {onlineClass.meet_link_display_name || 'Join Meeting'}
                      </a>
                    </Button>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
