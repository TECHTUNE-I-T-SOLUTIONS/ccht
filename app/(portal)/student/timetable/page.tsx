'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, Clock, MapPin, User, Download, Loader2, BookOpen } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

type TimetableSession = {
  id: string
  session_id: string
  semester_id: string
  program_id: string
  level: string
  title?: string
  session?: { name: string }
  sem_info?: { semester_name: string }
  program?: { title: string }
}

type TimetableEntry = {
  id: string
  day_of_week: string
  start_time: string
  end_time: string
  venue?: string
  course?: { code: string; title: string }
  lecturer?: { first_name: string; last_name: string }
}

type Enrollment = {
  program_id: string
  program?: {
    title: string
    department?: {
      name: string
    }
  }
}

type StudentProfile = {
  current_level: string
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function StudentTimetablePage() {
  const [timetableSessions, setTimetableSessions] = useState<TimetableSession[]>([])
  const [selectedSession, setSelectedSession] = useState<TimetableSession | null>(null)
  const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>([])
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null)
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [enrollmentRes, studentProfileRes, sessionsRes] = await Promise.all([
        supabase
          .from('enrollments')
          .select('*, program:programs(title, department:departments(name))')
          .eq('student_id', user.id)
          .eq('status', 'active')
          .single(),
        supabase
          .from('student_profiles')
          .select('current_level')
          .eq('profile_id', user.id)
          .single(),
        supabase
          .from('timetable_sessions')
          .select('*, session:academic_sessions(name), sem_info:academic_semesters(semester_name), program:programs(title)')
          .order('created_at', { ascending: false })
      ])

      setEnrollment(enrollmentRes.data)
      setStudentProfile(studentProfileRes.data)

      // Filter sessions for student's program and level
      const filteredSessions = sessionsRes.data?.filter(
        session => session.program_id === enrollmentRes.data?.program_id && 
                   session.level === studentProfileRes.data?.current_level
      ) || []

      setTimetableSessions(filteredSessions)

      // Auto-select the most recent session
      if (filteredSessions.length > 0) {
        setSelectedSession(filteredSessions[0])
        await loadTimetableEntries(filteredSessions[0].id)
      }
    } catch (error) {
      console.error('Failed to load data:', error)
      toast.error('Failed to load timetable')
    } finally {
      setLoading(false)
    }
  }

  const loadTimetableEntries = async (sessionId: string) => {
    try {
      const { data } = await supabase
        .from('timetable_entries')
        .select('*, course:courses(code, title), lecturer:profiles(first_name, last_name)')
        .eq('timetable_session_id', sessionId)
        .order('day_of_week, start_time')

      setTimetableEntries(data || [])
    } catch (error) {
      console.error('Failed to load entries:', error)
    }
  }

  const handleSessionChange = async (sessionId: string) => {
    const session = timetableSessions.find(s => s.id === sessionId)
    if (session) {
      setSelectedSession(session)
      await loadTimetableEntries(sessionId)
    }
  }

  const handleDownloadPDF = async () => {
    if (!selectedSession) return

    try {
      const response = await fetch('/api/v1/student/timetable/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timetable_session_id: selectedSession.id })
      })

      if (!response.ok) throw new Error('Failed to generate PDF')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `timetable-${selectedSession.program?.title}-${selectedSession.level}L.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Timetable downloaded successfully')
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || 'Failed to download timetable')
    }
  }

  // Group entries by day
  const entriesByDay = timetableEntries.reduce((acc, entry) => {
    if (!acc[entry.day_of_week]) {
      acc[entry.day_of_week] = []
    }
    acc[entry.day_of_week].push(entry)
    return acc
  }, {} as Record<string, TimetableEntry[]>)

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Class Timetable</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {enrollment?.program?.title} · {enrollment?.program?.department?.name} · {studentProfile?.current_level}L
          </p>
        </div>
        {selectedSession && (
          <Button onClick={handleDownloadPDF} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
        )}
      </div>

      {/* Session Selector */}
      {timetableSessions.length > 0 ? (
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Select Timetable:</label>
            <Select value={selectedSession?.id || ''} onValueChange={handleSessionChange}>
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Select timetable" />
              </SelectTrigger>
              <SelectContent>
                {timetableSessions.map((session) => (
                  <SelectItem key={session.id} value={session.id}>
                    {session.session?.name} · {session.sem_info?.semester_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>
      ) : (
        <Card className="p-12 text-center">
          <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
          <p className="text-lg text-muted-foreground">No timetable available</p>
          <p className="text-sm text-muted-foreground mt-2">
            Timetables will be published by your department
          </p>
        </Card>
      )}

      {/* Timetable Display */}
      {selectedSession && (
        <Card className="p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold">
              {selectedSession.title || `${selectedSession.program?.title} - ${selectedSession.level}L`}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {selectedSession.session?.name} · {selectedSession.sem_info?.semester_name}
            </p>
          </div>

          {timetableEntries.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No classes scheduled yet</p>
            </div>
          ) : (
            <div className="space-y-6">
              {DAYS.map((day) => {
                const dayEntries = entriesByDay[day] || []
                if (dayEntries.length === 0) return null

                return (
                  <div key={day}>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      {day}
                    </h3>
                    <div className="space-y-2">
                      {dayEntries.map((entry) => (
                        <div key={entry.id} className="flex items-center justify-between p-4 rounded-lg border bg-slate-50 dark:bg-slate-800/50">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <span className="font-medium">{entry.start_time} - {entry.end_time}</span>
                            </div>
                            <div className="h-8 w-px bg-border" />
                            <div>
                              <p className="font-semibold">{entry.course?.code} - {entry.course?.title}</p>
                              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                {entry.venue && (
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    <span>{entry.venue}</span>
                                  </div>
                                )}
                                {entry.lecturer && (
                                  <div className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    <span>{entry.lecturer.first_name} {entry.lecturer.last_name}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <Badge variant="outline" className="hidden sm:inline-flex">
                            {entry.day_of_week}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
