'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Edit, Trash2, Clock, Calendar, Download, Loader2, PlusCircle, MapPin, User } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

type TimetableSession = {
  id: string
  session_id: string
  semester_id: string
  program_id: string
  level: string
  title?: string
  description?: string
  is_active: boolean
  session?: { name: string }
  sem_info?: { semester_name: string }
  program?: { title: string }
  entries?: TimetableEntry[]
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
  notes?: string
  course?: { code: string; title: string }
  lecturer?: { first_name: string; last_name: string }
}

type Course = {
  id: string
  code: string
  title: string
  level: string
  semester: number
}

type Lecturer = {
  id: string
  first_name: string
  last_name: string
}

type Program = {
  id: string
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

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const LEVELS = ['100', '200', '300', '400', '500']

export default function AdminTimetablePage() {
  const [timetableSessions, setTimetableSessions] = useState<TimetableSession[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [lecturers, setLecturers] = useState<Lecturer[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  const [sessions, setSessions] = useState<AcademicSession[]>([])
  const [semesters, setSemesters] = useState<AcademicSemester[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false)
  const [selectedTimetable, setSelectedTimetable] = useState<TimetableSession | null>(null)
  const [selectedDay, setSelectedDay] = useState<string>('Monday')
  const [isLoadingEntryData, setIsLoadingEntryData] = useState(false)
  const supabase = createClient()

  const [formData, setFormData] = useState({
    session_id: '',
    semester_id: '',
    program_id: '',
    level: '100',
    title: '',
    description: ''
  })

  const [entryFormData, setEntryFormData] = useState({
    course_id: '',
    day_of_week: 'Monday',
    start_time: '',
    end_time: '',
    venue: '',
    lecturer_id: '',
    notes: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  // Load courses when selected timetable changes
  useEffect(() => {
    if (selectedTimetable?.program_id && selectedTimetable?.level) {
      loadCourses(selectedTimetable.program_id, selectedTimetable.level)
    }
  }, [selectedTimetable?.id])

  const loadData = async () => {
    setLoading(true)
    try {
      const [sessionsRes, semestersRes, programsRes, timetableRes, lecturersRes] = await Promise.all([
        supabase.from('academic_sessions').select('*').order('name'),
        supabase.from('academic_semesters').select('*').order('semester_name'),
        supabase.from('programs').select('*').eq('is_active', true),
        supabase.from('timetable_sessions').select('*, session:academic_sessions(name), sem_info:academic_semesters(semester_name), program:programs(title)').order('created_at', { ascending: false }),
        supabase.from('profiles').select('id, first_name, last_name').eq('role', 'lecturer')
      ])

      setSessions(sessionsRes.data || [])
      setSemesters(semestersRes.data || [])
      setPrograms(programsRes.data || [])
      setTimetableSessions(timetableRes.data || [])
      setLecturers(lecturersRes.data || [])
    } catch (error) {
      console.error('Failed to load data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const loadCourses = async (programId: string, level: string) => {
    try {
      const { data } = await supabase.from('courses').select('*').eq('program_id', programId).eq('level', level)
      setCourses(data || [])
    } catch (error) {
      console.error('Failed to load courses:', error)
    }
  }

  const loadLecturers = async () => {
    try {
      const { data } = await supabase.from('profiles').select('id, first_name, last_name').eq('role', 'lecturer')
      setLecturers(data || [])
    } catch (error) {
      console.error('Failed to load lecturers:', error)
    }
  }

  const handleCreateTimetable = async () => {
    if (!formData.session_id || !formData.semester_id || !formData.program_id) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const { data, error } = await supabase.from('timetable_sessions').insert({
        session_id: formData.session_id,
        semester_id: formData.semester_id,
        program_id: formData.program_id,
        level: formData.level,
        title: formData.title,
        description: formData.description,
        created_by: user?.id
      }).select().single()

      if (error) throw error

      toast.success('Timetable created successfully')
      setIsCreateModalOpen(false)
      resetForm()
      
      // Create the new timetable object immediately with all related data
      const newTimetable: TimetableSession = {
        ...data,
        session: sessions.find(s => s.id === data.session_id),
        sem_info: semesters.find(sem => sem.id === data.semester_id),
        program: programs.find(p => p.id === data.program_id),
        entries: []
      }
      
      // Add to state immediately so it shows up in the list
      setTimetableSessions(prev => [newTimetable, ...prev])
      
      // Select the newly created timetable
      setSelectedTimetable(newTimetable)
      await loadTimetableEntries(newTimetable.id)
      await loadLecturers()
      if (newTimetable.program_id && newTimetable.level) {
        await loadCourses(newTimetable.program_id, newTimetable.level)
      }
      // Open the entry modal to add entries
      setIsEntryModalOpen(true)
    } catch (error) {
      console.error('Failed to create timetable:', error)
      toast.error('Failed to create timetable')
    }
  }

  const handleAddEntry = async () => {
    if (!selectedTimetable || !entryFormData.course_id || !entryFormData.start_time || !entryFormData.end_time) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const { error } = await supabase.from('timetable_entries').insert({
        timetable_session_id: selectedTimetable.id,
        course_id: entryFormData.course_id,
        day_of_week: entryFormData.day_of_week,
        start_time: entryFormData.start_time,
        end_time: entryFormData.end_time,
        venue: entryFormData.venue,
        lecturer_id: entryFormData.lecturer_id,
        notes: entryFormData.notes
      })

      if (error) throw error

      toast.success('Entry added successfully')
      setIsEntryModalOpen(false)
      resetEntryForm()
      loadTimetableEntries(selectedTimetable.id)
    } catch (error) {
      console.error('Failed to add entry:', error)
      toast.error('Failed to add entry')
    }
  }

  const loadTimetableEntries = async (timetableId: string) => {
    try {
      const { data } = await supabase
        .from('timetable_entries')
        .select('*, course:courses(code, title), lecturer:profiles(first_name, last_name)')
        .eq('timetable_session_id', timetableId)
        .order('day_of_week, start_time')

      setTimetableSessions(prev =>
        prev.map(ts =>
          ts.id === timetableId ? { ...ts, entries: data || [] } : ts
        )
      )
    } catch (error) {
      console.error('Failed to load entries:', error)
    }
  }

  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return

    try {
      const { error } = await supabase.from('timetable_entries').delete().eq('id', entryId)
      if (error) throw error

      toast.success('Entry deleted successfully')
      if (selectedTimetable) {
        loadTimetableEntries(selectedTimetable.id)
      }
    } catch (error) {
      console.error('Failed to delete entry:', error)
      toast.error('Failed to delete entry')
    }
  }

  const resetForm = () => {
    setFormData({
      session_id: '',
      semester_id: '',
      program_id: '',
      level: '100',
      title: '',
      description: ''
    })
  }

  const resetEntryForm = () => {
    setEntryFormData({
      course_id: '',
      day_of_week: 'Monday',
      start_time: '',
      end_time: '',
      venue: '',
      lecturer_id: '',
      notes: ''
    })
  }

  const handleProgramChange = (programId: string) => {
    setFormData({ ...formData, program_id: programId })
    loadCourses(programId, formData.level)
  }

  const handleLevelChange = (level: string) => {
    setFormData({ ...formData, level })
    if (formData.program_id) {
      loadCourses(formData.program_id, level)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Timetable Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create and manage weekly class schedules</p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 border border-primary hover:text-blue-600">
              <Plus className="h-4 w-4" />
              Create Timetable
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl bg-white dark:bg-slate-950">
            <DialogHeader>
              <DialogTitle>Create New Timetable</DialogTitle>
              <DialogDescription>Create a new timetable session for a specific academic session, semester, program, and level.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Academic Session *</label>
                  <Select value={formData.session_id} onValueChange={(value) => setFormData({ ...formData, session_id: value })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select session" />
                    </SelectTrigger>
                    <SelectContent>
                      {sessions.map((session) => (
                        <SelectItem key={session.id} value={session.id}>{session.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Semester *</label>
                  <Select value={formData.semester_id} onValueChange={(value) => setFormData({ ...formData, semester_id: value })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select semester" />
                    </SelectTrigger>
                    <SelectContent>
                      {semesters.map((semester) => (
                        <SelectItem key={semester.id} value={semester.id}>{semester.semester_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Program *</label>
                  <Select value={formData.program_id} onValueChange={handleProgramChange}>
                    <SelectTrigger className="mt-1 text-xs w-50">
                      <SelectValue placeholder="Select program" />
                    </SelectTrigger>
                    <SelectContent>
                      {programs.map((program) => (
                        <SelectItem key={program.id} value={program.id}>{program.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Level *</label>
                  <Select value={formData.level} onValueChange={handleLevelChange}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LEVELS.map((level) => (
                        <SelectItem key={level} value={level}>{level}L</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  placeholder="e.g., ND1 First Semester Timetable"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Input
                  placeholder="Optional description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTimetable} className="border border-primary hover:text-blue-600">
                  Create Timetable
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {timetableSessions.length === 0 ? (
          <Card className="p-12 text-center">
            <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
            <p className="text-lg text-muted-foreground">No timetables found</p>
            <p className="text-sm text-muted-foreground mt-2">Create a new timetable to get started</p>
          </Card>
        ) : (
          timetableSessions.map((timetable) => (
            <Card key={timetable.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{timetable.title || `${timetable.program?.title} - ${timetable.level}L`}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {timetable.session?.name} · {timetable.sem_info?.semester_name} · {timetable.level}L
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={timetable.is_active ? 'default' : 'secondary'}>
                    {timetable.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  <Dialog open={isEntryModalOpen && selectedTimetable?.id === timetable.id} onOpenChange={async (open) => {
                    setIsEntryModalOpen(open)
                    if (open) {
                      setIsLoadingEntryData(true)
                      setSelectedTimetable(timetable)
                      await loadTimetableEntries(timetable.id)
                      await loadLecturers()
                      if (timetable.program_id && timetable.level) {
                        await loadCourses(timetable.program_id, timetable.level)
                      }
                      setIsLoadingEntryData(false)
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" className="gap-2">
                        <PlusCircle className="h-4 w-4" />
                        Add Entry
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl bg-white dark:bg-slate-950">
                      <DialogHeader>
                        <DialogTitle>Add Timetable Entry</DialogTitle>
                        <DialogDescription>Add a new class session to the timetable with course, day, time, venue, and lecturer details.</DialogDescription>
                      </DialogHeader>
                      {isLoadingEntryData ? (
                        <div className="flex items-center justify-center py-12">
                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium">Course *</label>
                            <Select value={entryFormData.course_id} onValueChange={(value) => setEntryFormData({ ...entryFormData, course_id: value })}>
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select course" />
                              </SelectTrigger>
                              <SelectContent>
                                {courses.map((course) => (
                                  <SelectItem key={course.id} value={course.id}>{course.code} - {course.title}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium">Day *</label>
                              <Select value={entryFormData.day_of_week} onValueChange={(value) => setEntryFormData({ ...entryFormData, day_of_week: value })}>
                                <SelectTrigger className="mt-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {DAYS.map((day) => (
                                    <SelectItem key={day} value={day}>{day}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Lecturer</label>
                              <Select value={entryFormData.lecturer_id} onValueChange={(value) => setEntryFormData({ ...entryFormData, lecturer_id: value })}>
                                <SelectTrigger className="mt-1">
                                  <SelectValue placeholder="Select lecturer" />
                                </SelectTrigger>
                                <SelectContent>
                                  {lecturers.map((lecturer) => (
                                    <SelectItem key={lecturer.id} value={lecturer.id}>{lecturer.first_name} {lecturer.last_name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium">Start Time *</label>
                              <Input
                                type="time"
                                value={entryFormData.start_time}
                                onChange={(e) => setEntryFormData({ ...entryFormData, start_time: e.target.value })}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium">End Time *</label>
                              <Input
                                type="time"
                                value={entryFormData.end_time}
                                onChange={(e) => setEntryFormData({ ...entryFormData, end_time: e.target.value })}
                                className="mt-1"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium">Venue</label>
                            <Input
                              placeholder="e.g., Room 101, Lab A"
                              value={entryFormData.venue}
                              onChange={(e) => setEntryFormData({ ...entryFormData, venue: e.target.value })}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Notes</label>
                            <Input
                              placeholder="Optional notes"
                              value={entryFormData.notes}
                              onChange={(e) => setEntryFormData({ ...entryFormData, notes: e.target.value })}
                              className="mt-1"
                            />
                          </div>
                          <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setIsEntryModalOpen(false)}>
                              Cancel
                            </Button>
                            <Button onClick={handleAddEntry}>
                              Add Entry
                            </Button>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {timetable.entries && timetable.entries.length > 0 ? (
                <div className="space-y-4">
                  {/* Day selector tabs */}
                  <div className="flex flex-wrap gap-2 border-b pb-2">
                    {DAYS.map((day) => {
                      const dayEntries = timetable.entries?.filter(e => e.day_of_week === day) || []
                      return (
                        <Button
                          key={day}
                          size="sm"
                          variant={selectedDay === day ? 'default' : 'outline'}
                          onClick={() => setSelectedDay(day)}
                          className="relative"
                        >
                          {day}
                          {dayEntries.length > 0 && (
                            <span className="ml-2 rounded-full bg-primary/20 px-2 py-0.5 text-xs">
                              {dayEntries.length}
                            </span>
                          )}
                        </Button>
                      )
                    })}
                  </div>

                  {/* Selected day entries */}
                  <div className="space-y-2">
                    {timetable.entries
                      .filter(e => e.day_of_week === selectedDay)
                      .sort((a, b) => a.start_time.localeCompare(b.start_time))
                      .map((entry) => (
                        <div key={entry.id} className="flex items-center justify-between p-4 rounded-lg border bg-slate-50 dark:bg-slate-800/50 hover:shadow-sm transition-shadow">
                          <div className="flex items-center gap-4 flex-1">
                            <div className="flex items-center gap-2 text-sm font-mono text-primary min-w-[140px]">
                              <Clock className="h-4 w-4" />
                              <span>{entry.start_time} - {entry.end_time}</span>
                            </div>
                            <div className="h-8 w-px bg-border" />
                            <div className="flex-1">
                              <p className="font-semibold text-sm">{entry.course?.code} - {entry.course?.title}</p>
                              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                {entry.venue && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {entry.venue}
                                  </span>
                                )}
                                {entry.lecturer && (
                                  <span className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    {entry.lecturer.first_name} {entry.lecturer.last_name}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteEntry(entry.id)}
                              className="hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    
                    {timetable.entries.filter(e => e.day_of_week === selectedDay).length === 0 && (
                      <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                        <p className="text-sm">No classes scheduled for {selectedDay}</p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-3"
                          onClick={() => {
                            setSelectedTimetable(timetable)
                            setEntryFormData({ ...entryFormData, day_of_week: selectedDay })
                            setIsEntryModalOpen(true)
                          }}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Class
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Quick add button at the bottom */}
                  {timetable.entries.filter(e => e.day_of_week === selectedDay).length > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full gap-2"
                      onClick={() => {
                        setSelectedTimetable(timetable)
                        setEntryFormData({ ...entryFormData, day_of_week: selectedDay })
                        setIsEntryModalOpen(true)
                      }}
                    >
                      <Plus className="h-4 w-4" />
                      Add Another Class for {selectedDay}
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">No entries added yet</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-4"
                    onClick={() => {
                      setSelectedTimetable(timetable)
                      setIsEntryModalOpen(true)
                    }}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add First Entry
                  </Button>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
