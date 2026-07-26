'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { ArrowLeft, Video, CalendarDays, Clock, MapPin, Plus, Save, X, Edit2, ExternalLink } from 'lucide-react'
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

export default function TeacherCourseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.courseId as string
  
  const [course, setCourse] = useState<Course | null>(null)
  const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>([])
  const [onlineClasses, setOnlineClasses] = useState<OnlineClass[]>([])
  const [loading, setLoading] = useState(true)
  const [onlineClassDialogOpen, setOnlineClassDialogOpen] = useState(false)
  const [editingOnlineClass, setEditingOnlineClass] = useState<OnlineClass | null>(null)
  const [saving, setSaving] = useState(false)
  
  const [onlineClassForm, setOnlineClassForm] = useState({
    course_id: courseId,
    day_of_week: '',
    start_time: '',
    end_time: '',
    meet_link: '',
    meet_link_display_name: '',
    notes: '',
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        const [coursesRes, timetableRes, onlineClassesRes] = await Promise.all([
          fetch('/api/v1/teacher/courses'),
          fetch('/api/v1/teacher/timetable'),
          fetch('/api/v1/teacher/online-classes'),
        ])
        
        const coursesData = await coursesRes.json()
        const timetableData = await timetableRes.json()
        const onlineClassesData = await onlineClassesRes.json()
        
        const foundCourse = coursesData.data?.find((c: Course) => c.id === courseId)
        setCourse(foundCourse || null)
        
        const courseTimetable = timetableData.data?.filter((e: TimetableEntry) => e.course_id === courseId) || []
        setTimetableEntries(courseTimetable)
        
        const courseOnlineClasses = onlineClassesData.data?.filter((oc: OnlineClass) => oc.course_id === courseId) || []
        setOnlineClasses(courseOnlineClasses)
      } catch (error) {
        console.error('Failed to load data:', error)
        toast.error('Failed to load course data')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [courseId])

  const openAddOnlineClassDialog = () => {
    setEditingOnlineClass(null)
    setOnlineClassForm({
      course_id: courseId,
      day_of_week: '',
      start_time: '',
      end_time: '',
      meet_link: '',
      meet_link_display_name: '',
      notes: '',
    })
    setOnlineClassDialogOpen(true)
  }

  const openEditOnlineClassDialog = (onlineClass: OnlineClass) => {
    setEditingOnlineClass(onlineClass)
    setOnlineClassForm({
      course_id: courseId,
      day_of_week: onlineClass.day_of_week,
      start_time: onlineClass.start_time,
      end_time: onlineClass.end_time,
      meet_link: onlineClass.meet_link,
      meet_link_display_name: onlineClass.meet_link_display_name || '',
      notes: onlineClass.notes || '',
    })
    setOnlineClassDialogOpen(true)
  }

  const saveOnlineClass = async () => {
    setSaving(true)
    try {
      const method = editingOnlineClass ? 'PUT' : 'POST'
      const url = editingOnlineClass 
        ? `/api/v1/teacher/online-classes/${editingOnlineClass.id}`
        : '/api/v1/teacher/online-classes'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(onlineClassForm),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to save online class')
      toast.success(editingOnlineClass ? 'Online class updated successfully' : 'Online class scheduled successfully')
      setOnlineClassDialogOpen(false)
      setEditingOnlineClass(null)
      
      // Reload online classes
      const onlineClassesRes = await fetch('/api/v1/teacher/online-classes')
      const onlineClassesData = await onlineClassesRes.json()
      const courseOnlineClasses = onlineClassesData.data?.filter((oc: OnlineClass) => oc.course_id === courseId) || []
      setOnlineClasses(courseOnlineClasses)
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
      const courseOnlineClasses = onlineClassesData.data?.filter((oc: OnlineClass) => oc.course_id === courseId) || []
      setOnlineClasses(courseOnlineClasses)
    } catch (error) {
      toast.error('Failed to delete online class')
    }
  }

  if (loading) return <div className="p-8">Loading course details...</div>
  if (!course) return <div className="p-8">Course not found</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{course.code} - {course.title}</h1>
          <p className="text-sm text-muted-foreground">
            Level {course.level} • Semester {course.semester} • {course.program?.title}
          </p>
        </div>
      </div>

      {/* Timetable Schedule */}
      {timetableEntries.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Physical Class Schedule</h2>
          <Card className="p-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {timetableEntries.map((entry) => (
                <Card key={entry.id} className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <CalendarDays className="h-4 w-4 text-primary" />
                      <span className="font-medium">{entry.day_of_week}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{entry.start_time.substring(0, 5)} - {entry.end_time.substring(0, 5)}</span>
                    </div>
                    {entry.venue && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{entry.venue}</span>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Online Classes */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Online Classes</h2>
          <Button onClick={openAddOnlineClassDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add Online Class
          </Button>
        </div>
        
        {onlineClasses.length === 0 ? (
          <Card className="p-8">
            <p className="text-center text-muted-foreground">No online classes scheduled yet</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {onlineClasses.map((onlineClass) => (
              <Card key={onlineClass.id} className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Video className="h-4 w-4 text-primary" />
                      <p className="font-semibold">{onlineClass.day_of_week}</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Clock className="h-4 w-4" />
                      <span>{onlineClass.start_time.substring(0, 5)} - {onlineClass.end_time.substring(0, 5)}</span>
                    </div>
                    <a 
                      href={onlineClass.meet_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-sm flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      {onlineClass.meet_link_display_name || 'Join Meeting'}
                    </a>
                    {onlineClass.notes && (
                      <p className="text-xs text-muted-foreground mt-2 italic">{onlineClass.notes}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEditOnlineClassDialog(onlineClass)}>
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => deleteOnlineClass(onlineClass.id)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Online Class Dialog */}
      <Dialog open={onlineClassDialogOpen} onOpenChange={setOnlineClassDialogOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-black" aria-describedby="online-class-dialog-description">
          <DialogHeader>
            <DialogTitle>{editingOnlineClass ? 'Edit Online Class' : 'Schedule Online Class'}</DialogTitle>
            <DialogDescription id="online-class-dialog-description">
              {editingOnlineClass ? 'Update the online class details' : `Schedule an online class for ${course.code} - ${course.title}`}
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
                {saving ? 'Saving...' : (editingOnlineClass ? 'Update' : 'Save Online Class')}
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
