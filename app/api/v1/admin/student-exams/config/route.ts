import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const admin = createAdminClient()
    
    const { data: configs, error } = await admin
      .from('student_exam_sessions')
      .select(`
        *,
        course:courses(code, title),
        session:academic_sessions(name),
        semester:academic_semesters(semester_name),
        questions:student_exam_questions(id)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[admin/student-exams/config] Error fetching configs:', error)
      return NextResponse.json({ error: 'Failed to fetch student exam configurations' }, { status: 500 })
    }

    // Format data to include question count
    const formattedData = (configs || []).map(config => ({
      ...config,
      question_count: config.questions?.length || 0
    }))

    return NextResponse.json({ success: true, data: formattedData })
  } catch (error) {
    console.error('[admin/student-exams/config] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()
    const body = await request.json()
    
    const { data: config, error } = await admin
      .from('student_exam_sessions')
      .insert({
        course_id: body.course_id,
        session_id: body.session_id,
        semester_id: body.semester_id,
        exam_title: body.exam_title,
        exam_description: body.exam_description,
        exam_type: body.exam_type || 'regular',
        start_date: body.start_date,
        end_date: body.end_date,
        duration_minutes: body.duration_minutes || 60,
        total_marks: body.total_marks || 100,
        passing_marks: body.passing_marks || 60,
        instructions: body.instructions,
        is_published: body.is_published ?? false,
        published_at: body.is_published ? new Date().toISOString() : null,
        published_by: user.id,
        allow_review: body.allow_review ?? true,
        review_start_date: body.review_start_date,
        review_end_date: body.review_end_date,
        proctoring_enabled: body.proctoring_enabled ?? true,
      })
      .select()
      .single()

    if (error) {
      console.error('[admin/student-exams/config] Error creating config:', error)
      return NextResponse.json({ error: 'Failed to create student exam configuration' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: config }, { status: 201 })
  } catch (error) {
    console.error('[admin/student-exams/config] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
