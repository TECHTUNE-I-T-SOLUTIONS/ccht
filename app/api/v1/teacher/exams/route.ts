import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { TeacherDashboardService } from '@/lib/services/teacher-dashboard.service'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const data = await TeacherDashboardService.getTeacherExams()
    return NextResponse.json({ data }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to load exams' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const teacherId = await TeacherDashboardService.getCurrentTeacherId()
    const admin = createAdminClient()
    const body = await request.json()

    if (!body.course_id || !body.exam_name) {
      return NextResponse.json({ error: 'course_id and exam_name are required' }, { status: 400 })
    }

    const { data, error } = await admin
      .from('student_exam_sessions')
      .insert({
        course_id: body.course_id,
        session_id: body.session_id || null,
        semester_id: body.semester_id || null,
        exam_title: body.exam_name,
        exam_description: body.exam_description || null,
        start_date: body.exam_date || body.start_date || null,
        end_date: body.end_date || body.exam_date || null,
        duration_minutes: body.duration_minutes ?? 60,
        total_marks: body.total_questions ? body.total_questions * 10 : 100,
        passing_marks: body.passing_score ?? 50,
        instructions: body.instructions || null,
        is_published: body.is_active ?? false,
        published_at: body.is_active ? new Date().toISOString() : null,
        published_by: teacherId,
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, data, message: 'Exam created successfully' })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to create exam' }, { status: 500 })
  }
}
