import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const admin = createAdminClient()
    const body = await request.json()
    const options = Array.isArray(body.options) ? body.options : []

    const { error } = await admin.from('student_exam_questions').insert({
      exam_session_id: body.exam_id,
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
    return NextResponse.json({ error: error?.message || 'Failed to create question' }, { status: 500 })
  }
}
