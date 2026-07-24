import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { TeacherDashboardService } from '@/lib/services/teacher-dashboard.service'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const teacherId = await TeacherDashboardService.getCurrentTeacherId()
    const admin = createAdminClient()

    const { data, error } = await admin
      .from('teacher_notifications')
      .select('*, sender:profiles!teacher_notifications_sent_by_fkey(first_name, last_name, email)')
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ data: data || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to load notifications' }, { status: 500 })
  }
}
