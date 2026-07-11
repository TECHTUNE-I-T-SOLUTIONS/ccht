import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = createAdminClient()
    
    const { data: question, error } = await admin
      .from('exam_questions')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error || !question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    return NextResponse.json({ data: question })
  } catch (error) {
    console.error('[admin/exams/questions] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = createAdminClient()
    const body = await request.json()
    
    const { data: question, error } = await admin
      .from('exam_questions')
      .update({
        question_text: body.question_text,
        question_type: body.question_type,
        options: body.options,
        correct_answer: body.correct_answer,
        points: body.points,
        question_order: body.question_order,
        is_active: body.is_active,
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('[admin/exams/questions] Error updating question:', error)
      return NextResponse.json({ error: 'Failed to update question' }, { status: 500 })
    }

    return NextResponse.json({ data: question })
  } catch (error) {
    console.error('[admin/exams/questions] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = createAdminClient()
    
    const { error } = await admin
      .from('exam_questions')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('[admin/exams/questions] Error deleting question:', error)
      return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[admin/exams/questions] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}