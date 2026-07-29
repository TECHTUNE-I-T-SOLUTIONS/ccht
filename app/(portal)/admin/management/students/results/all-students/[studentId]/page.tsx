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
import { ArrowLeft, Loader2, Search, Edit, Save, X } from 'lucide-react'
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
  const [editingResult, setEditingResult] = useState<AssessmentResult | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

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

  const getGradeColor = (grade: string) => {
    if (grade === 'A') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
    if (grade === 'B') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    if (grade === 'C') return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
    if (grade === 'D') return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
    return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
  }

  const filteredAssessments = assessmentResults.filter(result => {
    const searchLower = searchTerm.toLowerCase()
    return (
      result.course?.code?.toLowerCase().includes(searchLower) ||
      result.course?.title?.toLowerCase().includes(searchLower) ||
      result.session?.name?.toLowerCase().includes(searchLower)
    )
  })

  const filteredExams = examResults.filter(result => {
    const searchLower = searchTerm.toLowerCase()
    return (
      result.exam_session?.exam_title?.toLowerCase().includes(searchLower) ||
      result.exam_session?.course?.code?.toLowerCase().includes(searchLower) ||
      result.exam_session?.course?.title?.toLowerCase().includes(searchLower)
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
          <Link href="/admin/management/students/results/all-students">
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

        <div className="space-y-8">
          {/* Assessment Results */}
          <div>
            <h2 className="text-xl font-bold mb-4">Assessment Results</h2>
            {filteredAssessments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No assessment results found</div>
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
                            {result.grade}
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
                            {result.grade}
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
    </div>
  )
}
