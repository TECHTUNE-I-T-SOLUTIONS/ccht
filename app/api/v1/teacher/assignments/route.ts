import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { TeacherDashboardService } from '@/lib/services/teacher-dashboard.service'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const data = await TeacherDashboardService.getTeacherAssignments()
    return NextResponse.json({ data }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to load assignments' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const teacherId = await TeacherDashboardService.getCurrentTeacherId()
    const admin = createAdminClient()
    const body = await request.json()

    if (!body.course_id) {
      return NextResponse.json({ error: 'course_id is required' }, { status: 400 })
    }

    const { data, error } = await admin
      .from('course_teacher_assignments')
      .insert({
        course_id: body.course_id,
        teacher_id: teacherId,
        session_id: body.session_id || null,
        semester_id: body.semester_id || null,
        is_active: body.is_published ?? true,
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, data, message: 'Assignment created successfully' })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to create assignment' }, { status: 500 })
  }
}
