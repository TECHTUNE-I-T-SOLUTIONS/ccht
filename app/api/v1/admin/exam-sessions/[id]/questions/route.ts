import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = createAdminClient()
    const { id: sessionId } = await params

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
    }

    const { data: questions, error } = await admin
      .from('student_exam_questions')
      .select('*')
      .eq('exam_session_id', sessionId)
      .eq('is_active', true)
      .order('question_number', { ascending: true })

    if (error) {
      console.error('[admin/exam-sessions/questions] Error fetching questions:', error)
      return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: questions || [] })
  } catch (error) {
    console.error('[admin/exam-sessions/questions] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = createAdminClient()
    const { id: sessionId } = await params
    const body = await request.json()
    
    const { data: question, error } = await admin
      .from('student_exam_questions')
      .insert({
        exam_session_id: sessionId,
        question_text: body.question_text,
        question_type: body.question_type || 'multiple_choice',
        question_number: body.question_number || 1,
        marks: body.marks || 1,
        options: body.options || [],
        correct_answer: body.correct_answer,
        explanation: body.explanation,
        is_active: body.is_active ?? true,
      })
      .select()
      .single()

    if (error) {
      console.error('[admin/exam-sessions/questions] Error creating question:', error)
      return NextResponse.json({ error: 'Failed to create question' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: question }, { status: 201 })
  } catch (error) {
    console.error('[admin/exam-sessions/questions] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = createAdminClient()
    const { id: sessionId } = await params
    const body = await request.json()
    
    const { data: question, error } = await admin
      .from('student_exam_questions')
      .update({
        question_text: body.question_text,
        question_type: body.question_type,
        question_number: body.question_number,
        marks: body.marks,
        options: body.options,
        correct_answer: body.correct_answer,
        explanation: body.explanation,
        is_active: body.is_active,
      })
      .eq('id', body.id)
      .eq('exam_session_id', sessionId)
      .select()
      .single()

    if (error) {
      console.error('[admin/exam-sessions/questions] Error updating question:', error)
      return NextResponse.json({ error: 'Failed to update question' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: question })
  } catch (error) {
    console.error('[admin/exam-sessions/questions] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = createAdminClient()
    const { id: sessionId } = await params
    const questionId = request.nextUrl.searchParams.get('questionId')

    if (!questionId) {
      return NextResponse.json({ error: 'Question ID is required' }, { status: 400 })
    }
    
    const { error } = await admin
      .from('student_exam_questions')
      .delete()
      .eq('id', questionId)
      .eq('exam_session_id', sessionId)

    if (error) {
      console.error('[admin/exam-sessions/questions] Error deleting question:', error)
      return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Question deleted successfully' })
  } catch (error) {
    console.error('[admin/exam-sessions/questions] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
