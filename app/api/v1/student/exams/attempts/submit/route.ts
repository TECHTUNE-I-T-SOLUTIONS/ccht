import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getNigerianTime } from '@/lib/timezone'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { examAttemptId, answers, timeSpentSeconds, submittedAt, webcamRecordingUrl, screenRecordingUrl } = body

    if (!examAttemptId) {
      return NextResponse.json({ error: 'Exam attempt ID is required' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Fetch all questions for this exam to calculate correctness
    const { data: attempt } = await admin
      .from('student_exam_attempts')
      .select('exam_session_id')
      .eq('id', examAttemptId)
      .single()

    if (!attempt?.exam_session_id) {
      return NextResponse.json({ error: 'Exam attempt not found' }, { status: 404 })
    }

    // Fetch questions with correct answers to grade
    const { data: examQuestions } = await admin
      .from('student_exam_questions')
      .select('id, correct_answer, marks')
      .eq('exam_session_id', attempt.exam_session_id)

    if (!examQuestions) {
      return NextResponse.json({ error: 'Failed to load questions' }, { status: 500 })
    }

    // Create a map of question ID -> correct answer and marks
    const questionMap = new Map(examQuestions.map(q => [q.id, { correct_answer: q.correct_answer, marks: q.marks || 1 }]))

    // Save individual answers with correctness calculated
    let totalScore = 0
    let totalMarks = 0
    const answerRecords = (answers || []).map((answer: any) => {
      const questionInfo = questionMap.get(answer.questionId)
      const isCorrect = questionInfo?.correct_answer?.toLowerCase().trim() === answer.selectedAnswer?.toLowerCase().trim()
      const marksObtained = isCorrect ? (questionInfo?.marks || 1) : 0
      const questionMarks = questionInfo?.marks || 1
      
      if (isCorrect) totalScore += marksObtained
      totalMarks += questionMarks

      return {
        exam_attempt_id: examAttemptId,
        question_id: answer.questionId,
        answer: answer.selectedAnswer,
        is_correct: isCorrect,
        marks_obtained: marksObtained,
        answered_at: submittedAt || getNigerianTime().toISOString(),
      }
    })

    if (answerRecords.length > 0) {
      await admin
        .from('student_exam_answers')
        .insert(answerRecords)
        .select()
    }

    // Calculate percentage
    const percentage = totalMarks > 0 ? Math.round((totalScore / totalMarks) * 100) : 0
    const passed = percentage >= 50 // Default passing threshold

    // Update the exam attempt with score and recording URLs
    const { data: updatedAttempt, error: attemptError } = await admin
      .from('student_exam_attempts')
      .update({
        status: 'submitted',
        submitted_at: submittedAt || getNigerianTime().toISOString(),
        total_score: totalScore,
        percentage_score: percentage,
        time_spent_seconds: timeSpentSeconds || 0,
        passed: passed,
        webcam_recording_url: webcamRecordingUrl || null,
        screen_recording_url: screenRecordingUrl || null,
      })
      .eq('id', examAttemptId)
      .eq('student_id', user.id)
      .select()
      .single()

    if (attemptError) {
      console.error('Error updating attempt:', attemptError)
      return NextResponse.json({ error: 'Failed to submit exam' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Exam submitted successfully'
    })
  } catch (error: any) {
    console.error('Error submitting exam:', error)
    return NextResponse.json({ error: error?.message || 'Failed to submit exam' }, { status: 500 })
  }
}