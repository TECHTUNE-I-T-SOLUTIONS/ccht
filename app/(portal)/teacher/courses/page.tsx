'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { useRouter } from 'next/navigation'
import { BookOpen, CalendarDays, Clock, MapPin, Plus, Save, X, Video } from 'lucide-react'
import { toast } from 'sonner'

type Course = {
  id: string
  code: string
  title: string
  level?: string
  semester?: number
  program_id?: string
  program?: {
    id: string
    title: string
    department?: {
      id: string
      name: string
    }
  }
  department_name?: string
}

type TimetableSession = {
  id: string
  title: string
  level: string
  description?: string
  session?: { name: string }
  semester?: { semester_name: string }
  program?: { title: string; department?: { name: string } }
}

type TimetableEntry = {
  id: string
  timetable_session_id: string
  course_id: string
  day_of_week: string
  start_time: string
  end_time: string
  venue?: string
  lecturer_id?: string
  course?: { code: string; title: string }
  timetable_session?: TimetableSession
}

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
  course?: { code: string; title: string }
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function TeacherCoursesPage() {
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [timetableSessions, setTimetableSessions] = useState<TimetableSession[]>([])
  const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>([])
  const [onlineClasses, setOnlineClasses] = useState<OnlineClass[]>([])
  const [selectedSession, setSelectedSession] = useState<TimetableSession | null>(null)
  const [sessionEntries, setSessionEntries] = useState<TimetableEntry[]>([])
  const [search, setSearch] = useState('')
  const [showSessionEntries, setShowSessionEntries] = useState(false)
  const [page, setPage] = useState(1)
  const perPage = 6
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [onlineClassDialogOpen, setOnlineClassDialogOpen] = useState(false)
  const [selectedCourseForOnline, setSelectedCourseForOnline] = useState<Course | null>(null)
  const [onlineClassForm, setOnlineClassForm] = useState({
    course_id: '',
    day_of_week: '',
    start_time: '',
    end_time: '',
    meet_link: '',
    meet_link_display_name: '',
    notes: '',
  })

  const [form, setForm] = useState({
    timetable_session_id: '',
    course_id: '',
    day_of_week: '',
    start_time: '',
    end_time: '',
    venue: '',
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        const [coursesRes, sessionsRes, timetableRes, onlineClassesRes] = await Promise.all([
          fetch('/api/v1/teacher/courses'),
          fetch('/api/v1/teacher/timetable-sessions'),
          fetch('/api/v1/teacher/timetable'),
          fetch('/api/v1/teacher/online-classes'),
        ])
        const coursesData = await coursesRes.json()
        const sessionsData = await sessionsRes.json()
        const timetableData = await timetableRes.json()
        const onlineClassesData = await onlineClassesRes.json()
        
        console.log('Courses data:', coursesData)
        console.log('Sessions data:', sessionsData)
        console.log('Timetable data:', timetableData)
        console.log('Online classes data:', onlineClassesData)
        
        setCourses(coursesData.data || [])
        setTimetableSessions(sessionsData.data || [])
        setTimetableEntries(timetableData.data || [])
        setOnlineClasses(onlineClassesData.data || [])
      } catch (error) {
        console.error('Failed to load data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  useEffect(() => {
    if (selectedSession) {
      loadSessionEntries(selectedSession.id)
      setShowSessionEntries(true)
    }
  }, [selectedSession])

  const filtered = courses.filter((c) => `${c.code || ''} ${c.title || ''}`.toLowerCase().includes(search.toLowerCase()))
  
  // Group courses by department
  const coursesByDepartment = filtered.reduce((acc, course) => {
    const deptName = course.department_name || 'Uncategorized'
    if (!acc[deptName]) {
      acc[deptName] = []
    }
    acc[deptName].push(course)
    return acc
  }, {} as Record<string, Course[]>)
  
  const departmentNames = Object.keys(coursesByDepartment)
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const paged = filtered.slice((page - 1) * perPage, page * perPage)

  const getCourseTimetable = (courseId: string) => {
    return timetableEntries.filter(entry => entry.course_id === courseId)
  }

  const loadSessionEntries = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/v1/teacher/timetable?sessionId=${sessionId}`)
      const data = await res.json()
      setSessionEntries(data.data || [])
    } catch (error) {
      console.error('Failed to load session entries:', error)
    }
  }

  const startAddSchedule = () => {
    setForm({
      timetable_session_id: '',
      course_id: '',
      day_of_week: '',
      start_time: '',
      end_time: '',
      venue: '',
    })
    setDialogOpen(true)
    // Reload courses to ensure they're fresh
    const loadCourses = async () => {
      try {
        const coursesRes = await fetch('/api/v1/teacher/courses')
        const coursesData = await coursesRes.json()
        console.log('Reloaded courses data:', coursesData)
        setCourses(coursesData.data || [])
      } catch (error) {
        console.error('Failed to reload courses:', error)
      }
    }
    loadCourses()
  }

  const saveSchedule = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/v1/teacher/timetable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Failed to save schedule')
      toast.success('Schedule added successfully')
      setDialogOpen(false)
      
      // Reload timetable
      const timetableRes = await fetch('/api/v1/teacher/timetable')
      const timetableData = await timetableRes.json()
      setTimetableEntries(timetableData.data || [])
      
      // Reload session entries if a session is selected
      if (selectedSession) {
        await loadSessionEntries(selectedSession.id)
      }
    } catch (error) {
      toast.error('Failed to save schedule')
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  const openOnlineClassDialog = (course: Course) => {
    setSelectedCourseForOnline(course)
    setOnlineClassForm({
      course_id: course.id,
      day_of_week: '',
      start_time: '',
      end_time: '',
      meet_link: '',
      meet_link_display_name: '',
      notes: '',
    })
    setOnlineClassDialogOpen(true)
  }

  const saveOnlineClass = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/v1/teacher/online-classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(onlineClassForm),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to save online class')
      toast.success('Online class scheduled successfully')
      setOnlineClassDialogOpen(false)
      setSelectedCourseForOnline(null)
      
      // Reload online classes
      const onlineClassesRes = await fetch('/api/v1/teacher/online-classes')
      const onlineClassesData = await onlineClassesRes.json()
      setOnlineClasses(onlineClassesData.data || [])
    } catch (error) {
      toast.error('Failed to save online class')
    } finally {
      setSaving(false)
    }
  }

  const deleteOnlineClass = async (id: string) => {
    if (!confirm('Are you sure you want to delete this online class?')) return
    try {
      const res = await fetch(`/api/v1/teacher/online-classes/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      toast.success('Online class deleted')
      
      // Reload online classes
      const onlineClassesRes = await fetch('/api/v1/teacher/online-classes')
      const onlineClassesData = await onlineClassesRes.json()
      setOnlineClasses(onlineClassesData.data || [])
    } catch (error) {
      toast.error('Failed to delete online class')
    }
  }

  const getCourseOnlineClasses = (courseId: string) => {
    return onlineClasses.filter(oc => oc.course_id === courseId)
  }

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">My Classes</h1>
        </div>
        <Button onClick={startAddSchedule}>
          <Plus className="mr-2 h-4 w-4" />
          Add Schedule
        </Button>
      </div>
      
      <Input placeholder="Search courses..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
      
      {/* Timetable Sessions */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Timetable Sessions</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {timetableSessions.map((session) => (
            <Card 
              key={session.id} 
              className={`p-5 cursor-pointer transition-colors ${
                selectedSession?.id === session.id ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
              }`}
              onClick={() => {
                router.push(`/teacher/timetable/${session.id}`)
              }}
            >
              <div className="mb-3">
                <p className="font-semibold">{session.title}</p>
                <p className="text-sm text-muted-foreground">Level {session.level}</p>
                {session.session && <p className="text-xs text-muted-foreground">{session.session.name}</p>}
                {session.semester && <p className="text-xs text-muted-foreground">{session.semester.semester_name}</p>}
                {session.program && <p className="text-xs text-muted-foreground">{session.program.title}</p>}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Online Classes Summary */}
      {onlineClasses.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Scheduled Online Classes</h2>
          <Card className="p-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {onlineClasses.map((onlineClass) => (
                <Card key={onlineClass.id} className="p-4">
                  <div className="flex items-start gap-2">
                    <Video className="h-4 w-4 text-primary mt-1" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{onlineClass.course?.code} - {onlineClass.course?.title}</p>
                      <p className="text-xs text-muted-foreground">{onlineClass.day_of_week}</p>
                      <p className="text-xs text-muted-foreground">{onlineClass.start_time.substring(0, 5)} - {onlineClass.end_time.substring(0, 5)}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* My Courses */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">My Assigned Courses</h2>
        
        {departmentNames.length > 0 ? (
          departmentNames.map((deptName) => (
            <div key={deptName} className="space-y-4">
              <h3 className="text-lg font-semibold text-primary">{deptName}</h3>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {coursesByDepartment[deptName].map((course) => {
                  const courseTimetable = getCourseTimetable(course.id)
                  const courseOnlineClasses = getCourseOnlineClasses(course.id)
                  return (
                    <Card 
                      key={course.id} 
                      className="p-5 cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => router.push(`/teacher/courses/${course.id}`)}
                    >
                      <div className="mb-3">
                        <p className="font-semibold">{course.code}</p>
                        <p className="text-sm text-muted-foreground">{course.title}</p>
                        {course.level && <p className="text-xs text-muted-foreground mt-1">Level {course.level}</p>}
                      </div>
                      
                      {courseOnlineClasses.length > 0 && (
                        <div className="flex items-center gap-2 text-xs text-primary">
                          <Video className="h-3 w-3" />
                          <span>{courseOnlineClasses.length} online class{courseOnlineClasses.length !== 1 ? 'es' : ''} scheduled</span>
                        </div>
                      )}
                      
                      <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                        <Button size="sm" variant="outline" onClick={() => openOnlineClassDialog(course)} className="flex-1">
                          <Video className="mr-2 h-3 w-3" />
                          Add Online Class
                        </Button>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {paged.map((course) => {
              const courseTimetable = getCourseTimetable(course.id)
              const courseOnlineClasses = getCourseOnlineClasses(course.id)
              return (
                <Card 
                  key={course.id} 
                  className="p-5 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => router.push(`/teacher/courses/${course.id}`)}
                >
                  <div className="mb-3">
                    <p className="font-semibold">{course.code}</p>
                    <p className="text-sm text-muted-foreground">{course.title}</p>
                    {course.level && <p className="text-xs text-muted-foreground mt-1">Level {course.level}</p>}
                  </div>
                  
                  {courseOnlineClasses.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-primary">
                      <Video className="h-3 w-3" />
                      <span>{courseOnlineClasses.length} online class{courseOnlineClasses.length !== 1 ? 'es' : ''} scheduled</span>
                    </div>
                  )}
                  
                  {courseTimetable.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-xs font-semibold text-muted-foreground mb-2">Schedule:</p>
                      {courseTimetable.slice(0, 2).map((entry) => (
                        <div key={entry.id} className="flex items-start gap-2 text-xs mb-1">
                          <CalendarDays className="h-3 w-3 mt-0.5 text-primary" />
                          <div>
                            <p className="font-medium">{entry.day_of_week}</p>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>{entry.start_time.substring(0, 5)} - {entry.end_time.substring(0, 5)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                      {courseTimetable.length > 2 && (
                        <p className="text-xs text-muted-foreground">+{courseTimetable.length - 2} more</p>
                      )}
                    </div>
                  )}
                  
                  <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                    <Button size="sm" variant="outline" onClick={() => openOnlineClassDialog(course)} className="flex-1">
                      <Video className="mr-2 h-3 w-3" />
                      Add Online Class
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
      
      <div className="flex items-center justify-between">
        <Button variant="outline" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</Button>
        <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
        <Button variant="outline" disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</Button>
      </div>

      {/* Add Schedule Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-black">
          <DialogHeader>
            <DialogTitle>Add Class Schedule</DialogTitle>
            <DialogDescription>
              Add a new schedule for your class
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="timetable_session_id">Timetable Session</Label>
              <Select value={form.timetable_session_id} onValueChange={(value) => setForm({ ...form, timetable_session_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a session" />
                </SelectTrigger>
                <SelectContent>
                  {timetableSessions.map((session) => (
                    <SelectItem key={session.id} value={session.id}>
                      {session.title} - Level {session.level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="course_id">Course</Label>
              <Select value={form.course_id} onValueChange={(value) => setForm({ ...form, course_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.code} - {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="day_of_week">Day</Label>
              <Select value={form.day_of_week} onValueChange={(value) => setForm({ ...form, day_of_week: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.map((day) => (
                    <SelectItem key={day} value={day}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_time">Start Time</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={form.start_time}
                  onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="end_time">End Time</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={form.end_time}
                  onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="venue">Venue</Label>
              <Input
                id="venue"
                value={form.venue}
                onChange={(e) => setForm({ ...form, venue: e.target.value })}
                placeholder="e.g., Room 101, Lab A"
              />
            </div>

            <div className="flex gap-3">
              <Button onClick={saveSchedule} disabled={saving} className="flex-1">
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Saving...' : 'Save Schedule'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Online Class Dialog */}
      <Dialog open={onlineClassDialogOpen} onOpenChange={setOnlineClassDialogOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-black">
          <DialogHeader>
            <DialogTitle>Schedule Online Class</DialogTitle>
            <DialogDescription>
              Schedule an online class for {selectedCourseForOnline?.code} - {selectedCourseForOnline?.title}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="day_of_week">Day of Week</Label>
              <Select value={onlineClassForm.day_of_week} onValueChange={(value) => setOnlineClassForm({ ...onlineClassForm, day_of_week: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a day" />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.map((day) => (
                    <SelectItem key={day} value={day}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_time">Start Time</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={onlineClassForm.start_time}
                  onChange={(e) => setOnlineClassForm({ ...onlineClassForm, start_time: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="end_time">End Time</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={onlineClassForm.end_time}
                  onChange={(e) => setOnlineClassForm({ ...onlineClassForm, end_time: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="meet_link">Google Meet Link</Label>
              <Input
                id="meet_link"
                value={onlineClassForm.meet_link}
                onChange={(e) => setOnlineClassForm({ ...onlineClassForm, meet_link: e.target.value })}
                placeholder="https://meet.google.com/..."
              />
            </div>

            <div>
              <Label htmlFor="meet_link_display_name">Link Display Name (Optional)</Label>
              <Input
                id="meet_link_display_name"
                value={onlineClassForm.meet_link_display_name}
                onChange={(e) => setOnlineClassForm({ ...onlineClassForm, meet_link_display_name: e.target.value })}
                placeholder="e.g., Join Meeting"
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={onlineClassForm.notes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setOnlineClassForm({ ...onlineClassForm, notes: e.target.value })}
                placeholder="Any additional notes for students..."
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <Button onClick={saveOnlineClass} disabled={saving} className="flex-1">
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Saving...' : 'Save Online Class'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setOnlineClassDialogOpen(false)}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
