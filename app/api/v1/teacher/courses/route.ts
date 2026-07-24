import { NextResponse } from 'next/server'
import { TeacherDashboardService } from '@/lib/services/teacher-dashboard.service'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const data = await TeacherDashboardService.getTeacherCourses()
    return NextResponse.json({ data })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to load courses' }, { status: 500 })
  }
}
