import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const admin = createAdminClient()
    
    const { data, error } = await admin
      .from('student_exam_questions')
      .select('*')
      .eq('exam_session_id', id)
      .order('question_number', { ascending: true })

    if (error) throw error
    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Error fetching exam questions:', error)
    return NextResponse.json({ error: error?.message || 'Failed to load questions' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const admin = createAdminClient()
    const body = await request.json()
    const options = Array.isArray(body.options) ? body.options : []

    const { error } = await admin.from('student_exam_questions').insert({
      exam_session_id: id,
      question_text: body.question_text,
      question_type: body.question_type || 'multiple_choice',
      question_number: body.question_order || 1,
      marks: body.points ?? 1,
      options,
      correct_answer: body.correct_answer || null,
      explanation: body.explanation || null,
      is_active: body.is_active ?? true,
    })

    if (error) throw error
    return NextResponse.json({ success: true, message: 'Question created successfully' })
  } catch (error: any) {
    console.error('Question creation error:', error)
    return NextResponse.json({ error: error?.message || 'Failed to create question' }, { status: 500 })
  }
}
