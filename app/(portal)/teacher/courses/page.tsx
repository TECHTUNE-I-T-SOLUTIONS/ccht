'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { BookOpen, CalendarDays, Clock, MapPin, Plus, Save, X } from 'lucide-react'
import { toast } from 'sonner'

type Course = {
  id: string
  code: string
  title: string
  level?: string
  semester?: number
}

type TimetableEntry = {
  id: string
  course_id: string
  day_of_week: string
  start_time: string
  end_time: string
  venue?: string
  course?: { code: string; title: string }
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function TeacherCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const perPage = 6
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    course_id: '',
    day_of_week: '',
    start_time: '',
    end_time: '',
    venue: '',
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        const [coursesRes, timetableRes] = await Promise.all([
          fetch('/api/v1/teacher/courses'),
          fetch('/api/v1/teacher/timetable'),
        ])
        const coursesData = await coursesRes.json()
        const timetableData = await timetableRes.json()
        
        setCourses(coursesData.data || [])
        setTimetableEntries(timetableData.data || [])
      } catch (error) {
        console.error('Failed to load data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const filtered = courses.filter((c) => `${c.code || ''} ${c.title || ''}`.toLowerCase().includes(search.toLowerCase()))
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const paged = filtered.slice((page - 1) * perPage, page * perPage)

  const getCourseTimetable = (courseId: string) => {
    return timetableEntries.filter(entry => entry.course_id === courseId)
  }

  const startAddSchedule = () => {
    setForm({
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
    } catch (error) {
      toast.error('Failed to save schedule')
      console.error(error)
    } finally {
      setSaving(false)
    }
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
      
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {paged.map((course) => {
          const courseTimetable = getCourseTimetable(course.id)
          return (
            <Card key={course.id} className="p-5">
              <div className="mb-3">
                <p className="font-semibold">{course.code}</p>
                <p className="text-sm text-muted-foreground">{course.title}</p>
                {course.level && <p className="text-xs text-muted-foreground mt-1">Level {course.level}</p>}
              </div>
              
              {courseTimetable.length > 0 ? (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Schedule:</p>
                  {courseTimetable.map((entry) => (
                    <div key={entry.id} className="flex items-start gap-2 text-xs mb-2">
                      <CalendarDays className="h-3 w-3 mt-0.5 text-primary" />
                      <div>
                        <p className="font-medium">{entry.day_of_week}</p>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{entry.start_time} - {entry.end_time}</span>
                        </div>
                        {entry.venue && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span>{entry.venue}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground mt-4 italic">No schedule assigned</p>
              )}
            </Card>
          )
        })}
      </div>
      
      <div className="flex items-center justify-between">
        <Button variant="outline" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</Button>
        <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
        <Button variant="outline" disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</Button>
      </div>

      {/* Add Schedule Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-black" aria-describedby="schedule-dialog-description">
          <DialogHeader>
            <DialogTitle>Add Class Schedule</DialogTitle>
            <p id="schedule-dialog-description" className="text-sm text-muted-foreground">
              Add a new schedule for your class
            </p>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
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
    </div>
  )
}
