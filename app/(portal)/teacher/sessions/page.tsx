'use client'

import { useEffect, useState } from 'react'
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
  course_id: string
  session_id: string
  semester_id: string
  exam_title: string
  exam_description: string
  exam_type: string
  duration_minutes: number
  start_date: string
  end_date: string
  instructions: string
  is_published: boolean
  google_meet_link?: string
  google_meet_code?: string
  course?: { id: string; code: string; title: string }
  session?: { id: string; name: string }
  semester?: { id: string; semester_name: string }
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
    course_id: '',
    session_id: '',
    semester_id: '',
    exam_title: '',
    exam_description: '',
    exam_type: 'online_class',
    duration_minutes: 60,
    start_date: '',
    end_date: '',
    instructions: '',
    is_published: true,
    google_meet_link: '',
    google_meet_code: '',
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
      course_id: '',
      session_id: '',
      semester_id: '',
      exam_title: '',
      exam_description: '',
      exam_type: 'online_class',
      duration_minutes: 60,
      start_date: '',
      end_date: '',
      instructions: '',
      is_published: true,
      google_meet_link: '',
      google_meet_code: '',
    })
    setIsEditing(false)
    setSelectedSession(null)
    setDialogOpen(true)
  }

  const startEdit = (session: Session) => {
    setForm({
      course_id: session.course_id,
      session_id: session.session_id,
      semester_id: session.semester_id,
      exam_title: session.exam_title,
      exam_description: session.exam_description,
      exam_type: session.exam_type,
      duration_minutes: session.duration_minutes,
      start_date: session.start_date,
      end_date: session.end_date,
      instructions: session.instructions,
      is_published: session.is_published,
      google_meet_link: session.google_meet_link || '',
      google_meet_code: session.google_meet_code || '',
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
    `${s.course?.code || ''} ${s.course?.title || ''} ${s.session?.name || ''} ${s.exam_title || ''}`.toLowerCase().includes(search.toLowerCase())
  )
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const paged = filtered.slice((page - 1) * perPage, page * perPage)

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Video className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">Online Class Sessions</h1>
        </div>
        <Button onClick={startCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Create Session
        </Button>
      </div>
      
      <Input placeholder="Search sessions..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
      
      <div className="grid gap-4 md:grid-cols-2">
        {paged.map((session) => (
          <Card key={session.id} className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-semibold">{session.exam_title || 'Class Session'}</p>
                <p className="text-sm text-muted-foreground">{session.course?.code} - {session.course?.title}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => startEdit(session)}>
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => confirmDelete(session.id)}>
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarDays className="h-4 w-4" />
                <span>{new Date(session.start_date).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{session.duration_minutes} minutes</span>
              </div>
              {session.google_meet_link && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <LinkIcon className="h-4 w-4" />
                  <a href={session.google_meet_link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    Join Meeting
                  </a>
                </div>
              )}
              {session.google_meet_code && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>Code: {session.google_meet_code}</span>
                </div>
              )}
            </div>
            
            <div className="mt-3 flex items-center gap-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${session.is_published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {session.is_published ? 'Published' : 'Draft'}
              </span>
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
            <DialogTitle>{isEditing ? 'Edit Session' : 'Create New Session'}</DialogTitle>
            <p className="text-sm text-muted-foreground">
              {isEditing ? 'Update the session details below.' : 'Create a new online class session for your students.'}
            </p>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="exam_title">Session Title</Label>
              <Input
                id="exam_title"
                value={form.exam_title}
                onChange={(e) => setForm({ ...form, exam_title: e.target.value })}
                className="rounded-xl"
              />
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="session_id">Academic Session</Label>
                <Select value={form.session_id} onValueChange={(value) => setForm({ ...form, session_id: value })}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select session" />
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
                <Label htmlFor="semester_id">Semester</Label>
                <Select value={form.semester_id} onValueChange={(value) => setForm({ ...form, semester_id: value })}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                  <SelectContent>
                    {semesters.map((semester) => (
                      <SelectItem key={semester.id} value={semester.id}>
                        {semester.semester_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="exam_description">Description</Label>
              <Textarea
                id="exam_description"
                value={form.exam_description}
                onChange={(e) => setForm({ ...form, exam_description: e.target.value })}
                className="rounded-xl"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_date">Start Date & Time</Label>
                <Input
                  id="start_date"
                  type="datetime-local"
                  value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                  className="rounded-xl"
                />
              </div>

              <div>
                <Label htmlFor="end_date">End Date & Time</Label>
                <Input
                  id="end_date"
                  type="datetime-local"
                  value={form.end_date}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="duration_minutes">Duration (minutes)</Label>
              <Input
                id="duration_minutes"
                type="number"
                value={form.duration_minutes}
                onChange={(e) => setForm({ ...form, duration_minutes: parseInt(e.target.value) })}
                className="rounded-xl"
              />
            </div>

            <div>
              <Label htmlFor="google_meet_link">Google Meet Link</Label>
              <Input
                id="google_meet_link"
                type="url"
                value={form.google_meet_link}
                onChange={(e) => setForm({ ...form, google_meet_link: e.target.value })}
                className="rounded-xl"
                placeholder="https://meet.google.com/xxx-xxxx-xxx"
              />
            </div>

            <div>
              <Label htmlFor="google_meet_code">Google Meet Code</Label>
              <Input
                id="google_meet_code"
                value={form.google_meet_code}
                onChange={(e) => setForm({ ...form, google_meet_code: e.target.value })}
                className="rounded-xl"
                placeholder="xxx-xxxx-xxx"
              />
            </div>

            <div>
              <Label htmlFor="instructions">Instructions</Label>
              <Textarea
                id="instructions"
                value={form.instructions}
                onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                className="rounded-xl"
                rows={4}
                placeholder="Add any instructions for students joining the session..."
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_published"
                checked={form.is_published}
                onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
                className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="is_published" className="cursor-pointer">Publish immediately</Label>
            </div>

            <div className="flex gap-3">
              <Button onClick={saveSession} className="flex-1 rounded-xl border border-primary hover:shadow-lg hover:shadow-blue-600">
                <Save className="mr-2 h-4 w-4" />
                Save Session
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
