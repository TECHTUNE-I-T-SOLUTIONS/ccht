'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { BookOpen, Search, Filter, Check, AlertCircle, GraduationCap, Clock3, RulerDimensionLine } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

type Course = {
  id: string
  code: string
  title: string
  description: string
  credits: number
  level: string
  semester: string
  program_id: string | null
  prerequisite_id: string | null
}

type SelectedCourse = {
  id: string
  course_id: string
  status: 'pending' | 'approved' | 'rejected'
  session: string
  semester: string
  course: Course
}

type Enrollment = {
  id: string
  program: {
    id: string
    title: string
    department: {
      id: string
      name: string
    }
  }
}

export default function CoursesPage() {
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourses, setSelectedCourses] = useState<SelectedCourse[]>([])
  const [selectedCourseIds, setSelectedCourseIds] = useState<Set<string>>(new Set())
  const [studentProfile, setStudentProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [levelFilter, setLevelFilter] = useState('all')
  const [semesterFilter, setSemesterFilter] = useState('all')
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [enrollmentRes, coursesRes, selectedRes, studentProfileRes] = await Promise.all([
        supabase
          .from('enrollments')
          .select('*, program:programs(id, title, department:departments(id, name))')
          .eq('student_id', user.id)
          .eq('status', 'active')
          .single(),
        supabase
          .from('courses')
          .select('*')
          .order('code', { ascending: true }),
        supabase
          .from('selected_courses')
          .select('*, course:courses(*)')
          .eq('student_id', user.id)
          .eq('session', '2026/2027'),
        supabase
          .from('student_profiles')
          .select('current_level')
          .eq('profile_id', user.id)
          .single()
      ])

      setEnrollment(enrollmentRes.data)
      setCourses(coursesRes.data || [])
      setSelectedCourses(selectedRes.data || [])
      
      // Set selected course IDs from pending selections
      const pendingIds = new Set(
        (selectedRes.data || [])
          .filter((sc: any) => sc.status === 'pending')
          .map((sc: any) => sc.course_id)
      )
      setSelectedCourseIds(pendingIds)
    } catch (error) {
      console.error(error)
      toast.error('Failed to load courses')
    } finally {
      setLoading(false)
    }
  }

  const getStudentLevel = () => {
    return studentProfile?.current_level || '100'
  }

  const filterCourses = () => {
    const studentLevel = getStudentLevel()
    const programId = enrollment?.program?.id

    return courses.filter(course => {
      // Filter by program
      if (programId && course.program_id !== programId) return false
      
      // Filter by level (show courses for current level and below)
      const courseLevel = parseInt(course.level)
      const studentLevelNum = parseInt(studentLevel)
      if (levelFilter !== 'all') {
        if (levelFilter === studentLevel && courseLevel !== studentLevelNum) return false
        if (levelFilter === 'below' && courseLevel >= studentLevelNum) return false
      } else {
        // Default: show courses for current level
        if (courseLevel !== studentLevelNum) return false
      }
      
      // Filter by semester
      if (semesterFilter !== 'all' && course.semester !== semesterFilter) return false
      
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return (
          course.code.toLowerCase().includes(query) ||
          course.title.toLowerCase().includes(query) ||
          course.description?.toLowerCase().includes(query)
        )
      }
      
      return true
    })
  }

  const toggleCourseSelection = (courseId: string) => {
    const newSelected = new Set(selectedCourseIds)
    if (newSelected.has(courseId)) {
      newSelected.delete(courseId)
    } else {
      newSelected.add(courseId)
    }
    setSelectedCourseIds(newSelected)
  }

  const submitCourseSelection = async () => {
    if (selectedCourseIds.size === 0) {
      toast.error('Please select at least one course')
      return
    }

    setSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const semester = semesterFilter === 'all' ? 'first' : semesterFilter
      
      // Delete existing pending selections for this session/semester
      await supabase
        .from('selected_courses')
        .delete()
        .eq('student_id', user.id)
        .eq('session', '2026/2027')
        .eq('semester', semester)
        .eq('status', 'pending')

      // Insert new selections
      const selections = Array.from(selectedCourseIds).map(courseId => ({
        student_id: user.id,
        course_id: courseId,
        enrollment_id: enrollment?.id,
        session: '2026/2027',
        semester: semester,
        status: 'pending'
      }))

      const { error } = await supabase
        .from('selected_courses')
        .insert(selections)

      if (error) throw error

      toast.success('Course selection submitted for approval')
      loadData()
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || 'Failed to submit course selection')
    } finally {
      setSubmitting(false)
    }
  }

  const canSubmitSelection = () => {
    // Check if there are any approved courses for this session
    const hasApproved = selectedCourses.some(
      sc => sc.status === 'approved' && sc.session === '2026/2027'
    )
    return !hasApproved && selectedCourseIds.size > 0
  }

  const filteredCourses = filterCourses()
  const studentLevel = getStudentLevel()
  const hasApprovedSelections = selectedCourses.some(sc => sc.status === 'approved')

  if (loading) return <div className="p-8">Loading courses...</div>

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-border bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.12),transparent_30%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--accent-soft)))] p-6 md:p-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Course Registration</p>
            <h1 className="mt-2 text-3xl font-extrabold md:text-5xl">Select Your Courses</h1>
            <p className="mt-1 text-sm text-foreground/75">
              {enrollment?.program ? (
                <>
                  <span className="font-semibold">{enrollment.program.title}</span>
                  <span className="mx-2">•</span>
                  <span>{enrollment.program.department.name}</span>
                  <span className="mx-2">•</span>
                  <span>{studentLevel} Level</span>
                </>
              ) : (
                'No active enrollment found'
              )}
            </p>
          </div>
          {hasApprovedSelections && (
            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
              <Check className="mr-1 h-3 w-3" />
              Courses Approved
            </Badge>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-xl"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-[140px] rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{studentLevel} Level</SelectItem>
                <SelectItem value="below">Below {studentLevel}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Select value={semesterFilter} onValueChange={setSemesterFilter}>
              <SelectTrigger className="w-[140px] rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Semesters</SelectItem>
                <SelectItem value="first">First Semester</SelectItem>
                <SelectItem value="second">Second Semester</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Course Selection Status */}
      {selectedCourses.length > 0 && (
        <Card className="p-6 bg-primary/5 border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <GraduationCap className="h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold">Course Selection Status</p>
                <p className="text-sm text-muted-foreground">
                  {selectedCourses.filter(sc => sc.status === 'pending').length} pending · 
                  {selectedCourses.filter(sc => sc.status === 'approved').length} approved · 
                  {selectedCourses.filter(sc => sc.status === 'rejected').length} rejected
                </p>
              </div>
            </div>
            {hasApprovedSelections && (
              <Button asChild variant="outline" className="rounded-xl">
                <a href="/student/course-form">
                  <RulerDimensionLine className="mr-2 h-4 w-4" />
                  View Course Form
                </a>
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Courses Grid */}
      {filteredCourses.length === 0 ? (
        <Card className="p-12 text-center">
          <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
          <p className="text-lg text-muted-foreground">No courses found</p>
          <p className="text-sm text-muted-foreground mt-2 mb-4">Try adjusting your filters or search query</p>
          {!hasApprovedSelections && enrollment && (
            <Button asChild className="rounded-xl">
              <a href="/student/courses">Select Courses</a>
            </Button>
          )}
        </Card>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''} available
            </p>
            {!hasApprovedSelections && (
              <Button
                onClick={submitCourseSelection}
                disabled={!canSubmitSelection() || submitting}
                className="rounded-xl"
              >
                {submitting ? 'Submitting...' : `Submit Selection (${selectedCourseIds.size})`}
              </Button>
            )}
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredCourses.map((course) => {
              const isSelected = selectedCourseIds.has(course.id)
              const existingSelection = selectedCourses.find(sc => sc.course_id === course.id)
              const isApproved = existingSelection?.status === 'approved'
              const isRejected = existingSelection?.status === 'rejected'
              
              return (
                <Card 
                  key={course.id} 
                  className={`p-6 transition-all hover:shadow-md cursor-pointer ${
                    isSelected ? 'border-primary bg-primary/5' : ''
                  } ${isApproved ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' : ''}
                  ${isRejected ? 'border-red-500 bg-red-50 dark:bg-red-950/20' : ''}
                  ${hasApprovedSelections ? 'opacity-60 cursor-not-allowed' : ''}
                `}
                  onClick={() => !hasApprovedSelections && !isApproved && toggleCourseSelection(course.id)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-bold text-primary">{course.code}</span>
                        <Badge variant="outline" className="text-xs">
                          {course.level}L
                        </Badge>
                        <Badge variant="outline" className="text-xs capitalize">
                          {course.semester}
                        </Badge>
                      </div>
                      <h3 className="font-semibold mb-1">{course.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>
                    </div>
                    {!hasApprovedSelections && !isApproved && (
                      <Checkbox checked={isSelected} />
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <RulerDimensionLine className="h-4 w-4" />
                      <span>{course.credits} credit{course.credits !== 1 ? 's' : ''}</span>
                    </div>
                    {isApproved && (
                      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                        <Check className="mr-1 h-3 w-3" />
                        Approved
                      </Badge>
                    )}
                    {isRejected && (
                      <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                        <AlertCircle className="mr-1 h-3 w-3" />
                        Rejected
                      </Badge>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        </>
      )}

      {hasApprovedSelections && (
        <Card className="p-6 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <div>
              <p className="font-semibold text-amber-900 dark:text-amber-100">Course Selection Locked</p>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Your course selection has been approved. Contact your department if you need to make changes.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
