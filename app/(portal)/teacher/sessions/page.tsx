'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Video, Plus, Edit2, Trash2, Save, X, CalendarDays, Clock, MapPin, Link as LinkIcon } from 'lucide-react'
import { toast } from 'sonner'

type Session = {
  id: string
  timetable_session_id: string
  course_id: string
  day_of_week: string
  start_time: string
  end_time: string
  venue?: string
  lecturer_id: string
  notes?: string
  timetable_session?: {
    id: string
    title: string
    level: number
    session?: { id: string; name: string }
    semester?: { id: string; semester_name: string }
    program?: { id: string; title: string }
  }
  course?: { id: string; code: string; title: string; level?: number; semester?: number }
}

type Course = {
  id: string
  code: string
  title: string
}

type AcademicSession = {
  id: string
  name: string
}

type AcademicSemester = {
  id: string
  semester_name: string
}

export default function TeacherSessionsPage() {
  const router = useRouter()
  const [sessions, setSessions] = useState<Session[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [academicSessions, setAcademicSessions] = useState<AcademicSession[]>([])
  const [semesters, setSemesters] = useState<AcademicSemester[]>([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const perPage = 6
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  const [form, setForm] = useState({
    timetable_session_id: '',
    course_id: '',
    day_of_week: '',
    start_time: '',
    end_time: '',
    venue: '',
    notes: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [sessionsRes, coursesRes, sessionsListRes, semestersRes] = await Promise.all([
        fetch('/api/v1/teacher/sessions'),
        fetch('/api/v1/teacher/courses'),
        fetch('/api/v1/admin/academic-sessions'),
        fetch('/api/v1/admin/academic-semesters'),
      ])
      const sessionsData = await sessionsRes.json()
      const coursesData = await coursesRes.json()
      const sessionsListData = await sessionsListRes.json()
      const semestersData = await semestersRes.json()

      setSessions(sessionsData.data || [])
      setCourses(coursesData.data || [])
      setAcademicSessions(sessionsListData.data || [])
      setSemesters(semestersData.data || [])
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const startCreate = () => {
    setForm({
      timetable_session_id: '',
      course_id: '',
      day_of_week: '',
      start_time: '',
      end_time: '',
      venue: '',
      notes: '',
    })
    setIsEditing(false)
    setSelectedSession(null)
    setDialogOpen(true)
  }

  const startEdit = (session: Session) => {
    setForm({
      timetable_session_id: session.timetable_session_id,
      course_id: session.course_id,
      day_of_week: session.day_of_week,
      start_time: session.start_time,
      end_time: session.end_time,
      venue: session.venue || '',
      notes: session.notes || '',
    })
    setIsEditing(true)
    setSelectedSession(session)
    setDialogOpen(true)
  }

  const saveSession = async () => {
    try {
      const method = isEditing ? 'PUT' : 'POST'
      const url = isEditing ? `/api/v1/teacher/sessions/${selectedSession?.id}` : '/api/v1/teacher/sessions'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!res.ok) throw new Error('Failed to save session')
      
      toast.success(isEditing ? 'Session updated' : 'Session created')
      setDialogOpen(false)
      loadData()
    } catch (error) {
      toast.error('Failed to save session')
      console.error(error)
    }
  }

  const confirmDelete = (id: string) => {
    setSessionToDelete(id)
    setDeleteDialogOpen(true)
  }

  const deleteSession = async () => {
    try {
      const res = await fetch(`/api/v1/teacher/sessions/${sessionToDelete}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete session')
      toast.success('Session deleted')
      setDeleteDialogOpen(false)
      loadData()
    } catch (error) {
      toast.error('Failed to delete session')
      console.error(error)
    }
  }

  const filtered = sessions.filter((s) => 
    `${s.course?.code || ''} ${s.course?.title || ''} ${s.timetable_session?.title || ''} ${s.day_of_week || ''}`.toLowerCase().includes(search.toLowerCase())
  )
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const paged = filtered.slice((page - 1) * perPage, page * perPage)

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Video className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">Timetable Sessions</h1>
        </div>
        <Button onClick={startCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Entry
        </Button>
      </div>
      
      <Input placeholder="Search timetable entries..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
      
      <div className="grid gap-4 md:grid-cols-2">
        {paged.map((session) => (
          <Card 
            key={session.id} 
            className="p-5 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push(`/teacher/sessions/${session.id}`)}
          >
            <div className="mb-3">
              <p className="font-semibold">{session.timetable_session?.title || 'Class Session'}</p>
              <p className="text-sm text-muted-foreground">{session.course?.code} - {session.course?.title}</p>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarDays className="h-4 w-4" />
                <span>{session.day_of_week}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{session.start_time.substring(0, 5)} - {session.end_time.substring(0, 5)}</span>
              </div>
              {session.venue && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{session.venue}</span>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
      
      <div className="flex items-center justify-between">
        <Button variant="outline" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</Button>
        <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
        <Button variant="outline" disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</Button>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-black">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Timetable Entry' : 'Add Timetable Entry'}</DialogTitle>
            <p className="text-sm text-muted-foreground">
              {isEditing ? 'Update the timetable entry details below.' : 'Add a new timetable entry for your class.'}
            </p>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="timetable_session_id">Timetable Session</Label>
              <Select value={form.timetable_session_id} onValueChange={(value) => setForm({ ...form, timetable_session_id: value })}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select a session" />
                </SelectTrigger>
                <SelectContent>
                  {academicSessions.map((session) => (
                    <SelectItem key={session.id} value={session.id}>
                      {session.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="course_id">Course</Label>
              <Select value={form.course_id} onValueChange={(value) => setForm({ ...form, course_id: value })}>
                <SelectTrigger className="rounded-xl">
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
              <Label htmlFor="day_of_week">Day of Week</Label>
              <Select value={form.day_of_week} onValueChange={(value) => setForm({ ...form, day_of_week: value })}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select a day" />
                </SelectTrigger>
                <SelectContent>
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
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
                  className="rounded-xl"
                />
              </div>

              <div>
                <Label htmlFor="end_time">End Time</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={form.end_time}
                  onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="venue">Venue</Label>
              <Input
                id="venue"
                value={form.venue}
                onChange={(e) => setForm({ ...form, venue: e.target.value })}
                className="rounded-xl"
                placeholder="e.g., Room 101, Lab A"
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="rounded-xl"
                rows={3}
                placeholder="Any additional notes..."
              />
            </div>

            <div className="flex gap-3">
              <Button onClick={saveSession} className="flex-1 rounded-xl border border-primary hover:shadow-lg hover:shadow-blue-600">
                <Save className="mr-2 h-4 w-4" />
                Save Entry
              </Button>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="rounded-xl"
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="border-border bg-white text-foreground dark:bg-slate-950">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Session?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this session. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={deleteSession}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
