import { createClient as createServerClient } from '@/lib/supabase/server'
import { createPublicClient } from '@/lib/supabase/public'

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

export class ExamService {
  static gradeFromScore(score: number) {
    if (score >= 80) return 'A'
    if (score >= 70) return 'B'
    if (score >= 60) return 'C'
    if (score >= 50) return 'D'
    if (score >= 40) return 'E'
    return 'F'
  }

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
}
