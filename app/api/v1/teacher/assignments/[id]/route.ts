import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { TeacherDashboardService } from '@/lib/services/teacher-dashboard.service'

export const runtime = 'nodejs'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const teacherId = await TeacherDashboardService.getCurrentTeacherId()
    const admin = createAdminClient()
    const body = await request.json()

    const { error } = await admin
      .from('course_teacher_assignments')
      .update({
        course_id: body.course_id,
        session_id: body.session_id || null,
        semester_id: body.semester_id || null,
        is_active: body.is_active ?? true,
      })
      .eq('id', id)
      .eq('teacher_id', teacherId)

    if (error) throw error
    return NextResponse.json({ success: true, message: 'Assignment updated successfully' })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to update assignment' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const teacherId = await TeacherDashboardService.getCurrentTeacherId()
    const admin = createAdminClient()

    const { error } = await admin
      .from('course_teacher_assignments')
      .delete()
      .eq('id', id)
      .eq('teacher_id', teacherId)

    if (error) throw error
    return NextResponse.json({ success: true, message: 'Assignment deleted successfully' })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to delete assignment' }, { status: 500 })
  }
}
