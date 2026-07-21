import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    
    const { data: sessions, error } = await supabase
      .from('exam_sessions')
      .select(`
        *,
        profiles (
          first_name,
          last_name,
          email
        ),
        entrance_exam_config (
          exam_name,
          duration_minutes
        ),
        exam_recordings (
          id,
          recording_url,
          created_at
        )
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Fetch entrance exam results with answers
    const { data: examResults } = await supabase
      .from('entrance_exam_results')
      .select('*')

    const resultsMap = new Map(examResults?.map((r: any) => [r.aspirant_id, r]) || [])

    // Fetch all questions to map IDs to question text
    const { data: questions } = await supabase
      .from('exam_questions')
      .select('id, question_text, correct_answer')
    
    const questionsMap = new Map(questions?.map((q: any) => [q.id, q]) || [])

    const results = sessions?.map((session: any) => {
      const examResult = resultsMap.get(session.aspirant_id)
      let answers = null
      if (examResult?.answers) {
        // Check if answers is already an object or a string
        if (typeof examResult.answers === 'string') {
          try {
            answers = JSON.parse(examResult.answers)
          } catch (e) {
            console.error('Failed to parse answers:', e)
            answers = null
          }
        } else {
          answers = examResult.answers
        }
      }
      
      // Map question IDs to question text
      const answersWithQuestions = answers ? Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        question: questionsMap.get(questionId)?.question_text || 'Question not found',
        answer,
        correctAnswer: questionsMap.get(questionId)?.correct_answer,
        isCorrect: answer === questionsMap.get(questionId)?.correct_answer
      })) : []
      
      return {
        id: session.id,
        aspirant_id: session.aspirant_id,
        aspirant_name: session.profiles ? `${session.profiles.first_name} ${session.profiles.last_name}` : null,
        aspirant_email: session.profiles?.email || null,
        exam_type: session.entrance_exam_config?.exam_name || 'Entrance Exam',
        score: session.score || 0,
        total_questions: session.total_questions || 0,
        percentage: session.percentage || 0,
        grade: calculateGrade(session.percentage || 0),
        status: session.status || 'submitted',
        submitted_at: session.created_at,
        started_at: session.started_at,
        completed_at: session.completed_at,
        recording: session.exam_recordings?.[0] || null,
        answers: answersWithQuestions,
      }
    }) || []

    return NextResponse.json({ success: true, results })
  } catch (error: any) {
    console.error('Failed to load screening results:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to load results' },
      { status: 500 }
    )
  }
}

function calculateGrade(percentage: number): string {
  if (percentage >= 70) return 'A'
  if (percentage >= 60) return 'B'
  if (percentage >= 50) return 'C'
  if (percentage >= 45) return 'D'
  if (percentage >= 40) return 'E'
  return 'F'
}
