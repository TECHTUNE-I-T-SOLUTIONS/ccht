import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { TeacherDashboardService } from '@/lib/services/teacher-dashboard.service'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const profile = await TeacherDashboardService.getCurrentTeacherTeacherProfile()
    return NextResponse.json({ data: profile })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to load profile' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const teacherId = await TeacherDashboardService.getCurrentTeacherId()
    const admin = createAdminClient()
    const body = await request.json()
    const { error } = await admin.from('teacher_profiles').update({
      qualification: body.qualification || null,
      specialization: body.specialization || null,
      office_location: body.office_location || null,
      office_hours: body.office_hours || null,
      employment_type: body.employment_type || null,
    }).eq('profile_id', teacherId)
    if (error) throw error
    await admin.from('profiles').update({
      first_name: body.first_name || null,
      last_name: body.last_name || null,
      phone: body.phone || null,
      avatar_url: body.avatar_url || null,
    }).eq('id', teacherId)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to update profile' }, { status: 500 })
  }
}
