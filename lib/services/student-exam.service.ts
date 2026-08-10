import { createClient as createServerClient } from '@/lib/supabase/server'
import { createPublicClient } from '@/lib/supabase/public'
import { createAdminClient } from '@/lib/supabase/admin'

export type StudentExamSession = {
  id: string
  course_id: string
  session_id: string
  semester_id: string
  exam_title: string
  exam_description?: string
  exam_type: string
  start_date: string
  end_date: string
  duration_minutes: number
  total_marks: number
  passing_marks: number
  instructions?: string
  is_published: boolean
  published_at?: string
  published_by?: string
  allow_review: boolean
  review_start_date?: string
  review_end_date?: string
  proctoring_enabled: boolean
  proctoring_config_id?: string
  created_at: string
  updated_at: string
}

export type StudentExamQuestion = {
  id: string
  exam_session_id: string
  question_text: string
  question_type: 'multiple_choice' | 'true_false' | 'essay'
  options: any[]
  correct_answer: string
  marks: number
  question_number: number
  explanation?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export type StudentExamAttempt = {
  id: string
  student_id: string
  exam_session_id: string
  started_at: string
  submitted_at?: string
  time_spent_seconds?: number
  status: 'in_progress' | 'submitted' | 'timeout' | 'abandoned'
  proctoring_data?: any
  score?: number
  total_marks?: number
  percentage?: number
  grade?: string
  created_at: string
  updated_at: string
}

export type StudentExamAnswer = {
  id: string
  attempt_id: string
  question_id: string
  selected_answer: string
  is_correct: boolean
  marks_obtained: number
  time_spent_seconds?: number
  created_at: string
  updated_at: string
}

export type StudentExamFeedback = {
  id: string
  attempt_id: string
  student_id: string
  feedback_text: string
  rating?: number
  created_at: string
  updated_at: string
}

export class StudentExamService {
  // Student Exam Session Methods
  static async getAllStudentExamSessions() {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('student_exam_sessions')
      .select(`
        *,
        course:courses(code, title),
        session:academic_sessions(name),
        semester:academic_semesters(semester_name),
        questions:student_exam_questions(id)
      `)
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return data as (StudentExamSession & { question_count?: number })[]
  }

  static async getStudentExamSessionById(id: string) {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('student_exam_sessions')
      .select(`
        *,
        course:courses(code, title),
        session:academic_sessions(name),
        semester:academic_semesters(semester_name),
        questions:student_exam_questions(id)
      `)
      .eq('id', id)
      .single()

    if (error) throw new Error(error.message)
    return data as StudentExamSession & { question_count?: number }
  }

  static async createStudentExamSession(session: Partial<StudentExamSession> & { published_by?: string }) {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('student_exam_sessions')
      .insert({
        course_id: session.course_id,
        session_id: session.session_id,
        semester_id: session.semester_id,
        exam_title: session.exam_title,
        exam_description: session.exam_description,
        exam_type: session.exam_type || 'regular',
        start_date: session.start_date,
        end_date: session.end_date,
        duration_minutes: session.duration_minutes || 60,
        total_marks: session.total_marks || 100,
        passing_marks: session.passing_marks || 60,
        instructions: session.instructions,
        is_published: session.is_published ?? false,
        published_at: session.is_published ? new Date().toISOString() : null,
        published_by: session.published_by,
        allow_review: session.allow_review ?? true,
        review_start_date: session.review_start_date,
        review_end_date: session.review_end_date,
        proctoring_enabled: session.proctoring_enabled ?? true,
        proctoring_config_id: session.proctoring_config_id,
      })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data as StudentExamSession
  }

  static async updateStudentExamSession(id: string, session: Partial<StudentExamSession>) {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('student_exam_sessions')
      .update({
        course_id: session.course_id,
        session_id: session.session_id,
        semester_id: session.semester_id,
        exam_title: session.exam_title,
        exam_description: session.exam_description,
        exam_type: session.exam_type,
        start_date: session.start_date,
        end_date: session.end_date,
        duration_minutes: session.duration_minutes,
        total_marks: session.total_marks,
        passing_marks: session.passing_marks,
        instructions: session.instructions,
        is_published: session.is_published,
        allow_review: session.allow_review,
        review_start_date: session.review_start_date,
        review_end_date: session.review_end_date,
        proctoring_enabled: session.proctoring_enabled,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data as StudentExamSession
  }

  static async deleteStudentExamSession(id: string) {
    const admin = createAdminClient()
    const { error } = await admin
      .from('student_exam_sessions')
      .delete()
      .eq('id', id)

    if (error) throw new Error(error.message)
    return true
  }

  // Student Exam Questions Methods
  static async getQuestionsBySessionId(sessionId: string) {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('student_exam_questions')
      .select('*')
      .eq('exam_session_id', sessionId)
      .eq('is_active', true)
      .order('question_number', { ascending: true })

    if (error) throw new Error(error.message)
    return data as StudentExamQuestion[]
  }

  static async createStudentExamQuestion(question: Partial<StudentExamQuestion>) {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('student_exam_questions')
      .insert({
        exam_session_id: question.exam_session_id,
        question_text: question.question_text,
        question_type: question.question_type || 'multiple_choice',
        options: question.options || [],
        correct_answer: question.correct_answer,
        marks: question.marks || 1,
        question_number: question.question_number || 1,
        explanation: question.explanation,
        is_active: question.is_active ?? true,
      })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data as StudentExamQuestion
  }

  static async updateStudentExamQuestion(id: string, question: Partial<StudentExamQuestion>) {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('student_exam_questions')
      .update({
        question_text: question.question_text,
        question_type: question.question_type,
        options: question.options,
        correct_answer: question.correct_answer,
        marks: question.marks,
        question_number: question.question_number,
        explanation: question.explanation,
        is_active: question.is_active,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data as StudentExamQuestion
  }

  static async deleteStudentExamQuestion(id: string) {
    const admin = createAdminClient()
    const { error } = await admin
      .from('student_exam_questions')
      .delete()
      .eq('id', id)

    if (error) throw new Error(error.message)
    return true
  }

  // Student Exam Attempts Methods
  static async getAttemptsBySessionId(sessionId: string) {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('student_exam_attempts')
      .select(`
        *,
        student:profiles(first_name, last_name, email)
      `)
      .eq('exam_session_id', sessionId)
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return data as (StudentExamAttempt & { student?: any })[]
  }

  static async getAttemptById(id: string) {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('student_exam_attempts')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw new Error(error.message)
    return data as StudentExamAttempt
  }

  static async createStudentExamAttempt(attempt: Partial<StudentExamAttempt>) {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('student_exam_attempts')
      .insert({
        student_id: attempt.student_id,
        exam_session_id: attempt.exam_session_id,
        started_at: attempt.started_at || new Date().toISOString(),
        status: attempt.status || 'in_progress',
        proctoring_data: attempt.proctoring_data,
      })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data as StudentExamAttempt
  }

  static async updateStudentExamAttempt(id: string, attempt: Partial<StudentExamAttempt>) {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('student_exam_attempts')
      .update({
        submitted_at: attempt.submitted_at,
        time_spent_seconds: attempt.time_spent_seconds,
        status: attempt.status,
        proctoring_data: attempt.proctoring_data,
        score: attempt.score,
        total_marks: attempt.total_marks,
        percentage: attempt.percentage,
        grade: attempt.grade,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data as StudentExamAttempt
  }

  // Student Exam Answers Methods
  static async getAnswersByAttemptId(attemptId: string) {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('student_exam_answers')
      .select('*')
      .eq('attempt_id', attemptId)

    if (error) throw new Error(error.message)
    return data as StudentExamAnswer[]
  }

  static async createStudentExamAnswer(answer: Partial<StudentExamAnswer>) {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('student_exam_answers')
      .insert({
        attempt_id: answer.attempt_id,
        question_id: answer.question_id,
        selected_answer: answer.selected_answer,
        is_correct: answer.is_correct,
        marks_obtained: answer.marks_obtained || 0,
        time_spent_seconds: answer.time_spent_seconds,
      })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data as StudentExamAnswer
  }

  // Student Exam Feedback Methods
  static async getFeedbackByAttemptId(attemptId: string) {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('student_exam_feedback')
      .select('*')
      .eq('attempt_id', attemptId)

    if (error) throw new Error(error.message)
    return data as StudentExamFeedback[]
  }

  static async createStudentExamFeedback(feedback: Partial<StudentExamFeedback>) {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('student_exam_feedback')
      .insert({
        attempt_id: feedback.attempt_id,
        student_id: feedback.student_id,
        feedback_text: feedback.feedback_text,
        rating: feedback.rating,
      })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data as StudentExamFeedback
  }

  static async getAllExamResults() {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('student_exam_attempts')
      .select(`
        *,
        student:profiles(first_name, last_name, email),
        session:student_exam_sessions(exam_title, course_id),
        answers:student_exam_answers(id)
      `)
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return data
  }
}
