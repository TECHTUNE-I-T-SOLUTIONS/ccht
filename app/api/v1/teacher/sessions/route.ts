import { NextResponse } from 'next/server'
import { TeacherDashboardService } from '@/lib/services/teacher-dashboard.service'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient as createServerClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const data = await TeacherDashboardService.getTeacherSessions()
    return NextResponse.json({ data })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to load sessions' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('student_exam_sessions')
      .insert({
        ...body,
        published_by: user.id,
        exam_type: body.exam_type || 'online_class',
      })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return NextResponse.json({ data })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to create session' }, { status: 500 })
  }
}
