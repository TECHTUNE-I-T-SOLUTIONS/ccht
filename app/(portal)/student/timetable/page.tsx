'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, Clock, MapPin, User, Download, Loader2, BookOpen, Video, ExternalLink } from 'lucide-react'
import { generateTimetablePDF } from '@/lib/templates/timetable'
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
  course_id?: string
}

type OnlineClass = {
  id: string
  course_id: string
  day_of_week: string
  start_time: string
  end_time: string
  meet_link: string
  meet_link_display_name?: string
  notes?: string
  class_date?: string
  is_active: boolean
  course?: { code: string; title: string }
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
  const [onlineClasses, setOnlineClasses] = useState<OnlineClass[]>([])
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

      const [enrollmentRes, studentProfileRes, sessionsRes, onlineClassesRes] = await Promise.all([
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
          .order('created_at', { ascending: false }),
        supabase
          .from('online_classes')
          .select('*, course:courses(code, title)')
          .eq('is_active', true)
          .order('class_date, day_of_week, start_time')
      ])

      setEnrollment(enrollmentRes.data)
      setStudentProfile(studentProfileRes.data)
      setOnlineClasses(onlineClassesRes.data || [])

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
      const { data, error } = await supabase
        .from('timetable_entries')
        .select('*, course:courses(code, title), lecturer:profiles!timetable_entries_lecturer_id_fkey(first_name, last_name)')
        .eq('timetable_session_id', sessionId)
        .order('day_of_week, start_time')

      setTimetableEntries(data || [])
    } catch (error) {
      console.error('Failed to load entries:', error)
    }
  }

  // Filter online classes for student's enrolled courses
  const getStudentOnlineClasses = () => {
    if (!enrollment) return []
    const studentCourseIds = timetableEntries.map(entry => entry.course_id).filter(Boolean)
    return onlineClasses.filter(oc => studentCourseIds.includes(oc.course_id))
  }

  const handleSessionChange = async (sessionId: string) => {
    const session = timetableSessions.find(s => s.id === sessionId)
    if (session) {
      setSelectedSession(session)
      await loadTimetableEntries(sessionId)
    }
  }

  const handleDownloadPDF = () => {
    if (!selectedSession || !enrollment || !studentProfile) return

    try {
      const timetableData = {
        title: selectedSession.title || `${selectedSession.program?.title} - ${selectedSession.level}L`,
        session: selectedSession.session?.name || 'N/A',
        semester: selectedSession.sem_info?.semester_name || 'N/A',
        program: enrollment.program?.title || 'N/A',
        level: studentProfile.current_level || 'N/A',
        entries: timetableEntries.map(entry => ({
          id: entry.id,
          course_code: entry.course?.code || 'N/A',
          course_title: entry.course?.title || 'N/A',
          day_of_week: entry.day_of_week,
          start_time: entry.start_time.substring(0, 5),
          end_time: entry.end_time.substring(0, 5),
          venue: entry.venue || 'TBA',
          lecturer_name: entry.lecturer ? `${entry.lecturer.first_name} ${entry.lecturer.last_name}` : 'TBA'
        }))
      }

      const doc = generateTimetablePDF(timetableData)
      doc.save(`timetable-${selectedSession.program?.title}-${selectedSession.level}L.pdf`)
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

          {timetableEntries.length === 0 && getStudentOnlineClasses().length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No classes scheduled yet</p>
            </div>
          ) : (
            <div className="space-y-6">
              {DAYS.map((day) => {
                const dayEntries = entriesByDay[day] || []
                const dayOnlineClasses = getStudentOnlineClasses().filter(oc => oc.day_of_week === day)
                
                if (dayEntries.length === 0 && dayOnlineClasses.length === 0) return null

                return (
                  <div key={day}>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      {day}
                    </h3>
                    <div className="space-y-2">
                      {/* Timetable Entries */}
                      {dayEntries.map((entry) => (
                        <div key={entry.id} className="flex items-center justify-between p-4 rounded-lg border bg-slate-50 dark:bg-slate-800/50">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <span className="font-medium">{entry.start_time.substring(0, 5)} - {entry.end_time.substring(0, 5)}</span>
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
                            Physical
                          </Badge>
                        </div>
                      ))}
                      
                      {/* Online Classes */}
                      {dayOnlineClasses.map((onlineClass) => (
                        <div key={onlineClass.id} className="flex items-center justify-between p-4 rounded-lg border bg-blue-50 dark:bg-blue-900/20">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Video className="h-4 w-4 text-blue-600" />
                              <span className="font-medium">{onlineClass.start_time.substring(0, 5)} - {onlineClass.end_time.substring(0, 5)}</span>
                            </div>
                            <div className="h-8 w-px bg-border" />
                            <div>
                              <p className="font-semibold">{onlineClass.course?.code} - {onlineClass.course?.title}</p>
                              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                {onlineClass.class_date && (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    <span>{new Date(onlineClass.class_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                  </div>
                                )}
                                <a 
                                  href={onlineClass.meet_link} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-blue-600 hover:underline"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  {onlineClass.meet_link_display_name || 'Join Meeting'}
                                </a>
                              </div>
                              {onlineClass.notes && (
                                <p className="text-xs text-muted-foreground mt-1 italic">{onlineClass.notes}</p>
                              )}
                            </div>
                          </div>
                          <Badge variant="outline" className="hidden sm:inline-flex bg-blue-100 text-blue-800 border-blue-200">
                            Online
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
