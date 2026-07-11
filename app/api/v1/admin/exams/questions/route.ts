import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const admin = createAdminClient()
    const configId = request.nextUrl.searchParams.get('configId')

    if (!configId) {
      return NextResponse.json({ error: 'configId is required' }, { status: 400 })
    }

    const { data: questions, error } = await admin
      .from('exam_questions')
      .select('*')
      .eq('exam_config_id', configId)
      .order('question_order', { ascending: true })

    if (error) {
      console.error('[admin/exams/questions] Error fetching questions:', error)
      return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 })
    }

    return NextResponse.json({ data: questions || [] })
  } catch (error) {
    console.error('[admin/exams/questions] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = createAdminClient()
    const body = await request.json()
    
    const { data: question, error } = await admin
      .from('exam_questions')
      .insert({
        exam_config_id: body.exam_config_id,
        question_text: body.question_text,
        question_type: body.question_type || 'multiple_choice',
        options: body.options || [],
        correct_answer: body.correct_answer,
        points: body.points || 1,
        question_order: body.question_order,
        is_active: body.is_active ?? true,
      })
      .select()
      .single()

    if (error) {
      console.error('[admin/exams/questions] Error creating question:', error)
      return NextResponse.json({ error: 'Failed to create question' }, { status: 500 })
    }

    return NextResponse.json({ data: question }, { status: 201 })
  } catch (error) {
    console.error('[admin/exams/questions] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}