'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CalendarDays, Clock, MapPin, Plus, Edit2, Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

type TimetableSession = {
  id: string
  title: string
  level: string
  description?: string
  session?: { name: string }
  semester?: { semester_name: string }
  program?: { title: string; department?: { name: string } }
}

type Course = {
  id: string
  code: string
  title: string
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
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const TIME_SLOTS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00']

export default function TimetableSessionPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.sessionId as string

  const [session, setSession] = useState<TimetableSession | null>(null)
  const [entries, setEntries] = useState<TimetableEntry[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    timetable_session_id: sessionId,
    course_id: '',
    day_of_week: '',
    start_time: '',
    end_time: '',
    venue: '',
  })

  useEffect(() => {
    loadData()
  }, [sessionId])

  const loadData = async () => {
    try {
      const [sessionRes, entriesRes, teacherCoursesRes] = await Promise.all([
        fetch(`/api/v1/teacher/timetable-sessions/${sessionId}`),
        fetch(`/api/v1/teacher/timetable?sessionId=${sessionId}`),
        fetch('/api/v1/teacher/courses'),
      ])
      
      const sessionData = await sessionRes.json()
      const entriesData = await entriesRes.json()
      const teacherCoursesData = await teacherCoursesRes.json()
      
      console.log('Session data:', sessionData)
      console.log('Entries data:', entriesData)
      console.log('Teacher courses data:', teacherCoursesData)
      
      setSession(sessionData.data)
      setEntries(entriesData.data || [])
      
      // Filter teacher's courses by session parameters (level and program_id)
      if (sessionData.data && teacherCoursesData.data) {
        const filteredCourses = teacherCoursesData.data.filter((course: any) => {
          const levelMatch = !sessionData.data.level || course.level === sessionData.data.level
          const programMatch = !sessionData.data.program_id || course.program_id === sessionData.data.program_id
          return levelMatch && programMatch
        })
        console.log('Filtered teacher courses:', filteredCourses)
        setCourses(filteredCourses)
      }
    } catch (error) {
      console.error('Failed to load data:', error)
      toast.error('Failed to load timetable data')
    } finally {
      setLoading(false)
    }
  }

  const saveSchedule = async () => {
    setSaving(true)
    try {
      console.log('Saving form data:', form)
      
      // Check for same course duplicate
      const duplicateCourse = entries.find(entry => 
        entry.course_id === form.course_id && 
        entry.id !== editingEntry?.id
      )
      
      if (duplicateCourse) {
        toast.error('This course is already scheduled in this timetable')
        setSaving(false)
        return
      }
      
      // Check for time clashes
      const clash = entries.find(entry => 
        entry.day_of_week === form.day_of_week && 
        entry.id !== editingEntry?.id &&
        ((form.start_time >= entry.start_time && form.start_time < entry.end_time) ||
         (form.end_time > entry.start_time && form.end_time <= entry.end_time) ||
         (form.start_time <= entry.start_time && form.end_time >= entry.end_time))
      )
      
      if (clash) {
        toast.error('Time slot already taken for this day')
        setSaving(false)
        return
      }
      
      const method = editingEntry ? 'PUT' : 'POST'
      const url = editingEntry 
        ? `/api/v1/teacher/timetable/${editingEntry.id}`
        : '/api/v1/teacher/timetable'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      
      const responseData = await res.json()
      console.log('Save response:', responseData)
      
      if (!res.ok) throw new Error(responseData.error || 'Failed to save schedule')
      toast.success(editingEntry ? 'Schedule updated successfully' : 'Schedule added successfully')
      setDialogOpen(false)
      setEditingEntry(null)
      
      // Reload data immediately
      await loadData()
    } catch (error) {
      toast.error('Failed to save schedule')
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  const deleteEntry = async (id: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return
    
    try {
      const res = await fetch(`/api/v1/teacher/timetable/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete entry')
      toast.success('Entry deleted successfully')
      loadData()
    } catch (error) {
      toast.error('Failed to delete entry')
      console.error(error)
    }
  }

  const openEditDialog = (entry: TimetableEntry) => {
    setEditingEntry(entry)
    setForm({
      timetable_session_id: sessionId,
      course_id: entry.course_id,
      day_of_week: entry.day_of_week,
      start_time: entry.start_time,
      end_time: entry.end_time,
      venue: entry.venue || '',
    })
    setDialogOpen(true)
  }

  const openAddDialog = () => {
    setEditingEntry(null)
    setForm({
      timetable_session_id: sessionId,
      course_id: '',
      day_of_week: '',
      start_time: '',
      end_time: '',
      venue: '',
    })
    setDialogOpen(true)
  }

  const getEntryForSlot = (day: string, timeSlot: string) => {
    return entries.find(entry => {
      if (entry.day_of_week !== day) return false
      
      const entryStartHour = parseInt(entry.start_time.split(':')[0])
      const entryEndHour = parseInt(entry.end_time.split(':')[0])
      const slotHour = parseInt(timeSlot.split(':')[0])
      
      // Check if the slot hour is within the entry's time range
      return slotHour >= entryStartHour && slotHour < entryEndHour
    })
  }

  const getTakenTimeSlots = (day: string) => {
    return entries.filter(entry => entry.day_of_week === day)
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading timetable...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-slate-100 dark:from-primary dark:to-primary/20">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <Card className="p-6 bg-white dark:bg-blue-950/10 shadow-lg border-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => router.back()}
                className="hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-primary">
                  {session?.title}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {session?.session?.name} • {session?.semester?.semester_name} • Level {session?.level}
                </p>
              </div>
            </div>
            <Button 
              onClick={openAddDialog}
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-md"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Entry
            </Button>
          </div>
        </Card>

        {/* Timetable Grid */}
        <Card className="p-6 bg-white dark:bg-blue-950/10 shadow-lg border-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="p-2 text-left font-semibold text-xs uppercase tracking-wider text-muted-foreground border-b-2 border-slate-200 dark:border-slate-700 w-16">
                    Time
                  </th>
                  {DAYS_OF_WEEK.map(day => (
                    <th key={day} className="p-2 text-center font-semibold text-xs uppercase tracking-wider text-muted-foreground border-b-2 border-slate-200 dark:border-slate-700 min-w-[100px]">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TIME_SLOTS.map((timeSlot: any) => (
                  <tr key={timeSlot} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="p-2 font-mono text-xs text-muted-foreground border-b border-slate-200 dark:border-slate-700">
                      {timeSlot}
                    </td>
                    {DAYS_OF_WEEK.map(day => {
                      const entry = getEntryForSlot(day, timeSlot)
                      return (
                        <td key={`${day}-${timeSlot}`} className="p-1 border-b border-slate-200 dark:border-slate-700 align-top">
                          {entry ? (
                            <div 
                              className="bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 rounded-lg p-2 border border-primary/20 hover:border-primary/40 transition-all cursor-pointer h-full min-h-[60px] max-w-[180px]"
                              onClick={() => router.push(`/teacher/courses/${entry.course_id}`)}
                            >
                              <div className="flex flex-col gap-1">
                                <p className="text-[8px] text-primary line-clamp-1 font-medium">
                                  {entry.course?.code}
                                </p>
                                <p className="text-[8px] text-muted-foreground line-clamp-1">
                                  {entry.course?.title}
                                </p>
                                {entry.venue && (
                                  <div className="flex items-center gap-1 text-[8px] text-muted-foreground">
                                    <MapPin className="h-2 w-2" />
                                    <span className="line-clamp-1">{entry.venue}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div 
                              className="h-full min-h-[60px] rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer"
                              onClick={openAddDialog}
                            >
                              <Plus className="h-4 w-4 text-muted-foreground/50" />
                            </div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Add/Edit Entry Dialog */}
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setEditingEntry(null)
        }}>
          <DialogContent className="max-w-md bg-white dark:bg-black shadow-2xl">
            <DialogHeader>
              <DialogTitle>{editingEntry ? 'Edit Timetable Entry' : 'Add Timetable Entry'}</DialogTitle>
              <DialogDescription>
                {editingEntry ? 'Update the timetable entry details' : 'Add a new entry to this timetable session'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="course_id">Course</Label>
                <Select value={form.course_id} onValueChange={(value) => setForm({ ...form, course_id: value })}>
                  <SelectTrigger className="bg-slate-50 dark:bg-slate-900">
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
                  <SelectTrigger className="bg-slate-50 dark:bg-slate-900">
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
                    className="bg-slate-50 dark:bg-slate-900"
                  />
                </div>
                <div>
                  <Label htmlFor="end_time">End Time</Label>
                  <Input
                    id="end_time"
                    type="time"
                    value={form.end_time}
                    onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                    className="bg-slate-50 dark:bg-slate-900"
                  />
                </div>
              </div>

              {form.day_of_week && form.start_time && form.end_time && (
                <div className="text-xs text-muted-foreground space-y-1">
                  {entries.filter(entry => 
                    entry.course_id === form.course_id && 
                    entry.id !== editingEntry?.id
                  ).length > 0 && (
                    <p className="text-destructive">⚠️ This course is already scheduled in this timetable</p>
                  )}
                  
                  {getTakenTimeSlots(form.day_of_week).filter(entry => 
                    entry.id !== editingEntry?.id &&
                    ((form.start_time >= entry.start_time && form.start_time < entry.end_time) ||
                     (form.end_time > entry.start_time && form.end_time <= entry.end_time) ||
                     (form.start_time <= entry.start_time && form.end_time >= entry.end_time))
                  ).length > 0 && (
                    <p className="text-destructive">⚠️ This time slot conflicts with existing schedule</p>
                  )}
                  
                  {entries.filter(entry => 
                    entry.id !== editingEntry?.id &&
                    entry.course_id === form.course_id &&
                    entry.day_of_week === form.day_of_week &&
                    ((form.start_time >= entry.start_time && form.start_time < entry.end_time) ||
                     (form.end_time > entry.start_time && form.end_time <= entry.end_time) ||
                     (form.start_time <= entry.start_time && form.end_time >= entry.end_time))
                  ).length === 0 &&
                  entries.filter(entry => 
                    entry.course_id === form.course_id && 
                    entry.id !== editingEntry?.id
                  ).length === 0 &&
                  getTakenTimeSlots(form.day_of_week).filter(entry => 
                    entry.id !== editingEntry?.id &&
                    ((form.start_time >= entry.start_time && form.start_time < entry.end_time) ||
                     (form.end_time > entry.start_time && form.end_time <= entry.end_time) ||
                     (form.start_time <= entry.start_time && form.end_time >= entry.end_time))
                  ).length === 0 && (
                    <p className="text-green-600 dark:text-green-400">✓ Time slot is available</p>
                  )}
                </div>
              )}

              <div>
                <Label htmlFor="venue">Venue</Label>
                <Input
                  id="venue"
                  value={form.venue}
                  onChange={(e) => setForm({ ...form, venue: e.target.value })}
                  placeholder="e.g., Room 101, Lab A"
                  className="bg-slate-50 dark:bg-slate-900"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  onClick={saveSchedule} 
                  disabled={saving} 
                  className="flex-1 bg-gradient-to-r from-primary to-primary/80 border border-primary hover:shadow-lg hover:shadow-blue-600"
                >
                  {saving ? 'Saving...' : (editingEntry ? 'Update Entry' : 'Save Entry')}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false)
                    setEditingEntry(null)
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
