import { createClient as createServerClient } from '@/lib/supabase/server'
import { createPublicClient } from '@/lib/supabase/public'
import { createAdminClient } from '@/lib/supabase/admin'

export type EntranceExamSubmission = {
  id: string
  aspirant_id: string
  exam_type: string
  score: number
  total_questions: number
  percentage: number
  grade: string
  answers: Record<string, string>
  status: string
  created_at: string
  updated_at: string
}

export type ExamConfig = {
  id: string
  exam_name: string
  exam_description?: string
  duration_minutes: number
  total_questions: number
  passing_score: number
  is_active: boolean
  instructions?: string
  created_by?: string
  created_at: string
  updated_at: string
}

export type ExamQuestion = {
  id: string
  exam_config_id: string
  question_text: string
  question_type: 'multiple_choice' | 'true_false' | 'essay'
  options: any[]
  correct_answer: string
  points: number
  question_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export type ExamSession = {
  id: string
  aspirant_id: string
  exam_config_id?: string
  started_at: string
  submitted_at?: string
  time_spent_seconds?: number
  status: 'in_progress' | 'submitted' | 'timeout' | 'abandoned'
  proctoring_data?: any
  academic_year?: string
  exam_type?: string
  score?: number
  total_questions?: number
  percentage?: number
  created_at: string
  updated_at: string
}

export class ExamService {
  static gradeFromScore(score: number) {
    if (score >= 80) return 'A'
    if (score >= 70) return 'B'
    if (score >= 60) return 'C'
    if (score >= 50) return 'D'
    if (score >= 40) return 'E'
    return 'F'
  }

  // Exam Configuration Methods
  static async getAllExamConfigs() {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('entrance_exam_config')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return data as ExamConfig[]
  }

  static async getExamConfigById(id: string) {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('entrance_exam_config')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw new Error(error.message)
    return data as ExamConfig
  }

  static async createExamConfig(config: Partial<ExamConfig> & { created_by?: string }) {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('entrance_exam_config')
      .insert({
        exam_name: config.exam_name,
        exam_description: config.exam_description,
        duration_minutes: config.duration_minutes || 10,
        total_questions: config.total_questions || 4,
        passing_score: config.passing_score || 50,
        is_active: config.is_active ?? true,
        instructions: config.instructions,
        created_by: config.created_by,
      })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data as ExamConfig
  }

  static async updateExamConfig(id: string, config: Partial<ExamConfig>) {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('entrance_exam_config')
      .update({
        exam_name: config.exam_name,
        exam_description: config.exam_description,
        duration_minutes: config.duration_minutes,
        total_questions: config.total_questions,
        passing_score: config.passing_score,
        is_active: config.is_active,
        instructions: config.instructions,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data as ExamConfig
  }

  static async deleteExamConfig(id: string) {
    const admin = createAdminClient()
    const { error } = await admin
      .from('entrance_exam_config')
      .delete()
      .eq('id', id)

    if (error) throw new Error(error.message)
    return true
  }

  // Exam Questions Methods
  static async getQuestionsByConfigId(configId: string) {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('exam_questions')
      .select('*')
      .eq('exam_config_id', configId)
      .eq('is_active', true)
      .order('question_order', { ascending: true })

    if (error) throw new Error(error.message)
    return data as ExamQuestion[]
  }

  static async createQuestion(question: Partial<ExamQuestion>) {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('exam_questions')
      .insert({
        exam_config_id: question.exam_config_id,
        question_text: question.question_text,
        question_type: question.question_type || 'multiple_choice',
        options: question.options || [],
        correct_answer: question.correct_answer,
        points: question.points || 1,
        question_order: question.question_order || 1,
        is_active: question.is_active ?? true,
      })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data as ExamQuestion
  }

  static async updateQuestion(id: string, question: Partial<ExamQuestion>) {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('exam_questions')
      .update({
        question_text: question.question_text,
        question_type: question.question_type,
        options: question.options,
        correct_answer: question.correct_answer,
        points: question.points,
        question_order: question.question_order,
        is_active: question.is_active,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data as ExamQuestion
  }

  static async deleteQuestion(id: string) {
    const admin = createAdminClient()
    const { error } = await admin
      .from('exam_questions')
      .delete()
      .eq('id', id)

    if (error) throw new Error(error.message)
    return true
  }

  // Exam Session Methods
  static async createExamSession(session: Partial<ExamSession>) {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('exam_sessions')
      .insert({
        aspirant_id: session.aspirant_id,
        exam_config_id: session.exam_config_id,
        started_at: session.started_at || new Date().toISOString(),
        status: session.status || 'in_progress',
        academic_year: session.academic_year,
        exam_type: session.exam_type || 'Entrance Examination',
      })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data as ExamSession
  }

  static async updateExamSession(id: string, session: Partial<ExamSession>) {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('exam_sessions')
      .update({
        submitted_at: session.submitted_at,
        time_spent_seconds: session.time_spent_seconds,
        status: session.status,
        proctoring_data: session.proctoring_data,
        score: session.score,
        total_questions: session.total_questions,
        percentage: session.percentage,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data as ExamSession
  }

  static async getExamSessionByAspirant(aspirantId: string) {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('exam_sessions')
      .select('*')
      .eq('aspirant_id', aspirantId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') throw new Error(error.message)
    return data as ExamSession | null
  }

  static async getActiveExamSession(aspirantId: string) {
    const supabase = await createServerClient()
    const { data, error } = await supabase
      .from('exam_sessions')
      .select('*')
      .eq('aspirant_id', aspirantId)
      .eq('status', 'in_progress')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') throw new Error(error.message)
    return data as ExamSession | null
  }

  // Exam Results Methods
  static async saveEntranceExam(input: {
    aspirantId: string
    score: number
    totalQuestions: number
    examType?: string
    academicYear?: string
    answers?: Record<string, string>
    proctoring?: unknown
  }) {
    const supabase = await createServerClient()
    const percentage = Math.round((input.score / input.totalQuestions) * 100)
    const grade = this.gradeFromScore(percentage)

    const { data, error } = await supabase
      .from('entrance_exam_results')
      .insert({
        aspirant_id: input.aspirantId,
        exam_type: input.examType || 'entrance',
        score: percentage,
        total_questions: input.totalQuestions,
        percentage,
        grade,
        answers: input.answers || {},
        proctoring_snapshot: input.proctoring || null,
        status: 'submitted',
      })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return { submission: data as EntranceExamSubmission, percentage, grade }
  }

  static async getEntranceExamResults(studentId: string) {
    const supabase = createPublicClient()
    const { data, error } = await supabase
      .from('entrance_exam_results')
      .select('*')
      .eq('aspirant_id', studentId)
      .order('submitted_at', { ascending: false })

    if (error) throw new Error('Failed to load exam results')
    return data || []
  }

  static async getLatestEntranceExamResult(studentId: string) {
    const results = await this.getEntranceExamResults(studentId)
    return results[0] || null
  }

  static async getAllExamResults() {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('entrance_exam_results')
      .select(`
        *,
        aspirant:profiles(first_name, last_name, email)
      `)
      .order('submitted_at', { ascending: false })

    if (error) throw new Error(error.message)
    return data
  }

  static async updateExamResult(id: string, updates: {
    status?: string
    reviewed_at?: string
    reviewed_by?: string
    review_note?: string
  }) {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('entrance_exam_results')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  }
}
