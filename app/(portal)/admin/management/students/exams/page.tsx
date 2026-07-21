'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Clock, CheckCircle, XCircle, Loader2, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Textarea } from '@/components/ui/textarea'

type StudentExamSession = {
  id: string
  course_id: string
  session_id: string
  semester_id: string
  title: string
  description?: string
  start_time: string
  end_time: string
  duration_minutes: number
  is_published: boolean
  published_at?: string
  created_at: string
  course?: {
    code: string
    title: string
    level: string
    program?: {
      title: string
    }
  }
  session?: {
    name: string
  }
  semester?: {
    semester_name: string
  }
}

type Course = {
  id: string
  code: string
  title: string
  level: string
  program_id: string
}

type AcademicSession = {
  id: string
  name: string
}

type AcademicSemester = {
  id: string
  semester_name: string
}

export default function StudentExamsPage() {
  const [exams, setExams] = useState<StudentExamSession[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [sessions, setSessions] = useState<AcademicSession[]>([])
  const [semesters, setSemesters] = useState<AcademicSemester[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const supabase = createClient()

  const [formData, setFormData] = useState({
    course_id: '',
    session_id: '',
    semester_id: '',
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    duration_minutes: 60
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [examsRes, coursesRes, sessionsRes, semestersRes] = await Promise.all([
        supabase
          .from('student_exam_sessions')
          .select('*, course:courses(code, title, level, program:programs(title)), session:academic_sessions(name), semester:academic_semesters(semester_name)')
          .order('created_at', { ascending: false }),
        supabase.from('courses').select('id, code, title, level, program_id').eq('is_active', true),
        supabase.from('academic_sessions').select('*').order('name'),
        supabase.from('academic_semesters').select('*').order('semester_name')
      ])

      setExams(examsRes.data || [])
      setCourses(coursesRes.data || [])
      setSessions(sessionsRes.data || [])
      setSemesters(semestersRes.data || [])
    } catch (error) {
      console.error('Failed to load data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!formData.course_id || !formData.session_id || !formData.semester_id || !formData.title || !formData.start_time || !formData.end_time) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      const { error } = await supabase.from('student_exam_sessions').insert({
        course_id: formData.course_id,
        session_id: formData.session_id,
        semester_id: formData.semester_id,
        title: formData.title,
        description: formData.description,
        start_time: formData.start_time,
        end_time: formData.end_time,
        duration_minutes: formData.duration_minutes,
        is_published: false
      })

      if (error) throw error

      toast.success('Exam created successfully')
      setIsCreateModalOpen(false)
      resetForm()
      loadData()
    } catch (error) {
      console.error('Failed to create exam:', error)
      toast.error('Failed to create exam')
    }
  }

  const handlePublish = async (id: string) => {
    try {
      const { error } = await supabase
        .from('student_exam_sessions')
        .update({ 
          is_published: true,
          published_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error
      toast.success('Exam published successfully')
      loadData()
    } catch (error) {
      console.error('Failed to publish exam:', error)
      toast.error('Failed to publish exam')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this exam?')) return

    try {
      const { error } = await supabase.from('student_exam_sessions').delete().eq('id', id)
      if (error) throw error

      toast.success('Exam deleted successfully')
      loadData()
    } catch (error) {
      console.error('Failed to delete exam:', error)
      toast.error('Failed to delete exam')
    }
  }

  const resetForm = () => {
    setFormData({
      course_id: '',
      session_id: '',
      semester_id: '',
      title: '',
      description: '',
      start_time: '',
      end_time: '',
      duration_minutes: 60
    })
  }

  const filteredExams = exams.filter(exam => {
    const matchesSearch = 
      exam.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exam.course?.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exam.course?.title?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Student Exams</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create and manage student examinations</p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Exam
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Student Exam</DialogTitle>
              <DialogDescription>Create a new examination for students</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Course *</label>
                <Select value={formData.course_id} onValueChange={(value) => setFormData({ ...formData, course_id: value })}>
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
              <div>
                <label className="text-sm font-medium">Exam Title *</label>
                <Input
                  placeholder="e.g., Mid-Semester Examination"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  placeholder="Exam description..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Start Time *</label>
                  <Input
                    type="datetime-local"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">End Time *</label>
                  <Input
                    type="datetime-local"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Duration (minutes)</label>
                <Input
                  type="number"
                  min="1"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 60 })}
                  className="mt-1"
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate}>
                  Create Exam
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-6">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search exams by title or course..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredExams.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No exams found</div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Session</TableHead>
                  <TableHead>Semester</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExams.map((exam) => (
                  <TableRow key={exam.id}>
                    <TableCell className="font-medium">{exam.title}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{exam.course?.code}</p>
                        <p className="text-sm text-muted-foreground">{exam.course?.title}</p>
                      </div>
                    </TableCell>
                    <TableCell>{exam.session?.name}</TableCell>
                    <TableCell>{exam.semester?.semester_name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {new Date(exam.start_time).toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>{exam.duration_minutes} min</TableCell>
                    <TableCell>
                      {exam.is_published ? (
                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                          <CheckCircle className="h-3 w-3 mr-1" /> Published
                        </Badge>
                      ) : (
                        <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                          <Clock className="h-3 w-3 mr-1" /> Draft
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {!exam.is_published && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePublish(exam.id)}
                          >
                            Publish
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(exam.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  )
}
