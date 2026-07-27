import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const admin = createAdminClient()
    
    const { data, error } = await admin
      .from('student_exam_sessions')
      .select(`
        *,
        course:courses(code, title),
        session:academic_sessions(name),
        semester:academic_semesters(semester_name),
        proctoring_config:exam_proctoring_config(*)
      `)
      .eq('id', id)
      .single()

    if (error) throw error

    // Format the data to include creator info
    const formattedData = {
      ...data,
      creator: null,
      creator_role: 'admin'
    }

    return NextResponse.json({ success: true, data: formattedData })
  } catch (error: any) {
    console.error('Error fetching admin exam:', error)
    return NextResponse.json({ error: error?.message || 'Failed to load exam' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const admin = createAdminClient()
    const body = await request.json()

    // Create proctoring config if proctoring is enabled and config doesn't exist
    let proctoringConfigId = body.proctoring_config_id
    if (body.proctoring_enabled && !proctoringConfigId) {
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

    const updateData: any = {
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
      published_at: body.is_published ? new Date().toISOString() : null,
      allow_review: body.allow_review,
      review_start_date: body.review_start_date,
      review_end_date: body.review_end_date,
      proctoring_enabled: body.proctoring_enabled,
    }

    if (proctoringConfigId) {
      updateData.proctoring_config_id = proctoringConfigId
    }

    const { data, error } = await admin
      .from('student_exam_sessions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, data, message: 'Exam updated successfully' })
  } catch (error: any) {
    console.error('Exam update error:', error)
    return NextResponse.json({ error: error?.message || 'Failed to update exam' }, { status: 500 })
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const admin = createAdminClient()
    
    const { error } = await admin
      .from('student_exam_sessions')
      .delete()
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ success: true, message: 'Exam deleted successfully' })
  } catch (error: any) {
    console.error('Exam deletion error:', error)
    return NextResponse.json({ error: error?.message || 'Failed to delete exam' }, { status: 500 })
  }
}
