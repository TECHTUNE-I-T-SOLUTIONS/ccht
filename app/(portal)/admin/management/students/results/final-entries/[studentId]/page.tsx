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

type FinalResult = {
  id: string
  student_id: string
  enrollment_id: string
  assessment_id: string | null
  course_name: string
  score: number | null
  grade: string | null
  semester: number | null
  academic_year: string | null
  published: boolean
  published_at: string | null
  published_by: string | null
  created_at: string
  updated_at: string
  enrollment?: {
    program?: {
      title: string
    }[]
  }[]
  assessment?: {
    course?: {
      code: string
      title: string
    }[]
    session?: {
      name: string
    }[]
    semester?: {
      semester_name: string
    }[]
  }[]
}

type Course = {
  id: string
  code: string
  title: string
  credit_units: number
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

type Session = {
  id: string
  name: string
}

type Semester = {
  id: string
  semester_name: string
}

export default function FinalEntriesPage() {
  const params = useParams()
  const router = useRouter()
  const studentId = params.studentId as string
  const supabase = createClient()

  const [student, setStudent] = useState<Student | null>(null)
  const [finalResults, setFinalResults] = useState<FinalResult[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [assessments, setAssessments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('score')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const isMobile = useIsMobile()
  const [editingResult, setEditingResult] = useState<FinalResult | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newResult, setNewResult] = useState({
    enrollment_id: '',
    assessment_id: '',
    course_name: '',
    score: 0,
    grade: 'F',
    semester: 1,
    academic_year: '2026/2027',
    published: false
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

      // Load existing results
      const { data: resultsData, error: resultsError } = await supabase
        .from('results')
        .select(`
          *,
          enrollment:enrollments(
            program:programs(title)
          ),
          assessment:assessments(
            course:courses(code, title),
            session:academic_sessions(name),
            semester:academic_semesters(semester_name)
          )
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })

      if (resultsError) throw resultsError
      setFinalResults(resultsData || [])

      // Load dropdown data
      const [coursesRes, enrollmentsRes, sessionsRes, semestersRes] = await Promise.all([
        supabase.from('courses').select('id, code, title, credit_units').order('code'),
        supabase
          .from('enrollments')
          .select(`
            id,
            student_id,
            program_id,
            program:programs(title),
            selected_courses:selected_courses(
              course:courses(id, code, title)
            )
          `)
          .eq('student_id', studentId),
        supabase.from('academic_sessions').select('id, name').order('name'),
        supabase.from('academic_semesters').select('id, semester_name').order('semester_name')
      ])

      if (coursesRes.error) throw coursesRes.error
      if (enrollmentsRes.error) throw enrollmentsRes.error
      if (sessionsRes.error) throw sessionsRes.error
      if (semestersRes.error) throw semestersRes.error

      setCourses(coursesRes.data || [])
      setEnrollments(enrollmentsRes.data || [])
      setSessions(sessionsRes.data || [])
      setSemesters(semestersRes.data || [])

      // Load assessments for create modal
      const { data: assessmentsData } = await supabase
        .from('assessments')
        .select(`
          *,
          course:courses(code, title),
          session:academic_sessions(name),
          semester:academic_semesters(semester_name)
        `)
        .eq('student_id', studentId)
      setAssessments(assessmentsData || [])
    } catch (error) {
      console.error('Failed to load data:', error)
      toast.error('Failed to load student data')
    } finally {
      setLoading(false)
    }
  }

  const handleEditResult = (result: FinalResult) => {
    setEditingResult(result)
    setEditDialogOpen(true)
  }

  const handleTogglePublish = async (result: FinalResult) => {
    try {
      const { error } = await supabase
        .from('results')
        .update({
          published: !result.published,
          published_at: !result.published ? new Date().toISOString() : null,
          published_by: !result.published ? (await supabase.auth.getUser()).data.user?.id : null
        })
        .eq('id', result.id)

      if (error) throw error
      toast.success(result.published ? 'Result unpublished' : 'Result published')
      loadData()
    } catch (error) {
      console.error('Failed to toggle publish status:', error)
      toast.error('Failed to update publish status')
    }
  }

  const handleSaveResult = async () => {
    if (!editingResult) return

    try {
      const { error } = await supabase
        .from('results')
        .update({
          score: editingResult.score,
          grade: editingResult.grade,
          published: editingResult.published
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

  const handleCreateResult = async () => {
    try {
      const { error } = await supabase
        .from('results')
        .insert({
          student_id: studentId,
          enrollment_id: newResult.enrollment_id,
          assessment_id: newResult.assessment_id || null,
          course_name: newResult.course_name,
          score: newResult.score,
          grade: newResult.grade,
          semester: newResult.semester,
          academic_year: newResult.academic_year,
          published: newResult.published
        })

      if (error) throw error
      toast.success('Result created successfully')
      setCreateDialogOpen(false)
      setNewResult({
        enrollment_id: '',
        assessment_id: '',
        course_name: '',
        score: 0,
        grade: 'F',
        semester: 1,
        academic_year: '2026/2027',
        published: false
      })
      loadData()
    } catch (error) {
      console.error('Failed to create result:', error)
      toast.error('Failed to create result')
    }
  }

  const getGradeColor = (grade: string) => {
    if (grade === 'A') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
    if (grade === 'B') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    if (grade === 'C') return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
    if (grade === 'D') return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
    if (grade === 'E') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'
  }

  const getStandingColor = (standing: string) => {
    if (standing === 'first_class' || standing === 'excellent') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
    if (standing === 'second_class_upper' || standing === 'very_good') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    if (standing === 'second_class_lower' || standing === 'good') return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
    if (standing === 'third_class' || standing === 'fair') return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
    return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
  }

  const filteredResults = finalResults.filter(result => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch =
      result.assessment?.[0]?.course?.[0]?.title?.toLowerCase().includes(searchLower) ||
      result.assessment?.[0]?.course?.[0]?.code?.toLowerCase().includes(searchLower) ||
      result.academic_year?.toLowerCase().includes(searchLower) ||
      result.grade?.toLowerCase().includes(searchLower)
    
    const matchesStatus = statusFilter === 'all' || result.grade === statusFilter
    
    return matchesSearch && matchesStatus
  }).sort((a, b) => {
    let comparison = 0
    if (sortBy === 'score') {
      comparison = (a.score || 0) - (b.score || 0)
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
              <Plus className="h-4 w-4 mr-2" /> Add Final Result
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-black">
            <DialogHeader>
              <DialogTitle>Create New Final Result</DialogTitle>
              <DialogDescription>
                Enter the final result details for this student.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Enrollment</Label>
                <Select
                  value={newResult.enrollment_id}
                  onValueChange={(value) => setNewResult({ ...newResult, enrollment_id: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select enrollment" />
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
              <div>
                <Label>Assessment (Optional)</Label>
                <Select
                  value={newResult.assessment_id}
                  onValueChange={(value) => {
                    setNewResult({ ...newResult, assessment_id: value })
                    if (value) {
                      const selectedAssessment = assessments.find(a => a.id === value)
                      if (selectedAssessment) {
                        setNewResult(prev => ({
                          ...prev,
                          course_name: selectedAssessment.course?.title || '',
                          score: selectedAssessment.total_score || 0,
                          grade: selectedAssessment.grade || 'F',
                          semester: selectedAssessment.semester?.semester_name?.includes('First') ? 1 : 2,
                          academic_year: selectedAssessment.session?.name || '2026/2027'
                        }))
                      }
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select assessment to auto-fill" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    <SelectItem value="">No assessment</SelectItem>
                    {assessments.map((assessment) => (
                      <SelectItem key={assessment.id} value={assessment.id}>
                        {assessment.course?.code} - {assessment.course?.title} ({assessment.session?.name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Course Name</Label>
                <Input
                  value={newResult.course_name}
                  onChange={(e) => setNewResult({ ...newResult, course_name: e.target.value })}
                  placeholder="Enter course name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Score</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={newResult.score}
                    onChange={(e) => setNewResult({ ...newResult, score: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>Grade</Label>
                  <Select
                    value={newResult.grade}
                    onValueChange={(value) => setNewResult({ ...newResult, grade: value })}
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Semester</Label>
                  <Input
                    type="number"
                    min="1"
                    max="2"
                    value={newResult.semester}
                    onChange={(e) => setNewResult({ ...newResult, semester: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div>
                  <Label>Academic Year</Label>
                  <Input
                    value={newResult.academic_year}
                    onChange={(e) => setNewResult({ ...newResult, academic_year: e.target.value })}
                    placeholder="e.g., 2026/2027"
                  />
                </div>
              </div>
              <div>
                <Label>Published</Label>
                <Select
                  value={newResult.published.toString()}
                  onValueChange={(value) => setNewResult({ ...newResult, published: value === 'true' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">No</SelectItem>
                    <SelectItem value="true">Yes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  <X className="h-4 w-4 mr-2" /> Cancel
                </Button>
                <Button onClick={handleCreateResult} className="border border-primary hover:text-blue-600 hover:shadow-lg hover:shadow-blue-700">
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
              placeholder="Search by course, academic year, or grade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Grades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades</SelectItem>
                <SelectItem value="A">A</SelectItem>
                <SelectItem value="B">B</SelectItem>
                <SelectItem value="C">C</SelectItem>
                <SelectItem value="D">D</SelectItem>
                <SelectItem value="E">E</SelectItem>
                <SelectItem value="F">F</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="score">Score</SelectItem>
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

        {filteredResults.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No final results found</div>
        ) : isMobile ? (
          <div className="space-y-4">
            {filteredResults.map((result) => (
              <Card key={result.id} className="p-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{result.assessment?.[0]?.course?.[0]?.code || result.course_name}</p>
                      <p className="text-sm text-muted-foreground">{result.assessment?.[0]?.course?.[0]?.title || result.course_name}</p>
                      <p className="text-xs text-muted-foreground">Semester {result.semester} • {result.academic_year}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={result.published ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'}>
                        {result.published ? 'Published' : 'Draft'}
                      </Badge>
                      <Badge className={getGradeColor(result.grade || 'F')}>
                        {result.grade}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-sm">
                    <div>Score: {result.score?.toFixed(2) || 'N/A'}</div>
                  </div>
                  <div className="pt-2 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleEditResult(result)}
                    >
                      <Edit className="h-4 w-4 mr-2" /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant={result.published ? "outline" : "default"}
                      className="flex-1"
                      onClick={() => handleTogglePublish(result)}
                    >
                      {result.published ? 'Unpublish' : 'Publish'}
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
                  <TableHead>Semester</TableHead>
                  <TableHead>Academic Year</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResults.map((result) => (
                  <TableRow key={result.id}>
                    <TableCell>{result.assessment?.[0]?.course?.[0]?.code || result.course_name}</TableCell>
                    <TableCell>Semester {result.semester}</TableCell>
                    <TableCell>{result.academic_year}</TableCell>
                    <TableCell className="font-semibold">{result.score?.toFixed(2) || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge className={getGradeColor(result.grade || 'F')}>
                        {result.grade}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={result.published ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400'}>
                        {result.published ? 'Published' : 'Draft'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleTogglePublish(result)}
                        >
                          {result.published ? 'Unpublish' : 'Publish'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditResult(result)}
                        >
                          <Edit className="h-4 w-4" />
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

      {/* Edit Result Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-black">
          <DialogHeader>
            <DialogTitle>Edit Final Result</DialogTitle>
            <DialogDescription>
              Update the final result for this student.
            </DialogDescription>
          </DialogHeader>
          {editingResult && (
            <div className="space-y-4">
              <div>
                <Label>Score</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={editingResult.score || 0}
                  onChange={(e) => setEditingResult({ ...editingResult, score: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Grade</Label>
                <Select
                  value={editingResult.grade || 'F'}
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
                <Label>Published</Label>
                <Select
                  value={editingResult.published.toString()}
                  onValueChange={(value) => setEditingResult({ ...editingResult, published: value === 'true' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">No</SelectItem>
                    <SelectItem value="true">Yes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  <X className="h-4 w-4 mr-2" /> Cancel
                </Button>
                <Button onClick={handleSaveResult} className="border border-primary hover:shadow-lg hover:shadow-blue-600">
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
