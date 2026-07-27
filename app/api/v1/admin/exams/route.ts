import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const admin = createAdminClient()
    
    const { data, error } = await admin
      .from('student_exam_sessions')
      .select(`
        *,
        course:courses(code, title),
        session:academic_sessions(name),
        semester:academic_semesters(semester_name)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Format the data to include creator info
    const formattedData = (data || []).map(exam => ({
      ...exam,
      creator: null,
      creator_role: 'admin'
    }))

    return NextResponse.json({ success: true, data: formattedData })
  } catch (error: any) {
    console.error('Error fetching admin exams:', error)
    return NextResponse.json({ error: error?.message || 'Failed to load exams' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()
    const body = await request.json()

    if (!body.course_id || !body.exam_title || !body.session_id || !body.semester_id) {
      return NextResponse.json({ error: 'course_id, exam_title, session_id, and semester_id are required' }, { status: 400 })
    }

    if (!body.start_date || !body.end_date) {
      return NextResponse.json({ error: 'start_date and end_date are required' }, { status: 400 })
    }

    // Create proctoring config if proctoring is enabled
    let proctoringConfigId = null
    if (body.proctoring_enabled) {
      const config = body.proctoring_config || {
        exam_type: body.exam_type || 'regular',
        max_violations: 5,
        auto_submit_on_max_violations: true,
        record_screen: true,
        require_webcam: true,
        require_microphone: false,
        require_fullscreen: true,
        block_copy_paste: true,
        block_right_click: true,
        block_devtools: true,
        detect_tab_switch: true,
        detect_visibility_change: true,
      }
      
      const { data: configData, error: configError } = await admin
        .from('exam_proctoring_config')
        .insert({
          exam_type: config.exam_type || body.exam_type || 'regular',
          max_violations: config.max_violations ?? 5,
          auto_submit_on_max_violations: config.auto_submit_on_max_violations ?? true,
          record_screen: config.record_screen ?? true,
          require_webcam: config.require_webcam ?? true,
          require_microphone: config.require_microphone ?? false,
          require_fullscreen: config.require_fullscreen ?? true,
          block_copy_paste: config.block_copy_paste ?? true,
          block_right_click: config.block_right_click ?? true,
          block_devtools: config.block_devtools ?? true,
          detect_tab_switch: config.detect_tab_switch ?? true,
          detect_visibility_change: config.detect_visibility_change ?? true,
        })
        .select()
        .single()

      if (configError) throw configError
      proctoringConfigId = configData.id
    }

    const { data, error } = await admin
      .from('student_exam_sessions')
      .insert({
        course_id: body.course_id,
        session_id: body.session_id,
        semester_id: body.semester_id,
        exam_title: body.exam_title,
        exam_description: body.exam_description || null,
        exam_type: body.exam_type || 'regular',
        start_date: body.start_date,
        end_date: body.end_date,
        duration_minutes: body.duration_minutes ?? 60,
        total_marks: body.total_marks ?? 100,
        passing_marks: body.passing_marks ?? 60,
        instructions: body.instructions || null,
        is_published: body.is_published ?? false,
        published_at: body.is_published ? new Date().toISOString() : null,
        published_by: user.id,
        allow_review: body.allow_review ?? true,
        review_start_date: body.review_start_date || null,
        review_end_date: body.review_end_date || null,
        proctoring_enabled: body.proctoring_enabled ?? true,
        proctoring_config_id: proctoringConfigId,
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, data, message: 'Exam created successfully' })
  } catch (error: any) {
    console.error('Exam creation error:', error)
    return NextResponse.json({ error: error?.message || 'Failed to create exam' }, { status: 500 })
  }
}
