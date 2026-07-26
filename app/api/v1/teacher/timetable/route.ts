import { NextResponse } from 'next/server'
import { TeacherDashboardService } from '@/lib/services/teacher-dashboard.service'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient as createServerClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    
    if (sessionId) {
      const data = await TeacherDashboardService.getTimetableEntriesBySession(sessionId)
      return NextResponse.json({ data })
    }
    
    const data = await TeacherDashboardService.getTeacherTimetable()
    return NextResponse.json({ data })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to load timetable' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('POST timetable entry body:', body)
    
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('timetable_entries')
      .insert({
        timetable_session_id: body.timetable_session_id,
        course_id: body.course_id,
        day_of_week: body.day_of_week,
        start_time: body.start_time,
        end_time: body.end_time,
        venue: body.venue,
        lecturer_id: user.id,
      })
      .select()
      .single()

    console.log('Insert error:', error)
    if (error) throw new Error(error.message)
    return NextResponse.json({ data })
  } catch (error: any) {
    console.error('POST timetable error:', error)
    return NextResponse.json({ error: error?.message || 'Failed to create timetable entry' }, { status: 500 })
  }
}
