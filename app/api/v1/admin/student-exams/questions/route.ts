import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const admin = createAdminClient()
    const sessionId = request.nextUrl.searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 })
    }

    const { data: questions, error } = await admin
      .from('student_exam_questions')
      .select('*')
      .eq('exam_session_id', sessionId)
      .order('question_number', { ascending: true })

    if (error) {
      console.error('[admin/student-exams/questions] Error fetching questions:', error)
      return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: questions || [] })
  } catch (error) {
    console.error('[admin/student-exams/questions] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = createAdminClient()
    const body = await request.json()
    
    const { data: question, error } = await admin
      .from('student_exam_questions')
      .insert({
        exam_session_id: body.exam_session_id || body.sessionId,
        question_text: body.question_text,
        question_type: body.question_type || 'multiple_choice',
        question_number: body.question_number || 1,
        marks: body.marks || body.points || 1,
        options: body.options || [],
        correct_answer: body.correct_answer,
        explanation: body.explanation,
        is_active: body.is_active ?? true,
      })
      .select()
      .single()

    if (error) {
      console.error('[admin/student-exams/questions] Error creating question:', error)
      return NextResponse.json({ error: 'Failed to create question' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: question }, { status: 201 })
  } catch (error) {
    console.error('[admin/student-exams/questions] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
