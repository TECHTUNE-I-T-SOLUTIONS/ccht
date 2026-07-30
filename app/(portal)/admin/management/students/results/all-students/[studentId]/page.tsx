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

type AssessmentResult = {
  id: string
  student_id: string
  enrollment_id: string
  course_id: string
  exam_score: number
  grade: string
  score_status: string
  ca_1: number
  ca_2: number
  assignments: number
  continuous_assessment: number
  total_score: number
  semester_id: string
  session_id: string
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

type ExamResult = {
  id: string
  exam_session_id: string
  student_id: string
  total_score: number
  percentage_score: number
  grade: string
  passed: boolean
  status: string
  exam_session?: {
    exam_title: string
    course: {
      code: string
      title: string
    }
    total_marks: number
    passing_marks: number
  }
}

export default function StudentDetailResultsPage() {
  const params = useParams()
  const router = useRouter()
  const studentId = params.studentId as string
  const supabase = createClient()

  const [student, setStudent] = useState<Student | null>(null)
  const [assessmentResults, setAssessmentResults] = useState<AssessmentResult[]>([])
  const [examResults, setExamResults] = useState<ExamResult[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [courseFilter, setCourseFilter] = useState('all')
  const [sessionFilter, setSessionFilter] = useState('all')
  const [semesterFilter, setSemesterFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('score')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const isMobile = useIsMobile()
  const [editingResult, setEditingResult] = useState<AssessmentResult | null>(null)
  const [editingExam, setEditingExam] = useState<ExamResult | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editExamDialogOpen, setEditExamDialogOpen] = useState(false)

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

      // Load assessment results
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
      setAssessmentResults(assessmentsData || [])

      // Load exam results
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
      setExamResults(examsData || [])
    } catch (error) {
      console.error('Failed to load data:', error)
      toast.error('Failed to load student data')
    } finally {
      setLoading(false)
    }
  }

  const handleEditResult = (result: AssessmentResult) => {
    setEditingResult(result)
    setEditDialogOpen(true)
  }

  const handleEditExam = (exam: ExamResult) => {
    setEditingExam(exam)
    setEditExamDialogOpen(true)
  }

  const handleSaveResult = async () => {
    if (!editingResult) return

    try {
      const { error } = await supabase
        .from('assessments')
        .update({
          ca_1: editingResult.ca_1,
          ca_2: editingResult.ca_2,
          assignments: editingResult.assignments,
          exam_score: editingResult.exam_score,
          grade: editingResult.grade,
          score_status: editingResult.score_status,
        })
        .eq('id', editingResult.id)

      if (error) throw error
      toast.success('Result updated successfully')
      setEditDialogOpen(false)
      loadData()
    } catch (error) {
      console.error('Failed to update result:', error)
      toast.error('Failed to update result')
    }
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
      setEditExamDialogOpen(false)
      loadData()
    } catch (error) {
      console.error('Failed to update exam result:', error)
      toast.error('Failed to update exam result')
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

  const filteredAssessments = assessmentResults.filter(result => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch =
      result.course?.code?.toLowerCase().includes(searchLower) ||
      result.course?.title?.toLowerCase().includes(searchLower) ||
      result.session?.name?.toLowerCase().includes(searchLower)
    
    const matchesCourse = courseFilter === 'all' || result.course_id === courseFilter
    const matchesSession = sessionFilter === 'all' || result.session_id === sessionFilter
    const matchesSemester = semesterFilter === 'all' || result.semester_id === semesterFilter
    const matchesStatus = statusFilter === 'all' || result.score_status === statusFilter
    
    return matchesSearch && matchesCourse && matchesSession && matchesSemester && matchesStatus
  }).sort((a, b) => {
    let comparison = 0
    if (sortBy === 'score') {
      comparison = a.total_score - b.total_score
    } else if (sortBy === 'grade') {
      comparison = a.grade.localeCompare(b.grade)
    }
    return sortOrder === 'asc' ? comparison : -comparison
  })

  const filteredExams = examResults.filter(result => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch =
      result.exam_session?.exam_title?.toLowerCase().includes(searchLower) ||
      result.exam_session?.course?.code?.toLowerCase().includes(searchLower) ||
      result.exam_session?.course?.title?.toLowerCase().includes(searchLower)
    
    const matchesStatus = statusFilter === 'all' || result.status === statusFilter
    
    return matchesSearch && matchesStatus
  }).sort((a, b) => {
    let comparison = 0
    if (sortBy === 'score') {
      comparison = a.percentage_score - b.percentage_score
    } else if (sortBy === 'grade') {
      comparison = a.grade.localeCompare(b.grade)
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
        <div className="flex flex-wrap gap-2">
          <Link href={`/admin/management/students/results/assessment-entries/${studentId}`}>
            <Button variant="outline" className="border border-primary hover:text-blue-600 hover:shadow-lg hover:shadow-blue-700">
              <Plus className="h-4 w-4 mr-2" /> Add Assessment
            </Button>
          </Link>
          <Link href={`/admin/management/students/results/exam-entries/${studentId}`}>
            <Button variant="outline" className="border border-primary hover:text-blue-600 hover:shadow-lg hover:shadow-blue-700">
              <Plus className="h-4 w-4 mr-2" /> Add Exam Result
            </Button>
          </Link>
          <Link href={`/admin/management/students/results/final-entries/${studentId}`}>
            <Button variant="outline" className="border border-primary hover:text-blue-600 hover:shadow-lg hover:shadow-blue-700">
              <Plus className="h-4 w-4 mr-2" /> Add Final Result
            </Button>
          </Link>
        </div>
      </div>

      <Card className="p-6">
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by course code, title, or session..."
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
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="published">Published</SelectItem>
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

        <div className="space-y-8">
          {/* Assessment Results */}
          <div>
            <h2 className="text-xl font-bold mb-4">Assessment Results</h2>
            {filteredAssessments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No assessment results found</div>
            ) : isMobile ? (
              <div className="space-y-4">
                {filteredAssessments.map((result) => (
                  <Card key={result.id} className="p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">{result.course?.code}</p>
                          <p className="text-sm text-muted-foreground">{result.course?.title}</p>
                        </div>
                        <Badge className={getGradeColor(result.grade)}>{result.grade}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>CA 1: {result.ca_1}</div>
                        <div>CA 2: {result.ca_2}</div>
                        <div>Assignments: {result.assignments}</div>
                        <div>Exam: {result.exam_score}</div>
                        <div className="col-span-2 font-semibold">Total: {result.total_score}</div>
                      </div>
                      <div className="flex justify-between items-center pt-2">
                        <Badge variant={result.score_status === 'published' ? 'default' : 'secondary'}>
                          {result.score_status}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditResult(result)}
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
                    {filteredAssessments.map((result) => (
                      <TableRow key={result.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{result.course?.code}</p>
                            <p className="text-sm text-muted-foreground">{result.course?.title}</p>
                          </div>
                        </TableCell>
                        <TableCell>{result.ca_1}</TableCell>
                        <TableCell>{result.ca_2}</TableCell>
                        <TableCell>{result.assignments}</TableCell>
                        <TableCell>{result.exam_score}</TableCell>
                        <TableCell className="font-semibold">{result.total_score}</TableCell>
                        <TableCell>
                          <Badge className={getGradeColor(result.grade)}>
                          {result.grade || 'N/A'}
                        </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={result.score_status === 'published' ? 'default' : 'secondary'}>
                            {result.score_status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditResult(result)}
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
          </div>

          {/* Exam Results */}
          <div>
            <h2 className="text-xl font-bold mb-4">Exam Results</h2>
            {filteredExams.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No exam results found</div>
            ) : isMobile ? (
              <div className="space-y-4">
                {filteredExams.map((result) => (
                  <Card key={result.id} className="p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">{result.exam_session?.exam_title}</p>
                          <p className="text-sm text-muted-foreground">{result.exam_session?.course?.code} - {result.exam_session?.course?.title}</p>
                        </div>
                        <Badge className={getGradeColor(result.grade)}>{result.grade || 'N/A'}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>Score: {result.total_score}/{result.exam_session?.total_marks}</div>
                        <div className="font-semibold">Percentage: {result.percentage_score}%</div>
                      </div>
                      <div className="flex justify-between items-center pt-2">
                        <Badge variant={result.status === 'graded' ? 'default' : 'secondary'}>
                          {result.status}
                        </Badge>
                        {result.passed ? (
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
                          onClick={() => handleEditExam(result)}
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExams.map((result) => (
                      <TableRow key={result.id}>
                        <TableCell>{result.exam_session?.exam_title}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{result.exam_session?.course?.code}</p>
                            <p className="text-sm text-muted-foreground">{result.exam_session?.course?.title}</p>
                          </div>
                        </TableCell>
                        <TableCell>{result.total_score}/{result.exam_session?.total_marks}</TableCell>
                        <TableCell className="font-semibold">{result.percentage_score}%</TableCell>
                        <TableCell>
                          <Badge className={getGradeColor(result.grade)}>
                          {result.grade || 'N/A'}
                        </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={result.status === 'graded' ? 'default' : 'secondary'}>
                            {result.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {result.passed ? (
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
                            onClick={() => handleEditExam(result)}
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
          </div>
        </div>
      </Card>

      {/* Edit Result Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Assessment Result</DialogTitle>
            <DialogDescription>
              Update the assessment scores and grade for this student.
            </DialogDescription>
          </DialogHeader>
          {editingResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>CA 1 (0-15)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="15"
                    value={editingResult.ca_1}
                    onChange={(e) => setEditingResult({ ...editingResult, ca_1: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>CA 2 (0-15)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="15"
                    value={editingResult.ca_2}
                    onChange={(e) => setEditingResult({ ...editingResult, ca_2: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div>
                <Label>Assignments (0-10)</Label>
                <Input
                  type="number"
                  min="0"
                  max="10"
                  value={editingResult.assignments}
                  onChange={(e) => setEditingResult({ ...editingResult, assignments: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Exam Score (0-60)</Label>
                <Input
                  type="number"
                  min="0"
                  max="60"
                  value={editingResult.exam_score}
                  onChange={(e) => setEditingResult({ ...editingResult, exam_score: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Grade</Label>
                  <Select
                    value={editingResult.grade}
                    onValueChange={(value) => setEditingResult({ ...editingResult, grade: value })}
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
                    value={editingResult.score_status}
                    onValueChange={(value) => setEditingResult({ ...editingResult, score_status: value })}
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
                <Button onClick={handleSaveResult}>
                  <Save className="h-4 w-4 mr-2" /> Save
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Exam Dialog */}
      <Dialog open={editExamDialogOpen} onOpenChange={setEditExamDialogOpen}>
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
                <Button variant="outline" onClick={() => setEditExamDialogOpen(false)}>
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
