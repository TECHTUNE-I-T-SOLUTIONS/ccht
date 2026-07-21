'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen, Check, AlertCircle, GraduationCap, Clock, Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'

type Course = {
  id: string
  code: string
  title: string
  description?: string
  credit_units: number
  level: string
  semester: number
  program_id: string
}

type SelectedCourse = {
  id: string
  course_id: string
  status: 'pending' | 'approved' | 'rejected'
  session: string
  semester: string
  created_at: string
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

type StudentProfile = {
  current_level: string
}

export default function CoursesPage() {
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null)
  const [selectedCourses, setSelectedCourses] = useState<SelectedCourse[]>([])
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedSession, setSelectedSession] = useState('2026/2027')
  const [activeTab, setActiveTab] = useState('all')
  const supabase = createClient()

  const sessions = ['2031/2032', '2030/2031', '2029/2030', '2028/2029', '2027/2028', '2026/2027', '2025/2026', '2024/2025', '2023/2024', '2022/2023']

  useEffect(() => {
    loadData()
  }, [selectedSession])

  const loadData = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [enrollmentRes, selectedRes, studentProfileRes] = await Promise.all([
        supabase
          .from('enrollments')
          .select('*, program:programs(id, title, department:departments(id, name))')
          .eq('student_id', user.id)
          .eq('status', 'active')
          .single(),
        supabase
          .from('selected_courses')
          .select('*, course:courses(*)')
          .eq('student_id', user.id)
          .eq('session', selectedSession)
          .order('created_at', { ascending: false }),
        supabase
          .from('student_profiles')
          .select('current_level')
          .eq('profile_id', user.id)
          .single()
      ])

      setEnrollment(enrollmentRes.data)
      setSelectedCourses(selectedRes.data || [])
      setStudentProfile(studentProfileRes.data)
    } catch (error) {
      console.error(error)
      toast.error('Failed to load courses')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
            <Check className="mr-1 h-3 w-3" />
            Approved
          </Badge>
        )
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
            <AlertCircle className="mr-1 h-3 w-3" />
            Rejected
          </Badge>
        )
      default:
        return (
          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        )
    }
  }

  const formatSemester = (semester: number): string => {
    return semester === 1 ? 'First Semester' : 'Second Semester'
  }

  const hasSubmittedSelections = selectedCourses.length > 0
  const hasApprovedSelections = selectedCourses.some(sc => sc.status === 'approved')

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-border bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.12),transparent_30%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--accent-soft)))] p-6 md:p-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">My Courses</p>
            <h1 className="mt-2 text-3xl font-extrabold md:text-5xl">Course Registration</h1>
            <p className="mt-1 text-sm text-foreground/75">
              {enrollment?.program ? (
                <>
                  <span className="font-semibold">{enrollment.program.title}</span>
                  <span className="mx-2">•</span>
                  <span>{enrollment.program.department.name}</span>
                  <span className="mx-2">•</span>
                  <span>{studentProfile?.current_level || '100'} Level</span>
                </>
              ) : (
                'No active enrollment found'
              )}
            </p>
          </div>
          {!hasApprovedSelections && (
            <Button asChild className="rounded-xl gap-2">
              <Link href="/student/course-selection">
                <Plus className="h-4 w-4" />
                {hasSubmittedSelections ? 'Add More Courses' : 'Select Courses'}
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Session Filter */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium">Academic Session:</label>
          <Select value={selectedSession} onValueChange={setSelectedSession}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sessions.map(session => (
                <SelectItem key={session} value={session}>{session}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Course Selection Status */}
      {hasSubmittedSelections && (
        <Card className="p-6 bg-primary/5 border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <GraduationCap className="h-5 w-5 text-primary" />
              <div>
                <p className="font-semibold">Course Selection Status - {selectedSession}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedCourses.filter(sc => sc.status === 'pending').length} pending · 
                  {selectedCourses.filter(sc => sc.status === 'approved').length} approved · 
                  {selectedCourses.filter(sc => sc.status === 'rejected').length} rejected
                </p>
              </div>
            </div>
            {!hasApprovedSelections && (
              <Button asChild variant="outline" className="rounded-xl gap-2">
                <Link href="/student/course-selection">
                  <Plus className="h-4 w-4" />
                  Add More Courses
                </Link>
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Courses List */}
      {!hasSubmittedSelections ? (
        <Card className="p-12 text-center">
          <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No Courses Selected Yet</h3>
          <p className="text-sm text-muted-foreground mb-6">
            You haven't submitted your course selection for the {selectedSession} session.
          </p>
          <Button asChild className="rounded-xl gap-2">
            <Link href="/student/course-selection">
              <Plus className="h-4 w-4" />
              Select Courses Now
            </Link>
          </Button>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 border border-primary">
            <TabsTrigger value="all">All ({selectedCourses.length})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({selectedCourses.filter(sc => sc.status === 'pending').length})</TabsTrigger>
            <TabsTrigger value="approved">Approved ({selectedCourses.filter(sc => sc.status === 'approved').length})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({selectedCourses.filter(sc => sc.status === 'rejected').length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            {selectedCourses.length === 0 ? (
              <Card className="p-12 text-center">
                <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                <p className="text-lg text-muted-foreground">No courses found for this session</p>
              </Card>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Semester</TableHead>
                      <TableHead>Credits</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedCourses.map((selectedCourse) => (
                      <TableRow key={selectedCourse.id}>
                        <TableCell className="font-medium">{selectedCourse.course.code}</TableCell>
                        <TableCell>{selectedCourse.course.title}</TableCell>
                        <TableCell>{selectedCourse.course.level}L</TableCell>
                        <TableCell>{formatSemester(selectedCourse.course.semester)}</TableCell>
                        <TableCell>{selectedCourse.course.credit_units}</TableCell>
                        <TableCell>{getStatusBadge(selectedCourse.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="pending" className="mt-6">
            {selectedCourses.filter(sc => sc.status === 'pending').length === 0 ? (
              <Card className="p-12 text-center">
                <Clock className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                <p className="text-lg text-muted-foreground">No pending courses</p>
              </Card>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Semester</TableHead>
                      <TableHead>Credits</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedCourses.filter(sc => sc.status === 'pending').map((selectedCourse) => (
                      <TableRow key={selectedCourse.id}>
                        <TableCell className="font-medium">{selectedCourse.course.code}</TableCell>
                        <TableCell>{selectedCourse.course.title}</TableCell>
                        <TableCell>{selectedCourse.course.level}L</TableCell>
                        <TableCell>{formatSemester(selectedCourse.course.semester)}</TableCell>
                        <TableCell>{selectedCourse.course.credit_units}</TableCell>
                        <TableCell>{getStatusBadge(selectedCourse.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="approved" className="mt-6">
            {selectedCourses.filter(sc => sc.status === 'approved').length === 0 ? (
              <Card className="p-12 text-center">
                <Check className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                <p className="text-lg text-muted-foreground">No approved courses</p>
              </Card>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Semester</TableHead>
                      <TableHead>Credits</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedCourses.filter(sc => sc.status === 'approved').map((selectedCourse) => (
                      <TableRow key={selectedCourse.id}>
                        <TableCell className="font-medium">{selectedCourse.course.code}</TableCell>
                        <TableCell>{selectedCourse.course.title}</TableCell>
                        <TableCell>{selectedCourse.course.level}L</TableCell>
                        <TableCell>{formatSemester(selectedCourse.course.semester)}</TableCell>
                        <TableCell>{selectedCourse.course.credit_units}</TableCell>
                        <TableCell>{getStatusBadge(selectedCourse.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="rejected" className="mt-6">
            {selectedCourses.filter(sc => sc.status === 'rejected').length === 0 ? (
              <Card className="p-12 text-center">
                <AlertCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                <p className="text-lg text-muted-foreground">No rejected courses</p>
              </Card>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Semester</TableHead>
                      <TableHead>Credits</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedCourses.filter(sc => sc.status === 'rejected').map((selectedCourse) => (
                      <TableRow key={selectedCourse.id}>
                        <TableCell className="font-medium">{selectedCourse.course.code}</TableCell>
                        <TableCell>{selectedCourse.course.title}</TableCell>
                        <TableCell>{selectedCourse.course.level}L</TableCell>
                        <TableCell>{formatSemester(selectedCourse.course.semester)}</TableCell>
                        <TableCell>{selectedCourse.course.credit_units}</TableCell>
                        <TableCell>{getStatusBadge(selectedCourse.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
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
