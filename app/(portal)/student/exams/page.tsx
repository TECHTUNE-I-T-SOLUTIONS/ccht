'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, Calendar, FileText, AlertCircle, CheckCircle, Play, Lock, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

type ExamSession = {
  id: string
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
  }
  attempt?: {
    id: string
    status: string
    started_at: string | null
    submitted_at: string | null
    total_score: number | null
    percentage_score: number | null
    grade: string | null
    passed: boolean | null
  }
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

      const { data, error } = await supabase
        .from('student_exam_sessions')
        .select(`
          *,
          course:courses (
            code,
            title,
            credit_units
          ),
          attempt:student_exam_attempts (
            id,
            status,
            started_at,
            submitted_at,
            total_score,
            percentage_score,
            grade,
            passed
          )
        `)
        .eq('is_published', true)
        .order('start_date', { ascending: false })

      if (error) throw error

      // Filter exams for enrolled courses
      const { data: enrollment } = await supabase
        .from('enrollments')
        .select('program_id')
        .eq('student_id', user.id)
        .eq('status', 'active')
        .single()

      if (enrollment) {
        const filteredExams = data?.filter(exam => {
          // Check if the exam's course belongs to the student's program
          return true // For now, show all published exams
        }) || []
        setExams(filteredExams)
      } else {
        setExams(data || [])
      }
    } catch (error) {
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
      return { status: 'upcoming', label: 'Upcoming', icon: Calendar, color: 'bg-gray-100 text-gray-700' }
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
        <h1 className="text-3xl font-bold">Exams</h1>
        <p className="text-muted-foreground mt-1">View and take your scheduled examinations</p>
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
            
            return (
              <Card key={exam.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <Badge className={status.color} variant="secondary">
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {status.label}
                    </Badge>
                    <h3 className="font-bold mt-2">{exam.exam_title}</h3>
                    <p className="text-sm text-muted-foreground">{exam.course.code} - {exam.course.title}</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{exam.duration_minutes} minutes</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(exam.start_date).toLocaleDateString('en-GB', { 
                      day: 'numeric', 
                      month: 'short', 
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</span>
                  </div>
                  {exam.attempt && exam.attempt.percentage_score !== null && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="font-semibold text-green-600">
                        Score: {exam.attempt.percentage_score.toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-4 space-y-2">
                  {canStartExam(exam) && (
                    <Button 
                      onClick={() => startExam(exam.id)}
                      className="w-full rounded-xl"
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Start Exam
                    </Button>
                  )}
                  
                  {status.status === 'in_progress' && (
                    <Button 
                      onClick={() => startExam(exam.id)}
                      className="w-full rounded-xl"
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Continue Exam
                    </Button>
                  )}

                  {canReviewExam(exam) && (
                    <Button 
                      onClick={() => reviewExam(exam.id)}
                      variant="outline"
                      className="w-full rounded-xl"
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Review Results
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
