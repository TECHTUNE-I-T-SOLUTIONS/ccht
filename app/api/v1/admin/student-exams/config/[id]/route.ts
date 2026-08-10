import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const admin = createAdminClient()
    
    const { data: config, error } = await admin
      .from('student_exam_sessions')
      .select(`
        *,
        course:courses(code, title),
        session:academic_sessions(name),
        semester:academic_semesters(semester_name),
        questions:student_exam_questions(id)
      `)
      .eq('id', id)
      .single()

    if (error || !config) {
      return NextResponse.json({ error: 'Student exam configuration not found' }, { status: 404 })
    }

    const formattedConfig = {
      ...config,
      question_count: config.questions?.length || 0
    }

    return NextResponse.json({ success: true, data: formattedConfig })
  } catch (error) {
    console.error('[admin/student-exams/config] Unexpected error:', error)
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
    
    const { data: config, error } = await admin
      .from('student_exam_sessions')
      .update({
        course_id: body.course_id,
        session_id: body.session_id,
        semester_id: body.semester_id,
        exam_title: body.exam_title,
        exam_description: body.exam_description,
        exam_type: body.exam_type,
        start_date: body.start_date,
        end_date: body.end_date,
        duration_minutes: body.duration_minutes,
        total_marks: body.total_marks,
        passing_marks: body.passing_marks,
        instructions: body.instructions,
        is_published: body.is_published,
        allow_review: body.allow_review,
        review_start_date: body.review_start_date,
        review_end_date: body.review_end_date,
        proctoring_enabled: body.proctoring_enabled,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[admin/student-exams/config] Error updating config:', error)
      return NextResponse.json({ error: 'Failed to update student exam configuration' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: config })
  } catch (error) {
    console.error('[admin/student-exams/config] Unexpected error:', error)
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
      .from('student_exam_sessions')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[admin/student-exams/config] Error deleting config:', error)
      return NextResponse.json({ error: 'Failed to delete student exam configuration' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Student exam configuration deleted successfully' })
  } catch (error) {
    console.error('[admin/student-exams/config] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
