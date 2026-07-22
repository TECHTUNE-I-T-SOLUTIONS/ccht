'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Calendar, Clock, MapPin, BookOpen, Loader2 } from 'lucide-react'
import Link from 'next/link'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

type ScheduleEntry = {
  id: string
  day_of_week: string
  start_time: string
  end_time: string
  venue: string
  course_code: string
  course_title: string
  level: string
  semester: number
}

export default function LecturerSchedulePage() {
  const params = useParams()
  const [lecturer, setLecturer] = useState<any>(null)
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState('Monday')
  const supabase = createClient()

  useEffect(() => {
    if (params.id) {
      loadLecturerSchedule(params.id as string)
    }
  }, [params.id])

  const loadLecturerSchedule = async (id: string) => {
    try {
      // Load lecturer info
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*, teacher_profiles(*)')
        .eq('id', id)
        .single()

      setLecturer(profileData)

      // Load timetable entries
      const { data: entriesData } = await supabase
        .from('timetable_entries')
        .select(`
          id,
          day_of_week,
          start_time,
          end_time,
          venue,
          course:courses(code, title, level, semester)
        `)
        .eq('lecturer_id', id)
        .order('start_time')

      const formattedSchedule: ScheduleEntry[] = (entriesData || []).map((entry: any) => ({
        id: entry.id,
        day_of_week: entry.day_of_week,
        start_time: entry.start_time,
        end_time: entry.end_time,
        venue: entry.venue,
        course_code: entry.course.code,
        course_title: entry.course.title,
        level: entry.course.level,
        semester: entry.course.semester
      }))

      setSchedule(formattedSchedule)
    } catch (error) {
      console.error('Failed to load lecturer schedule:', error)
      toast.error('Failed to load schedule')
    } finally {
      setLoading(false)
    }
  }

  const filteredSchedule = schedule.filter(entry => entry.day_of_week === selectedDay)

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/admin/lecturers/${params.id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Teaching Schedule</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {lecturer ? `${lecturer.first_name} ${lecturer.last_name}'s weekly schedule` : 'Loading...'}
          </p>
        </div>
      </div>

      {/* Day Selector */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-2">
          {DAYS.map((day) => {
            const dayCount = schedule.filter(s => s.day_of_week === day).length
            return (
              <Button
                key={day}
                size="sm"
                variant={selectedDay === day ? 'default' : 'outline'}
                onClick={() => setSelectedDay(day)}
                className="relative"
              >
                {day}
                {dayCount > 0 && (
                  <span className="ml-2 rounded-full bg-primary/20 px-2 py-0.5 text-xs">
                    {dayCount}
                  </span>
                )}
              </Button>
            )
          })}
        </div>
      </Card>

      {/* Schedule for Selected Day */}
      {filteredSchedule.length === 0 ? (
        <Card className="p-12 text-center">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
          <p className="text-lg text-muted-foreground">No classes on {selectedDay}</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredSchedule
            .sort((a, b) => a.start_time.localeCompare(b.start_time))
            .map((entry) => (
              <Card key={entry.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="flex items-center gap-2 text-sm font-mono text-primary min-w-[120px]">
                      <Clock className="h-4 w-4" />
                      <span>{entry.start_time} - {entry.end_time}</span>
                    </div>
                    <div className="h-8 w-px bg-border" />
                    <div className="flex-1">
                      <p className="font-semibold">{entry.course_code} - {entry.course_title}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <Badge variant="outline">{entry.level}L</Badge>
                        <Badge variant="outline">Sem {entry.semester}</Badge>
                        {entry.venue && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {entry.venue}
                          </span>
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