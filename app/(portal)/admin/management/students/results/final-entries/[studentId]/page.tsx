'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Loader2, Search, Edit, Save, X, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useIsMobile } from '@/hooks/use-mobile'
import { createClient } from '@/lib/supabase/client'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FinalResult = any

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Enrollment = any

type Session = {
  id: string
  name: string
}

export default function FinalEntriesPage() {
  const params = useParams()
  const studentId = params.studentId as string
  const supabase = createClient()

  const [student, setStudent] = useState<any>(null)
  const [finalResults, setFinalResults] = useState<FinalResult[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('score')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const isMobile = useIsMobile()
  const [editingResult, setEditingResult] = useState<FinalResult | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [resultToDelete, setResultToDelete] = useState<FinalResult | null>(null)
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
  const [availableCourses, setAvailableCourses] = useState<any[]>([])
  const [assessments, setAssessments] = useState<any[]>([])
  const [calculatingScore, setCalculatingScore] = useState(false)
  
  // Helper to calculate grade from score
  const calculateGrade = (score: number): string => {
    if (score >= 70) return 'A'
    if (score >= 60) return 'B'
    if (score >= 50) return 'C'
    if (score >= 45) return 'D'
    if (score >= 40) return 'E'
    return 'F'
  }

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

      // Load existing results with enrollment and session info
      const { data: resultsData, error: resultsError } = await supabase
        .from('results')
        .select(`
          *,
          enrollment:enrollments!results_enrollment_id_fkey(
            id,
            student_id,
            program_id,
            program:programs(title)
          )
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })

      if (resultsError) {
        console.error('Error loading results:', resultsError)
        // Fallback without explicit FK
        const { data: fallbackData } = await supabase
          .from('results')
          .select(`
            *,
            enrollment:enrollments(
              program:programs(title)
            )
          `)
          .eq('student_id', studentId)
          .order('created_at', { ascending: false })
        setFinalResults(fallbackData || [])
      } else {
        setFinalResults(resultsData || [])
      }

      // Load enrollments for this student with proper FK
      const [enrollmentsRes, sessionsRes] = await Promise.all([
        supabase
          .from('enrollments')
          .select(`
            id,
            student_id,
            program_id,
            session_id,
            student:profiles!enrollments_student_id_fkey(first_name, last_name, email, student_profiles(matric_number)),
            program:programs(title),
            selected_courses:selected_courses(
              course:courses(id, code, title)
            )
          `)
          .eq('student_id', studentId),
        supabase.from('academic_sessions').select('id, name').order('name')
      ])

      if (enrollmentsRes.error) {
        console.error('Error loading enrollments:', enrollmentsRes.error)
        toast.error('Failed to load enrollments')
      }
      if (sessionsRes.error) throw sessionsRes.error

      setEnrollments(enrollmentsRes.data || [])
      setSessions(sessionsRes.data || [])
      
      // Load assessments for this student - fetch course_id directly
      const { data: assessmentsData, error: assessmentsError } = await supabase
        .from('assessments')
        .select('*')
        .eq('student_id', studentId)
      
      if (assessmentsError) {
        console.error('Error loading assessments:', assessmentsError)
      }
      
      console.log('Assessments loaded:', assessmentsData?.length || 0, assessmentsData)
      setAssessments(assessmentsData || [])
      
      // Get all course IDs from assessments
      const assessmentCourseIds = (assessmentsData || []).map((a: any) => a.course_id).filter(Boolean)
      
      // Get all course IDs from selected_courses
      const selectedCourseIds: string[] = []
      for (const enrollment of (enrollmentsRes.data || [])) {
        for (const sc of (enrollment.selected_courses || [])) {
          const course = sc.course?.[0]
          if (course?.id) {
            selectedCourseIds.push(course.id)
          }
        }
      }
      
      // Combine all course IDs and fetch course details
      const allCourseIds = [...new Set([...assessmentCourseIds, ...selectedCourseIds])]
      console.log('All course IDs to fetch:', allCourseIds)
      
      let coursesMap: Map<string, any> = new Map()
      if (allCourseIds.length > 0) {
        const { data: coursesData } = await supabase
          .from('courses')
          .select('id, code, title')
          .in('id', allCourseIds)
        
        console.log('Courses fetched:', coursesData?.length || 0, coursesData)
        coursesMap = new Map((coursesData || []).map((c: any) => [c.id, c]))
      }
      
      // Build available courses list
      const coursesFromAssessments: any[] = []
      const seenCourseIds = new Set<string>()
      
      // First add courses that have assessments
      for (const assessment of (assessmentsData || [])) {
        const courseId = assessment.course_id
        if (courseId && !seenCourseIds.has(courseId)) {
          seenCourseIds.add(courseId)
          const course = coursesMap.get(courseId)
          if (course) {
            // Find the enrollment_id from the assessment itself
            const enrollmentId = assessment.enrollment_id
            // Find session_id from the enrollment
            const matchingEnrollment = (enrollmentsRes.data || []).find((e: any) => e.id === enrollmentId)
            
            coursesFromAssessments.push({
              id: course.id,
              code: course.code,
              title: course.title,
              enrollment_id: enrollmentId || matchingEnrollment?.id || '',
              session_id: matchingEnrollment?.session_id || '',
              hasAssessment: true,
              assessment: assessment
            })
          }
        }
      }
      
      // Then add courses from selected_courses that don't have assessments
      for (const enrollment of (enrollmentsRes.data || [])) {
        for (const sc of (enrollment.selected_courses || [])) {
          const course = sc.course?.[0]
          if (course && !seenCourseIds.has(course.id)) {
            seenCourseIds.add(course.id)
            const fullCourse = coursesMap.get(course.id) || course
            coursesFromAssessments.push({
              id: fullCourse.id,
              code: fullCourse.code,
              title: fullCourse.title,
              enrollment_id: enrollment.id,
              session_id: enrollment.session_id,
              hasAssessment: false,
              assessment: null
            })
          }
        }
      }
      
      setAvailableCourses(coursesFromAssessments)
      console.log('Available courses built:', coursesFromAssessments.length, coursesFromAssessments)
      
    } catch (error) {
      console.error('Failed to load data:', error)
      toast.error('Failed to load student data')
    } finally {
      setLoading(false)
    }
  }
  
  // Handle course selection and auto-calculate score from assessment
  const handleCourseSelect = (courseId: string) => {
    const course = availableCourses.find((c: any) => c.id === courseId)
    if (!course) {
      console.log('Course not found:', courseId)
      return
    }
    
    setCalculatingScore(true)
    
    // Use the assessment stored in the course object, or find it
    const assessment = course.assessment || assessments.find((a: any) => a.course_id === courseId)
    
    if (assessment) {
      // Calculate total score from assessment components
      // ca_1 + ca_2 + assignments + exam_score = total_score
      const ca1 = parseFloat(assessment.ca_1) || 0
      const ca2 = parseFloat(assessment.ca_2) || 0
      const assignments = parseFloat(assessment.assignments) || 0
      const examScore = parseFloat(assessment.exam_score) || 0
      const totalScore = ca1 + ca2 + assignments + examScore
      
      const grade = calculateGrade(totalScore)
      
      console.log('Auto-calculated score:', { ca1, ca2, assignments, examScore, totalScore, grade, assessmentId: assessment.id })
      
      setNewResult(prev => ({
        ...prev,
        enrollment_id: course.enrollment_id || prev.enrollment_id,
        assessment_id: assessment.id || '',
        course_name: `${course.code} - ${course.title}`,
        score: totalScore,
        grade: grade,
        academic_year: sessions.find((s: any) => s.id === course.session_id)?.name || prev.academic_year
      }))
    } else {
      // No assessment found, just set the course name
      setNewResult(prev => ({
        ...prev,
        enrollment_id: course.enrollment_id || prev.enrollment_id,
        assessment_id: '',
        course_name: `${course.code} - ${course.title}`,
        score: 0,
        grade: 'F'
      }))
    }
    
    setCalculatingScore(false)
  }
  
  // Get suggested assessment for display
  const getAssessmentForCourse = (courseId: string) => {
    return assessments.find((a: any) => a.course_id === courseId)
  }

  const handleEditResult = (result: FinalResult) => {
    setEditingResult(result)
    setEditDialogOpen(true)
  }

  const handleTogglePublish = async (result: FinalResult) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase
        .from('results')
        .update({
          published: !result.published,
          published_at: !result.published ? new Date().toISOString() : null,
          published_by: !result.published ? user?.id : null
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
    if (!newResult.enrollment_id) {
      toast.error('Please select an enrollment')
      return
    }
    if (!newResult.course_name) {
      toast.error('Please enter a course name')
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      const isPublished = newResult.published
      
      const { error } = await supabase
        .from('results')
        .insert({
          student_id: studentId,
          enrollment_id: newResult.enrollment_id,
          assessment_id: newResult.assessment_id || null,
          course_name: newResult.course_name,
          score: newResult.score || null,
          grade: newResult.grade || null,
          semester: newResult.semester,
          academic_year: newResult.academic_year,
          published: isPublished,
          published_at: isPublished ? new Date().toISOString() : null,
          published_by: isPublished ? user?.id : null
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

  const handleDeleteResult = async () => {
    if (!resultToDelete) return
    try {
      const { error } = await supabase
        .from('results')
        .delete()
        .eq('id', resultToDelete.id)

      if (error) throw error
      toast.success('Result deleted successfully')
      setDeleteDialogOpen(false)
      setResultToDelete(null)
      loadData()
    } catch (error) {
      console.error('Failed to delete result:', error)
      toast.error('Failed to delete result')
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

  const filteredResults = finalResults.filter((result: any) => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch =
      result.course_name?.toLowerCase().includes(searchLower) ||
      result.academic_year?.toLowerCase().includes(searchLower) ||
      result.grade?.toLowerCase().includes(searchLower)
    
    const matchesStatus = statusFilter === 'all' || result.grade === statusFilter
    
    return matchesSearch && matchesStatus
  }).sort((a: any, b: any) => {
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
                <Label>Enrollment (Student & Program)</Label>
                <Select
                  value={newResult.enrollment_id}
                  onValueChange={(value) => {
                    setNewResult({ ...newResult, enrollment_id: value })
                    const selectedEnrollment = enrollments.find((e: any) => e.id === value)
                    if (selectedEnrollment) {
                      const session = sessions.find((s: any) => s.id === selectedEnrollment.session_id)
                      if (session) {
                        setNewResult(prev => ({ ...prev, academic_year: session.name }))
                      }
                    }
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select enrollment" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {enrollments.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">No enrollments found</div>
                    ) : (
                      enrollments.map((enrollment: any) => {
                        const student = enrollment.student || {}
                        const program = enrollment.program || {}
                        const matricNumber = student?.student_profiles?.matric_number || ''
                        const courseCodes = enrollment.selected_courses
                          ?.map((sc: any) => sc.course?.[0]?.code)
                          .filter(Boolean)
                          .join(', ') || ''
                        const session = sessions.find((s: any) => s.id === enrollment.session_id)
                        
                        const displayText = [
                          student?.first_name && student?.last_name ? `${student.first_name} ${student.last_name}` : 'Unknown Student',
                          matricNumber ? `(${matricNumber})` : '',
                          '-',
                          program?.title || 'No Program',
                          session ? `[${session.name}]` : '',
                          courseCodes ? `(${courseCodes})` : ''
                        ].filter(Boolean).join(' ')
                        
                        return (
                          <SelectItem key={enrollment.id} value={enrollment.id}>
                            {displayText}
                          </SelectItem>
                        )
                      })
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Course (Courses with Assessments)</Label>
                <Select
                  value={availableCourses.find((c: any) => c.code === newResult.course_name.split(' - ')[0])?.id || ''}
                  onValueChange={(value) => handleCourseSelect(value)}
                  disabled={calculatingScore}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={calculatingScore ? "Calculating score..." : "Select a course to auto-fill"} />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {availableCourses.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">No courses with assessments found. Ensure assessments exist for this student.</div>
                    ) : (
                      availableCourses.map((course: any) => {
                        const hasAssessment = course.hasAssessment
                        const assessment = course.assessment
                        const scoreText = hasAssessment && assessment
                          ? ` (Score: ${(parseFloat(assessment.ca_1) || 0) + (parseFloat(assessment.ca_2) || 0) + (parseFloat(assessment.assignments) || 0) + (parseFloat(assessment.exam_score) || 0)})`
                          : ''
                        return (
                          <SelectItem key={course.id} value={course.id}>
                            {course.code} - {course.title}
                            {hasAssessment ? ` ✓${scoreText}` : ' (no assessment)'}
                          </SelectItem>
                        )
                      })
                    )}
                  </SelectContent>
                </Select>
                {newResult.course_name && (
                  <p className="text-xs text-muted-foreground mt-1">Selected: {newResult.course_name}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Score (0-100) - Auto-calculated from Assessment</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={newResult.score}
                    onChange={(e) => {
                      const score = parseFloat(e.target.value) || 0
                      setNewResult({ ...newResult, score, grade: calculateGrade(score) })
                    }}
                  />
                  {calculatingScore && <p className="text-xs text-blue-600 mt-1">Calculating score from assessment data...</p>}
                </div>
                <div>
                  <Label>Grade (Auto-calculated)</Label>
                  <Select
                    value={newResult.grade}
                    onValueChange={(value) => setNewResult({ ...newResult, grade: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">A (70-100)</SelectItem>
                      <SelectItem value="B">B (60-69)</SelectItem>
                      <SelectItem value="C">C (50-59)</SelectItem>
                      <SelectItem value="D">D (45-49)</SelectItem>
                      <SelectItem value="E">E (40-44)</SelectItem>
                      <SelectItem value="F">F (0-39)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">Grade auto-calculated from score. You can override.</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Semester</Label>
                  <Select
                    value={newResult.semester.toString()}
                    onValueChange={(value) => setNewResult({ ...newResult, semester: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">First Semester</SelectItem>
                      <SelectItem value="2">Second Semester</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Academic Year</Label>
                  <Select
                    value={newResult.academic_year}
                    onValueChange={(value) => setNewResult({ ...newResult, academic_year: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {sessions.map((session: any) => (
                        <SelectItem key={session.id} value={session.name}>
                          {session.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                    <SelectItem value="false">No (Draft)</SelectItem>
                    <SelectItem value="true">Yes (Published)</SelectItem>
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
            {filteredResults.map((result: any) => (
              <Card key={result.id} className="p-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{result.course_name}</p>
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
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setResultToDelete(result); setDeleteDialogOpen(true); }}
                      className="text-red-600 hover:text-red-700 hover:border-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
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
                {filteredResults.map((result: any) => (
                  <TableRow key={result.id}>
                    <TableCell>{result.course_name}</TableCell>
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
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { setResultToDelete(result); setDeleteDialogOpen(true); }}
                          className="text-red-600 hover:text-red-700 hover:border-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
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
                <Label>Course</Label>
                <p className="text-sm font-medium">{editingResult.course_name}</p>
              </div>
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
                    <SelectItem value="false">No (Draft)</SelectItem>
                    <SelectItem value="true">Yes (Published)</SelectItem>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-black">
          <DialogHeader>
            <DialogTitle>Delete Final Result</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this result? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {resultToDelete && (
            <div className="space-y-4">
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
                <h4 className="font-semibold text-red-900 dark:text-red-100 mb-2">Result Details</h4>
                <div className="space-y-1 text-sm text-red-800 dark:text-red-200">
                  <p><strong>Course:</strong> {resultToDelete.course_name}</p>
                  <p><strong>Score:</strong> {resultToDelete.score?.toFixed(2) || 'N/A'}</p>
                  <p><strong>Grade:</strong> {resultToDelete.grade}</p>
                  <p><strong>Semester:</strong> {resultToDelete.semester}</p>
                  <p><strong>Academic Year:</strong> {resultToDelete.academic_year}</p>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteResult}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Result
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}