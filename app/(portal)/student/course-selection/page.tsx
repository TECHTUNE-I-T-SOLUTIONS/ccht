'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BookOpen, Clock, CheckCircle, XCircle, AlertCircle, Loader2, Filter, Search, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { Checkbox } from '@/components/ui/checkbox'
import Link from 'next/link'

type Course = {
  id: string
  code: string
  title: string
  credit_units: number
  level: string
  semester: number
  description?: string
  program_id: string
}

type Enrollment = {
  id: string
  program_id: string
  session: string
  status: string
  program?: {
    title: string
    department?: {
      name: string
    }
  }
}

type StudentProfile = {
  current_level: string
}

export default function CourseSelectionPage() {
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null)
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourseIds, setSelectedCourseIds] = useState<Set<string>>(new Set())
  const [pendingCourseIds, setPendingCourseIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [levelFilter, setLevelFilter] = useState('all')
  const [semesterFilter, setSemesterFilter] = useState('all')
  const [selectedSession, setSelectedSession] = useState('2026/2027')
  const [currentPage, setCurrentPage] = useState(1)
  const coursesPerPage = 20
  const supabase = createClient()

  const sessions = ['2031/2032', '2030/2031', '2029/2030', '2028/2029', '2027/2028', '2026/2027', '2025/2026', '2024/2025', '2023/2024', '2022/2023']

  useEffect(() => {
    loadData()
  }, [selectedSession])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, levelFilter, semesterFilter])

  const loadData = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [enrollmentRes, studentProfileRes, coursesRes, selectedRes] = await Promise.all([
        supabase.from('enrollments').select('*, program:programs(title, department:departments(name))').eq('student_id', user.id).eq('status', 'active').single(),
        supabase.from('student_profiles').select('current_level').eq('profile_id', user.id).single(),
        supabase.from('courses').select('*').order('code'),
        supabase.from('selected_courses').select('course_id').eq('student_id', user.id).eq('session', selectedSession).eq('status', 'pending')
      ])

      if (enrollmentRes.data) {
        setEnrollment(enrollmentRes.data)
      }
      if (studentProfileRes.data) {
        setStudentProfile(studentProfileRes.data)
      }
      if (coursesRes.data) {
        setCourses(coursesRes.data)
      }
      if (selectedRes.data) {
        const pendingIds = new Set(selectedRes.data.map(sc => sc.course_id))
        setPendingCourseIds(pendingIds)
      }
    } catch (error) {
      console.error('Failed to load data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const formatSemester = (semester: number): string => {
    return semester === 1 ? 'First Semester' : 'Second Semester'
  }

  const getLevelFromCourseCode = (courseCode: string): string => {
    const match = courseCode.match(/\d+/)
    if (!match) return '100'
    const number = parseInt(match[0])
    if (number >= 100 && number < 200) return '100'
    if (number >= 200 && number < 300) return '200'
    if (number >= 300 && number < 400) return '300'
    if (number >= 400 && number < 500) return '400'
    if (number >= 500) return '500'
    return '100'
  }

  const filteredCourses = courses.filter(course => {
    // Filter by program
    if (enrollment && course.program_id !== enrollment.program_id) return false
    
    // Filter by level - use the level column from database
    if (levelFilter !== 'all' && course.level !== levelFilter) return false
    
    // Filter by semester - semester is an integer (1 or 2)
    const courseSemester = course.semester
    const filterSemesterValue = semesterFilter === 'all' ? 'all' : semesterFilter
    if (filterSemesterValue !== 'all') {
      const filterNum = filterSemesterValue === 'first' ? 1 : 2
      if (courseSemester !== filterNum) return false
    }
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return course.code.toLowerCase().includes(query) || 
             course.title.toLowerCase().includes(query)
    }
    
    return true
  })

  // Pagination
  const totalPages = Math.ceil(filteredCourses.length / coursesPerPage)
  const startIndex = (currentPage - 1) * coursesPerPage
  const endIndex = startIndex + coursesPerPage
  const paginatedCourses = filteredCourses.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const toggleCourseSelection = (courseId: string) => {
    // Don't allow selecting courses that are already pending
    if (pendingCourseIds.has(courseId)) {
      toast.error('This course is already pending approval')
      return
    }
    const newSelection = new Set(selectedCourseIds)
    if (newSelection.has(courseId)) {
      newSelection.delete(courseId)
    } else {
      newSelection.add(courseId)
    }
    setSelectedCourseIds(newSelection)
  }

  const canSubmitSelection = () => {
    return selectedCourseIds.size > 0 && enrollment && studentProfile
  }

  const submitCourseSelection = async () => {
    if (!canSubmitSelection() || !enrollment) return

    setSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Check if there are already approved courses for this session
      const { data: existingSelections } = await supabase
        .from('selected_courses')
        .select('id, status')
        .eq('student_id', user.id)
        .eq('session', selectedSession)

      const hasApproved = existingSelections?.some(sc => sc.status === 'approved')

      if (hasApproved) {
        toast.error('Your course selection has already been approved. Contact your department to make changes.')
        return
      }

      // Delete existing pending selections for this session
      await supabase
        .from('selected_courses')
        .delete()
        .eq('student_id', user.id)
        .eq('session', selectedSession)
        .eq('status', 'pending')

      // Insert selected courses with their respective semesters from the course data
      const selections = Array.from(selectedCourseIds).map(courseId => {
        const course = courses.find(c => c.id === courseId)
        return {
          student_id: user.id,
          course_id: courseId,
          enrollment_id: enrollment.id,
          session: selectedSession,
          semester: course?.semester === 1 ? 'first' : 'second',
          status: 'pending'
        }
      })

      const { error } = await supabase.from('selected_courses').insert(selections)

      if (error) throw error

      toast.success('Course selection submitted successfully')
      setSelectedCourseIds(new Set())
      
      // Redirect back to courses page
      window.location.href = '/student/courses'
    } catch (error) {
      console.error('Failed to submit course selection:', error)
      toast.error('Failed to submit course selection')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!enrollment) {
    return (
      <div className="flex items-center justify-center p-8">
        <Card className="p-8 text-center max-w-md">
          <AlertCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold mb-2">No Active Enrollment</h2>
          <p className="text-muted-foreground">You must be enrolled in a program to select courses.</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild className="rounded-xl">
          <Link href="/student/courses">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Course Selection</h1>
          <p className="text-muted-foreground mt-1">
            Select courses for {enrollment.program?.title} - {selectedSession} Session
          </p>
        </div>
      </div>

      {/* Program Info Card */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">{enrollment.program?.title}</h2>
            <p className="text-sm text-muted-foreground">
              Department: {enrollment.program?.department?.name} · Level: {studentProfile?.current_level}L
            </p>
          </div>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">
              {selectedCourseIds.size} course{selectedCourseIds.size !== 1 ? 's' : ''} selected
            </span>
          </div>
        </div>
      </Card>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search courses by code or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-xl"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Select value={selectedSession} onValueChange={setSelectedSession}>
              <SelectTrigger className="w-[140px] rounded-xl">
                <SelectValue placeholder="Session" />
              </SelectTrigger>
              <SelectContent>
                {sessions.map(session => (
                  <SelectItem key={session} value={session}>{session}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-[140px] rounded-xl">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="100">100L</SelectItem>
                <SelectItem value="200">200L</SelectItem>
                <SelectItem value="300">300L</SelectItem>
                <SelectItem value="400">400L</SelectItem>
                <SelectItem value="500">500L</SelectItem>
              </SelectContent>
            </Select>
            <Select value={semesterFilter} onValueChange={setSemesterFilter}>
              <SelectTrigger className="w-[140px] rounded-xl">
                <SelectValue placeholder="Semester" />
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

      {/* Courses Grid */}
      {filteredCourses.length === 0 ? (
        <Card className="p-12 text-center">
          <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
          <p className="text-lg text-muted-foreground">No courses found</p>
          <p className="text-sm text-muted-foreground mt-2">Try adjusting your filters or search query</p>
        </Card>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''} available
              {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
            </p>
            <Button
              onClick={submitCourseSelection}
              disabled={!canSubmitSelection() || submitting}
              className="rounded-xl border border-primary hover:text-blue-600"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                `Submit Selection (${selectedCourseIds.size})`
              )}
            </Button>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {paginatedCourses.map((course) => {
              const isSelected = selectedCourseIds.has(course.id)
              const isPending = pendingCourseIds.has(course.id)
              return (
                <Card 
                  key={course.id} 
                  className={`p-6 transition-all hover:shadow-md ${
                    isSelected ? 'border-primary bg-primary/5' : ''
                  } ${isPending ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/20 opacity-75 cursor-not-allowed' : 'cursor-pointer'}`}
                  onClick={() => !isPending && toggleCourseSelection(course.id)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {!isPending && (
                          <Checkbox
                            checked={isSelected}
                            onChange={() => toggleCourseSelection(course.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        )}
                        <span className="font-bold text-lg">{course.code}</span>
                        {isPending && (
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Pending</span>
                        )}
                      </div>
                      <h3 className="font-semibold mb-1">{course.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {course.description || 'No description available'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{course.credit_units} Credits</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>{course.level}L</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>{formatSemester(Number(course.semester))}</span>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="mt-4 flex items-center gap-2 text-sm text-primary">
                      <CheckCircle className="h-4 w-4" />
                      <span>Selected</span>
                    </div>
                  )}
                </Card>
              )
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="rounded-xl"
              >
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    onClick={() => handlePageChange(page)}
                    className="rounded-xl w-10"
                  >
                    {page}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="rounded-xl"
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Selection Summary */}
      {selectedCourseIds.size > 0 && (
        <Card className="p-6 sticky bottom-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold">Selection Summary</h3>
              <p className="text-sm text-muted-foreground">
                {selectedCourseIds.size} course{selectedCourseIds.size !== 1 ? 's' : ''} selected
              </p>
            </div>
            <Button
              onClick={submitCourseSelection}
              disabled={submitting}
              className="rounded-xl border border-primary hover:text-blue-500 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Selection'
              )}
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
