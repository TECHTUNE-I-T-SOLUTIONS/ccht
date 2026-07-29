'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Loader2, Search, Edit, Save, X, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

type Student = {
  id: string
  first_name: string
  last_name: string
  email: string
  student_profiles?: {
    matric_number: string
    current_level: string
  }[]
}

type Assessment = {
  id: string
  student_id: string
  enrollment_id: string
  course_id: string
  teacher_id: string
  session_id: string
  semester_id: string
  exam_score: number
  grade: string
  score_status: string
  ca_1: number
  ca_2: number
  assignments: number
  continuous_assessment: number
  total_score: number
  course?: {
    code: string
    title: string
  }
  semester?: {
    semester_name: string
  }
  session?: {
    name: string
  }
}

type Course = {
  id: string
  code: string
  title: string
}

type Session = {
  id: string
  name: string
}

type Semester = {
  id: string
  semester_name: string
}

type Enrollment = {
  id: string
  student_id: string
  course_id: string
}

export default function StudentAssessmentEntriesPage() {
  const params = useParams()
  const router = useRouter()
  const studentId = params.studentId as string
  const supabase = createClient()

  const [student, setStudent] = useState<Student | null>(null)
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newAssessment, setNewAssessment] = useState({
    enrollment_id: '',
    course_id: '',
    teacher_id: '',
    session_id: '',
    semester_id: '',
    ca_1: 0,
    ca_2: 0,
    assignments: 0,
    exam_score: 0,
    grade: 'F',
    score_status: 'draft'
  })

  useEffect(() => {
    loadData()
  }, [studentId])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load student details
      const { data: studentData, error: studentError } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          email,
          student_profiles(
            matric_number,
            current_level
          )
        `)
        .eq('id', studentId)
        .single()

      if (studentError) throw studentError
      setStudent(studentData)

      // Load assessments
      const { data: assessmentsData, error: assessmentsError } = await supabase
        .from('assessments')
        .select(`
          *,
          course:courses(code, title),
          semester:academic_semesters(semester_name),
          session:academic_sessions(name)
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })

      if (assessmentsError) throw assessmentsError
      setAssessments(assessmentsData || [])

      // Load dropdown data
      const [coursesRes, sessionsRes, semestersRes, enrollmentsRes] = await Promise.all([
        supabase.from('courses').select('id, code, title').order('code'),
        supabase.from('academic_sessions').select('id, name').order('name'),
        supabase.from('academic_semesters').select('id, semester_name').order('semester_name'),
        supabase.from('enrollments').select('id, student_id, course_id').eq('student_id', studentId)
      ])

      if (coursesRes.error) throw coursesRes.error
      if (sessionsRes.error) throw sessionsRes.error
      if (semestersRes.error) throw semestersRes.error
      if (enrollmentsRes.error) throw enrollmentsRes.error

      setCourses(coursesRes.data || [])
      setSessions(sessionsRes.data || [])
      setSemesters(semestersRes.data || [])
      setEnrollments(enrollmentsRes.data || [])
    } catch (error) {
      console.error('Failed to load data:', error)
      toast.error('Failed to load student data')
    } finally {
      setLoading(false)
    }
  }

  const handleEditAssessment = (assessment: Assessment) => {
    setEditingAssessment(assessment)
    setEditDialogOpen(true)
  }

  const handleSaveAssessment = async () => {
    if (!editingAssessment) return

    try {
      const { error } = await supabase
        .from('assessments')
        .update({
          ca_1: editingAssessment.ca_1,
          ca_2: editingAssessment.ca_2,
          assignments: editingAssessment.assignments,
          exam_score: editingAssessment.exam_score,
          grade: editingAssessment.grade,
          score_status: editingAssessment.score_status,
        })
        .eq('id', editingAssessment.id)

      if (error) throw error
      toast.success('Assessment updated successfully')
      setEditDialogOpen(false)
      loadData()
    } catch (error) {
      console.error('Failed to update assessment:', error)
      toast.error('Failed to update assessment')
    }
  }

  const handleCreateAssessment = async () => {
    try {
      const { error } = await supabase
        .from('assessments')
        .insert({
          student_id: studentId,
          enrollment_id: newAssessment.enrollment_id,
          course_id: newAssessment.course_id,
          teacher_id: newAssessment.teacher_id || null,
          session_id: newAssessment.session_id || null,
          semester_id: newAssessment.semester_id || null,
          ca_1: newAssessment.ca_1,
          ca_2: newAssessment.ca_2,
          assignments: newAssessment.assignments,
          exam_score: newAssessment.exam_score,
          grade: newAssessment.grade,
          score_status: newAssessment.score_status,
        })

      if (error) throw error
      toast.success('Assessment created successfully')
      setCreateDialogOpen(false)
      setNewAssessment({
        enrollment_id: '',
        course_id: '',
        teacher_id: '',
        session_id: '',
        semester_id: '',
        ca_1: 0,
        ca_2: 0,
        assignments: 0,
        exam_score: 0,
        grade: 'F',
        score_status: 'draft'
      })
      loadData()
    } catch (error) {
      console.error('Failed to create assessment:', error)
      toast.error('Failed to create assessment')
    }
  }

  const getGradeColor = (grade: string) => {
    if (grade === 'A') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
    if (grade === 'B') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    if (grade === 'C') return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
    if (grade === 'D') return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
    return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
  }

  const filteredAssessments = assessments.filter(assessment => {
    const searchLower = searchTerm.toLowerCase()
    return (
      assessment.course?.code?.toLowerCase().includes(searchLower) ||
      assessment.course?.title?.toLowerCase().includes(searchLower) ||
      assessment.session?.name?.toLowerCase().includes(searchLower)
    )
  })

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
        <div className="flex items-center gap-4">
          <Link href="/admin/management/students/results/assessment-entries">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">
              {student?.first_name} {student?.last_name}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {student?.student_profiles?.[0]?.matric_number} • {student?.student_profiles?.[0]?.current_level}
            </p>
          </div>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" /> Add Assessment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Assessment Entry</DialogTitle>
              <DialogDescription>
                Enter the assessment details for this student.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Enrollment</Label>
                <Select
                  value={newAssessment.enrollment_id}
                  onValueChange={(value) => setNewAssessment({ ...newAssessment, enrollment_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select enrollment" />
                  </SelectTrigger>
                  <SelectContent>
                    {enrollments.map((enrollment) => {
                      const course = courses.find(c => c.id === enrollment.course_id)
                      return (
                        <SelectItem key={enrollment.id} value={enrollment.id}>
                          {course?.code} - {course?.title}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Course</Label>
                  <Select
                    value={newAssessment.course_id}
                    onValueChange={(value) => setNewAssessment({ ...newAssessment, course_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select course" />
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
                  <Label>Session</Label>
                  <Select
                    value={newAssessment.session_id}
                    onValueChange={(value) => setNewAssessment({ ...newAssessment, session_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select session" />
                    </SelectTrigger>
                    <SelectContent>
                      {sessions.map((session) => (
                        <SelectItem key={session.id} value={session.id}>
                          {session.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Semester</Label>
                <Select
                  value={newAssessment.semester_id}
                  onValueChange={(value) => setNewAssessment({ ...newAssessment, semester_id: value })}
                >
                  <SelectTrigger>
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
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>CA 1 (0-15)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="15"
                    value={newAssessment.ca_1}
                    onChange={(e) => setNewAssessment({ ...newAssessment, ca_1: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>CA 2 (0-15)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="15"
                    value={newAssessment.ca_2}
                    onChange={(e) => setNewAssessment({ ...newAssessment, ca_2: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>Assignments (0-10)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    value={newAssessment.assignments}
                    onChange={(e) => setNewAssessment({ ...newAssessment, assignments: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Exam Score (0-60)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="60"
                    value={newAssessment.exam_score}
                    onChange={(e) => setNewAssessment({ ...newAssessment, exam_score: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>Grade</Label>
                  <Select
                    value={newAssessment.grade}
                    onValueChange={(value) => setNewAssessment({ ...newAssessment, grade: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">A</SelectItem>
                      <SelectItem value="B">B</SelectItem>
                      <SelectItem value="C">C</SelectItem>
                      <SelectItem value="D">D</SelectItem>
                      <SelectItem value="E">E</SelectItem>
                      <SelectItem value="F">F</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={newAssessment.score_status}
                  onValueChange={(value) => setNewAssessment({ ...newAssessment, score_status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  <X className="h-4 w-4 mr-2" /> Cancel
                </Button>
                <Button onClick={handleCreateAssessment}>
                  <Save className="h-4 w-4 mr-2" /> Create
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-6">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by course code, title, or session..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {filteredAssessments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No assessment entries found</div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>CA 1</TableHead>
                  <TableHead>CA 2</TableHead>
                  <TableHead>Assignments</TableHead>
                  <TableHead>Exam Score</TableHead>
                  <TableHead>Total Score</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssessments.map((assessment) => (
                  <TableRow key={assessment.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{assessment.course?.code}</p>
                        <p className="text-sm text-muted-foreground">{assessment.course?.title}</p>
                      </div>
                    </TableCell>
                    <TableCell>{assessment.ca_1}</TableCell>
                    <TableCell>{assessment.ca_2}</TableCell>
                    <TableCell>{assessment.assignments}</TableCell>
                    <TableCell>{assessment.exam_score}</TableCell>
                    <TableCell className="font-semibold">{assessment.total_score}</TableCell>
                    <TableCell>
                      <Badge className={getGradeColor(assessment.grade)}>
                        {assessment.grade}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={assessment.score_status === 'published' ? 'default' : 'secondary'}>
                        {assessment.score_status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditAssessment(assessment)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Edit Assessment Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Assessment Entry</DialogTitle>
            <DialogDescription>
              Update the assessment scores and grade for this student.
            </DialogDescription>
          </DialogHeader>
          {editingAssessment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>CA 1 (0-15)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="15"
                    value={editingAssessment.ca_1}
                    onChange={(e) => setEditingAssessment({ ...editingAssessment, ca_1: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>CA 2 (0-15)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="15"
                    value={editingAssessment.ca_2}
                    onChange={(e) => setEditingAssessment({ ...editingAssessment, ca_2: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div>
                <Label>Assignments (0-10)</Label>
                <Input
                  type="number"
                  min="0"
                  max="10"
                  value={editingAssessment.assignments}
                  onChange={(e) => setEditingAssessment({ ...editingAssessment, assignments: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Exam Score (0-60)</Label>
                <Input
                  type="number"
                  min="0"
                  max="60"
                  value={editingAssessment.exam_score}
                  onChange={(e) => setEditingAssessment({ ...editingAssessment, exam_score: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Grade</Label>
                  <Select
                    value={editingAssessment.grade}
                    onValueChange={(value) => setEditingAssessment({ ...editingAssessment, grade: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">A</SelectItem>
                      <SelectItem value="B">B</SelectItem>
                      <SelectItem value="C">C</SelectItem>
                      <SelectItem value="D">D</SelectItem>
                      <SelectItem value="E">E</SelectItem>
                      <SelectItem value="F">F</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select
                    value={editingAssessment.score_status}
                    onValueChange={(value) => setEditingAssessment({ ...editingAssessment, score_status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="submitted">Submitted</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  <X className="h-4 w-4 mr-2" /> Cancel
                </Button>
                <Button onClick={handleSaveAssessment}>
                  <Save className="h-4 w-4 mr-2" /> Save
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
