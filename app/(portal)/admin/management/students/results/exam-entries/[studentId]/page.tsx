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
import { useIsMobile } from '@/hooks/use-mobile'
import { createClient } from '@/lib/supabase/client'

type Student = {
  matric_number: string
  current_level: string
  profiles?: {
    id: string
    first_name: string
    last_name: string
    email: string
  }[]
}

type ExamSession = {
  id: string
  exam_title: string
  course_id: string
  course: {
    code: string
    title: string
  }[]
  total_marks: number
  passing_marks: number
}

type StudentExamAttempt = {
  id: string
  exam_session_id: string
  student_id: string
  enrollment_id: string
  total_score: number
  percentage_score: number
  grade: string
  passed: boolean
  status: string
  exam_session?: ExamSession
}

type Course = {
  id: string
  code: string
  title: string
}

type Enrollment = {
  id: string
  student_id: string
  program_id: string
  program?: {
    title: string
  }[]
  selected_courses?: {
    course: {
      id: string
      code: string
      title: string
    }[]
  }[]
}

export default function ExamEntriesPage() {
  const params = useParams()
  const router = useRouter()
  const studentId = params.studentId as string
  const supabase = createClient()

  const [student, setStudent] = useState<Student | null>(null)
  const [examAttempts, setExamAttempts] = useState<StudentExamAttempt[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [examSessions, setExamSessions] = useState<ExamSession[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('score')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const isMobile = useIsMobile()
  const [editingExam, setEditingExam] = useState<StudentExamAttempt | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newExam, setNewExam] = useState({
    exam_session_id: '',
    enrollment_id: '',
    total_score: 0,
    percentage_score: 0,
    grade: 'F',
    passed: false,
    status: 'graded'
  })

  useEffect(() => {
    loadData()
  }, [studentId])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load student details
      const { data: studentData, error: studentError } = await supabase
        .from('student_profiles')
        .select(`
          matric_number,
          current_level,
          profiles!student_profiles_profile_id_fkey(
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('profile_id', studentId)
        .single()

      if (studentError) throw studentError
      setStudent(studentData)

      // Load existing exam attempts
      const { data: examsData, error: examsError } = await supabase
        .from('student_exam_attempts')
        .select(`
          *,
          exam_session:student_exam_sessions(
            exam_title,
            course:courses(code, title),
            total_marks,
            passing_marks
          )
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })

      if (examsError) throw examsError
      setExamAttempts(examsData || [])

      // Load dropdown data
      const [coursesRes, examSessionsRes, enrollmentsRes] = await Promise.all([
        supabase.from('courses').select('id, code, title').order('code'),
        supabase.from('student_exam_sessions').select('id, exam_title, course_id, total_marks, passing_marks, course:courses(code, title)').order('exam_title'),
        supabase
          .from('enrollments')
          .select(`
            id,
            student_id,
            program_id,
            program:programs!enrollments_program_id_fkey(title),
            selected_courses:selected_courses(
              course:courses(id, code, title)
            )
          `)
          .eq('student_id', studentId)
      ])

      if (coursesRes.error) throw coursesRes.error
      if (examSessionsRes.error) throw examSessionsRes.error
      if (enrollmentsRes.error) throw enrollmentsRes.error

      setCourses(coursesRes.data || [])
      setExamSessions(examSessionsRes.data || [])
      setEnrollments(enrollmentsRes.data || [])
    } catch (error) {
      console.error('Failed to load data:', error)
      toast.error('Failed to load student data')
    } finally {
      setLoading(false)
    }
  }

  const handleEditExam = (exam: StudentExamAttempt) => {
    setEditingExam(exam)
    setEditDialogOpen(true)
  }

  const handleSaveExam = async () => {
    if (!editingExam) return

    try {
      const { error } = await supabase
        .from('student_exam_attempts')
        .update({
          total_score: editingExam.total_score,
          percentage_score: editingExam.percentage_score,
          grade: editingExam.grade || null,
          passed: editingExam.passed,
          status: editingExam.status,
          graded_by: (await supabase.auth.getUser()).data.user?.id,
          graded_at: new Date().toISOString()
        })
        .eq('id', editingExam.id)

      if (error) throw error
      toast.success('Exam result updated successfully')
      setEditDialogOpen(false)
      loadData()
    } catch (error) {
      console.error('Failed to update exam result:', error)
      toast.error('Failed to update exam result')
    }
  }

  const handleCreateExam = async () => {
    try {
      const { error } = await supabase
        .from('student_exam_attempts')
        .insert({
          exam_session_id: newExam.exam_session_id,
          student_id: studentId,
          enrollment_id: newExam.enrollment_id,
          total_score: newExam.total_score,
          percentage_score: newExam.percentage_score,
          grade: newExam.grade,
          passed: newExam.passed,
          status: newExam.status,
          attempt_number: 1,
          graded_by: (await supabase.auth.getUser()).data.user?.id,
          graded_at: new Date().toISOString()
        })

      if (error) throw error
      toast.success('Exam result created successfully')
      setCreateDialogOpen(false)
      setNewExam({
        exam_session_id: '',
        enrollment_id: '',
        total_score: 0,
        percentage_score: 0,
        grade: 'F',
        passed: false,
        status: 'graded'
      })
      loadData()
    } catch (error) {
      console.error('Failed to create exam result:', error)
      toast.error('Failed to create exam result')
    }
  }

  const getGradeColor = (grade: string | null | undefined) => {
    if (!grade) return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
    if (grade === 'A') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
    if (grade === 'B') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    if (grade === 'C') return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
    if (grade === 'D') return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
    return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
  }

  const filteredExams = examAttempts.filter(exam => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch =
      exam.exam_session?.exam_title?.toLowerCase().includes(searchLower) ||
      exam.exam_session?.course[0]?.code?.toLowerCase().includes(searchLower) ||
      exam.exam_session?.course[0]?.title?.toLowerCase().includes(searchLower)
    
    const matchesStatus = statusFilter === 'all' || exam.status === statusFilter
    
    return matchesSearch && matchesStatus
  }).sort((a, b) => {
    let comparison = 0
    if (sortBy === 'score') {
      comparison = a.percentage_score - b.percentage_score
    } else if (sortBy === 'grade') {
      comparison = (a.grade || '').localeCompare(b.grade || '')
    }
    return sortOrder === 'asc' ? comparison : -comparison
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
          <Link href="/admin/management/students/results/all-students">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">
              {student?.profiles?.[0]?.first_name} {student?.profiles?.[0]?.last_name}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {student?.matric_number} • {student?.current_level}
            </p>
          </div>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="border border-primary hover:text-blue-600 hover:shadow-lg hover:shadow-blue-700">
              <Plus className="h-4 w-4 mr-2" /> Add Exam Result
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-black">
            <DialogHeader>
              <DialogTitle>Create New Exam Result</DialogTitle>
              <DialogDescription>
                Enter the exam result details for this student.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Exam Session</Label>
                  <Select
                    value={newExam.exam_session_id}
                    onValueChange={(value) => {
                      setNewExam({ ...newExam, exam_session_id: value })
                      const selectedSession = examSessions.find(es => es.id === value)
                      if (selectedSession) {
                        const enrollmentWithCourse = enrollments.find(e => 
                          e.selected_courses?.some(sc => sc.course[0]?.id === selectedSession.course_id)
                        )
                        if (enrollmentWithCourse) {
                          setNewExam(prev => ({ ...prev, enrollment_id: enrollmentWithCourse.id }))
                        }
                      }
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select exam" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {examSessions.map((session) => (
                        <SelectItem key={session.id} value={session.id}>
                          {session.exam_title} - {session.course[0]?.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Enrollment</Label>
                  <Select
                    value={newExam.enrollment_id}
                    onValueChange={(value) => setNewExam({ ...newExam, enrollment_id: value })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Auto-selected" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {enrollments.map((enrollment) => (
                        <SelectItem key={enrollment.id} value={enrollment.id}>
                          {enrollment.program?.[0]?.title || 'No Program'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Total Score</Label>
                  <Input
                    type="number"
                    value={newExam.total_score}
                    onChange={(e) => {
                      const score = parseFloat(e.target.value) || 0
                      const session = examSessions.find(es => es.id === newExam.exam_session_id)
                      const percentage = session ? (score / session.total_marks) * 100 : 0
                      setNewExam({ ...newExam, total_score: score, percentage_score: Math.round(percentage) })
                    }}
                  />
                </div>
                <div>
                  <Label>Percentage Score</Label>
                  <Input
                    type="number"
                    value={newExam.percentage_score}
                    readOnly
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Grade</Label>
                  <Select
                    value={newExam.grade}
                    onValueChange={(value) => setNewExam({ ...newExam, grade: value })}
                  >
                    <SelectTrigger className="w-full">
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
                    value={newExam.status}
                    onValueChange={(value) => setNewExam({ ...newExam, status: value })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="graded">Graded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Passed</Label>
                <Select
                  value={newExam.passed ? 'true' : 'false'}
                  onValueChange={(value) => setNewExam({ ...newExam, passed: value === 'true' })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Yes</SelectItem>
                    <SelectItem value="false">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  <X className="h-4 w-4 mr-2" /> Cancel
                </Button>
                <Button onClick={handleCreateExam} className="border border-primary hover:text-blue-600 hover:shadow-lg hover:shadow-blue-700">
                  <Save className="h-4 w-4 mr-2" /> Create
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-6">
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by exam title or course..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="graded">Graded</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="score">Score</SelectItem>
                <SelectItem value="grade">Grade</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </Button>
          </div>
        </div>

        {filteredExams.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No exam results found</div>
        ) : isMobile ? (
          <div className="space-y-4">
            {filteredExams.map((exam) => (
              <Card key={exam.id} className="p-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{exam.exam_session?.exam_title}</p>
                      <p className="text-sm text-muted-foreground">{exam.exam_session?.course[0]?.code} - {exam.exam_session?.course[0]?.title}</p>
                    </div>
                    <Badge className={getGradeColor(exam.grade)}>{exam.grade || 'N/A'}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Score: {exam.total_score}/{exam.exam_session?.total_marks}</div>
                    <div className="font-semibold">Percentage: {exam.percentage_score}%</div>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <Badge variant={exam.status === 'graded' ? 'default' : 'secondary'}>
                      {exam.status}
                    </Badge>
                    {exam.passed ? (
                      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        Passed
                      </Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        Failed
                      </Badge>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditExam(exam)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Exam</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Percentage</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Passed</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExams.map((exam) => (
                  <TableRow key={exam.id}>
                    <TableCell>{exam.exam_session?.exam_title}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{exam.exam_session?.course[0]?.code}</p>
                        <p className="text-sm text-muted-foreground">{exam.exam_session?.course[0]?.title}</p>
                      </div>
                    </TableCell>
                    <TableCell>{exam.total_score}/{exam.exam_session?.total_marks}</TableCell>
                    <TableCell className="font-semibold">{exam.percentage_score}%</TableCell>
                    <TableCell>
                      <Badge className={getGradeColor(exam.grade)}>
                        {exam.grade || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={exam.status === 'graded' ? 'default' : 'secondary'}>
                        {exam.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {exam.passed ? (
                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                          Yes
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                          No
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditExam(exam)}
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

      {/* Edit Exam Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-black">
          <DialogHeader>
            <DialogTitle>Edit Exam Result</DialogTitle>
            <DialogDescription>
              Update the exam result for this student.
            </DialogDescription>
          </DialogHeader>
          {editingExam && (
            <div className="space-y-4">
              <div>
                <Label>Total Score</Label>
                <Input
                  type="number"
                  value={editingExam.total_score}
                  onChange={(e) => setEditingExam({ ...editingExam, total_score: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Percentage Score</Label>
                <Input
                  type="number"
                  value={editingExam.percentage_score}
                  onChange={(e) => setEditingExam({ ...editingExam, percentage_score: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Grade</Label>
                  <Select
                    value={editingExam.grade}
                    onValueChange={(value) => setEditingExam({ ...editingExam, grade: value })}
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
                    value={editingExam.status}
                    onValueChange={(value) => setEditingExam({ ...editingExam, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="graded">Graded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Passed</Label>
                <Select
                  value={editingExam.passed ? 'true' : 'false'}
                  onValueChange={(value) => setEditingExam({ ...editingExam, passed: value === 'true' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Yes</SelectItem>
                    <SelectItem value="false">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  <X className="h-4 w-4 mr-2" /> Cancel
                </Button>
                <Button onClick={handleSaveExam} className="border border-primary hover:shadow-lg hover:shadow-blue-600">
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
