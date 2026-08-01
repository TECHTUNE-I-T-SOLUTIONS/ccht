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
    
    // Update teacher_profiles table
    const teacherUpdateData: any = {
      qualification: body.qualification || null,
      specialization: body.specialization || null,
      office_location: body.office_location || null,
      office_hours: body.office_hours || null,
      employment_type: body.employment_type || null,
    }
    
    // Handle courses array (jsonb)
    if (body.courses !== undefined) {
      teacherUpdateData.courses = body.courses
    }
    
    // Handle departments array (jsonb)
    if (body.departments !== undefined) {
      teacherUpdateData.departments = body.departments
    }
    
    // Handle other optional fields
    if (body.employee_number !== undefined) {
      teacherUpdateData.employee_number = body.employee_number
    }
    if (body.staff_number !== undefined) {
      teacherUpdateData.staff_number = body.staff_number
    }
    if (body.date_joined !== undefined) {
      teacherUpdateData.date_joined = body.date_joined
    }
    if (body.can_publish_results !== undefined) {
      teacherUpdateData.can_publish_results = body.can_publish_results
    }
    if (body.can_enter_scores !== undefined) {
      teacherUpdateData.can_enter_scores = body.can_enter_scores
    }
    if (body.employment_status !== undefined) {
      teacherUpdateData.employment_status = body.employment_status
    }
    
    const { error: teacherError } = await admin.from('teacher_profiles').update(teacherUpdateData).eq('profile_id', teacherId)
    if (teacherError) throw teacherError
    
    // Update profiles table
    const profileUpdateData: any = {}
    if (body.first_name !== undefined) {
      profileUpdateData.first_name = body.first_name
    }
    if (body.last_name !== undefined) {
      profileUpdateData.last_name = body.last_name
    }
    if (body.phone !== undefined) {
      profileUpdateData.phone = body.phone
    }
    if (body.avatar_url !== undefined) {
      profileUpdateData.avatar_url = body.avatar_url
    }
    
    if (Object.keys(profileUpdateData).length > 0) {
      const { error: profileError } = await admin.from('profiles').update(profileUpdateData).eq('id', teacherId)
      if (profileError) throw profileError
    }
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to update profile' }, { status: 500 })
  }
}
