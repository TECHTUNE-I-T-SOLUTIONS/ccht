import { NextResponse } from 'next/server'
import { TeacherDashboardService } from '@/lib/services/teacher-dashboard.service'

export const runtime = 'nodejs'

export async function GET(_: Request, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    const { sessionId } = await params
    const admin = await (await import('@/lib/supabase/admin')).createAdminClient()
    const { data, error } = await admin
      .from('timetable_sessions')
      .select('id, session_id, semester_id, program_id, level, title, description, is_active, session:academic_sessions(id, name), semester:academic_semesters(id, semester_name), program:programs(id, title, department:departments(id, name))')
      .eq('id', sessionId)
      .single()
    
    if (error) throw new Error(error.message)
    return NextResponse.json({ data })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to load timetable session' }, { status: 500 })
  }
}
