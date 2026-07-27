import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const admin = createAdminClient()
    
    const { data: question, error } = await admin
      .from('student_exam_questions')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: question })
  } catch (error) {
    console.error('[admin/exams/questions] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const admin = createAdminClient()
    const body = await request.json()
    const options = Array.isArray(body.options) ? body.options : []
    
    const { data: question, error } = await admin
      .from('student_exam_questions')
      .update({
        question_text: body.question_text,
        question_type: body.question_type,
        options,
        correct_answer: body.correct_answer,
        marks: body.points,
        question_number: body.question_order,
        is_active: body.is_active,
        explanation: body.explanation,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[admin/exams/questions] Error updating question:', error)
      return NextResponse.json({ error: 'Failed to update question' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: question })
  } catch (error) {
    console.error('[admin/exams/questions] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const admin = createAdminClient()
    
    const { error } = await admin
      .from('student_exam_questions')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[admin/exams/questions] Error deleting question:', error)
      return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Question deleted successfully' })
  } catch (error) {
    console.error('[admin/exams/questions] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}