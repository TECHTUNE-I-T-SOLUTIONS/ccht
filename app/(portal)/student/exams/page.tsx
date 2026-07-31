'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, Calendar, FileText, AlertCircle, CheckCircle, Play, Lock, Loader2, BookOpen, Hourglass } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

type ExamAttempt = {
  id: string
  status: string
  started_at: string | null
  submitted_at: string | null
  total_score: number | null
  percentage_score: number | null
  grade: string | null
  passed: boolean | null
}

type ExamSession = {
  id: string
  course_id: string
  exam_title: string
  exam_description: string
  exam_type: string
  duration_minutes: number
  total_marks: number
  passing_marks: number
  start_date: string
  end_date: string
  instructions: string
  is_published: boolean
  allow_review: boolean
  review_start_date: string | null
  review_end_date: string | null
  course: {
    code: string
    title: string
    credit_units: number
  } | null
  student_exam_attempts?: ExamAttempt[]
  attempt?: ExamAttempt | null
}

export default function StudentExamsPage() {
  const [exams, setExams] = useState<ExamSession[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadExams()
  }, [])

  const loadExams = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get student's enrolled courses first
      const { data: selectedCourses } = await supabase
        .from('selected_courses')
        .select('course_id')
        .eq('student_id', user.id)
        .eq('status', 'approved')

      const enrolledCourseIds = selectedCourses?.map(sc => sc.course_id) || []
      console.log('Enrolled course IDs:', enrolledCourseIds)

      if (enrolledCourseIds.length === 0) {
        console.log('No enrolled courses found')
        setExams([])
        return
      }

      // Fetch published exam sessions for enrolled courses only
      const { data: examsData, error: examsError } = await supabase
        .from('student_exam_sessions')
        .select(`
          id,
          course_id,
          exam_title,
          exam_description,
          exam_type,
          duration_minutes,
          total_marks,
          passing_marks,
          start_date,
          end_date,
          instructions,
          is_published,
          allow_review,
          review_start_date,
          review_end_date
        `)
        .eq('is_published', true)
        .in('course_id', enrolledCourseIds)
        .order('start_date', { ascending: true })

      console.log('Exams query result:', { examsData, examsError })

      if (examsError) {
        console.error('Query error:', examsError)
        toast.error('Failed to load exams')
        setExams([])
        return
      }

      if (!examsData || examsData.length === 0) {
        console.log('No published exams found for your courses')
        setExams([])
        return
      }

      // Fetch course details separately
      const courseIds = [...new Set(examsData.map(e => e.course_id))]
      console.log('Fetching courses for IDs:', courseIds)
      
      const { data: coursesData } = await supabase
        .from('courses')
        .select('id, code, title, credit_units, level, semester')
        .in('id', courseIds)

      console.log('Courses fetched:', coursesData?.length || 0)

      const coursesMap = new Map((coursesData || []).map(c => [c.id, c]))

      // Fetch attempts separately
      const { data: attemptsData } = await supabase
        .from('student_exam_attempts')
        .select('*')
        .eq('student_id', user.id)
        .in('exam_session_id', examsData.map(e => e.id))

      const attemptsMap = new Map((attemptsData || []).map(a => [a.exam_session_id, a]))

      // Merge data
      const formatted = examsData.map((exam: any) => ({
        ...exam,
        course: coursesMap.get(exam.course_id) || null,
        attempt: attemptsMap.get(exam.id) || null
      }))

      console.log('Exams loaded:', formatted.length, formatted)
      setExams(formatted)
    } catch (error: any) {
      console.error('Failed to load exams:', error)
      toast.error('Failed to load exams')
    } finally {
      setLoading(false)
    }
  }

  const getExamStatus = (exam: ExamSession) => {
    const now = new Date()
    const startDate = new Date(exam.start_date)
    const endDate = new Date(exam.end_date)

    if (exam.attempt) {
      switch (exam.attempt.status) {
        case 'in_progress':
          return { status: 'in_progress', label: 'In Progress', icon: Play, color: 'bg-blue-100 text-blue-700' }
        case 'submitted':
        case 'graded':
          return { status: 'completed', label: 'Completed', icon: CheckCircle, color: 'bg-green-100 text-green-700' }
        default:
          return { status: 'completed', label: 'Completed', icon: CheckCircle, color: 'bg-green-100 text-green-700' }
      }
    }

    if (now < startDate) {
      const daysUntil = Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      return { 
        status: 'upcoming', 
        label: daysUntil === 0 ? 'Starts today' : daysUntil === 1 ? 'Starts tomorrow' : `Starts in ${daysUntil} days`, 
        icon: Hourglass, 
        color: 'bg-yellow-100 text-yellow-700' 
      }
    }

    if (now >= startDate && now <= endDate) {
      return { status: 'available', label: 'Available', icon: Play, color: 'bg-green-100 text-green-700' }
    }

    return { status: 'expired', label: 'Expired', icon: Lock, color: 'bg-red-100 text-red-700' }
  }

  const canStartExam = (exam: ExamSession) => {
    const status = getExamStatus(exam)
    return status.status === 'available' && !exam.attempt
  }

  const canReviewExam = (exam: ExamSession) => {
    if (!exam.allow_review || !exam.review_start_date || !exam.review_end_date) return false
    const now = new Date()
    const reviewStart = new Date(exam.review_start_date)
    const reviewEnd = new Date(exam.review_end_date)
    return now >= reviewStart && now <= reviewEnd && exam.attempt
  }

  const startExam = (examId: string) => {
    window.location.href = `/student/exams/${examId}/take`
  }

  const reviewExam = (examId: string) => {
    window.location.href = `/student/exams/${examId}/review`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Examinations</h1>
        <p className="text-muted-foreground mt-1">View and take your scheduled examinations</p>
        <p className="text-xs text-muted-foreground mt-1">{exams.length} exam(s) found</p>
      </div>

      {exams.length === 0 ? (
        <Card className="rounded-[2.5rem] border p-12 text-center">
          <FileText className="mx-auto mb-4 h-16 w-16 text-muted-foreground opacity-50" />
          <p className="text-lg text-muted-foreground">No exams available</p>
          <p className="mt-2 text-sm text-muted-foreground">Exams will appear here when published by your instructors</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {exams.map((exam) => {
            const status = getExamStatus(exam)
            const StatusIcon = status.icon
            const isUpcoming = status.status === 'upcoming'
            
            return (
              <Card key={exam.id} className={`p-6 ${isUpcoming ? 'opacity-80' : ''}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <Badge className={status.color} variant="secondary">
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {status.label}
                    </Badge>
                    <h3 className="font-bold mt-2">{exam.exam_title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {exam.course?.code || 'N/A'} - {exam.course?.title || 'Unknown Course'}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{exam.duration_minutes} minutes</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Starts: {new Date(exam.start_date).toLocaleDateString('en-GB', { 
                      day: 'numeric', 
                      month: 'short', 
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Ends: {new Date(exam.end_date).toLocaleDateString('en-GB', { 
                      day: 'numeric', 
                      month: 'short', 
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <BookOpen className="h-4 w-4" />
                    <span>{exam.course?.credit_units || 0} Credit Units</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    <span>Total Marks: {exam.total_marks} | Pass: {exam.passing_marks}</span>
                  </div>

                  {exam.exam_description && (
                    <p className="text-xs text-muted-foreground italic mt-2 line-clamp-2">{exam.exam_description}</p>
                  )}

                  {exam.attempt && exam.attempt.percentage_score !== null && (
                    <div className="flex items-center gap-2 pt-1">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="font-semibold text-green-600">
                        Exam Completed
                      </span>
                    </div>
                  )}

                  {isUpcoming && (
                    <div className="flex items-center gap-2 pt-1">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <span className="text-xs text-yellow-600 font-medium">
                        Exam has not been activated yet. It will be available at the scheduled start time.
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-4 space-y-2">
                  {canStartExam(exam) && (
                    <Button 
                      onClick={() => startExam(exam.id)}
                      className="w-full rounded-xl border border-primary hover:text-blue-600 hover:shadow-lg hover:shadow-blue-200"
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Start Exam
                    </Button>
                  )}
                  
                  {status.status === 'in_progress' && (
                    <Button 
                      onClick={() => startExam(exam.id)}
                      className="w-full rounded-xl border border-primary hover:text-blue-600 hover:shadow-lg hover:shadow-blue-200"
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Continue Exam
                    </Button>
                  )}

                  {canReviewExam(exam) && (
                    <Button 
                      onClick={() => reviewExam(exam.id)}
                      variant="outline"
                      className="w-full rounded-xl border border-primary hover:text-blue-600 hover:shadow-lg hover:shadow-blue-200"
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Review Results
                    </Button>
                  )}

                  {isUpcoming && (
                    <Button 
                      disabled
                      variant="outline"
                      className="w-full rounded-xl cursor-not-allowed"
                    >
                      <Hourglass className="mr-2 h-4 w-4" />
                      Not Yet Available
                    </Button>
                  )}

                  {status.status === 'expired' && !exam.attempt && (
                    <Button 
                      disabled
                      variant="outline"
                      className="w-full rounded-xl"
                    >
                      <Lock className="mr-2 h-4 w-4" />
                      Exam Ended
                    </Button>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}