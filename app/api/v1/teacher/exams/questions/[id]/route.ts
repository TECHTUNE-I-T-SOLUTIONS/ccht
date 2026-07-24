import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const admin = createAdminClient()
    const body = await request.json()

    const { error } = await admin
      .from('student_exam_questions')
      .update({
        question_text: body.question_text,
        question_type: body.question_type,
        question_number: body.question_order,
        marks: body.points,
        options: Array.isArray(body.options) ? body.options : [],
        correct_answer: body.correct_answer,
        explanation: body.explanation || null,
        is_active: body.is_active ?? true,
      })
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ success: true, message: 'Question updated successfully' })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to update question' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const admin = createAdminClient()
    const { error } = await admin.from('student_exam_questions').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true, message: 'Question deleted successfully' })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to delete question' }, { status: 500 })
  }
}
