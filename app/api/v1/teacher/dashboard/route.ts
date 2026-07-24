import { NextResponse } from 'next/server'
import { TeacherDashboardService } from '@/lib/services/teacher-dashboard.service'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const [profile, assignments, exams, notices] = await Promise.all([
      TeacherDashboardService.getCurrentTeacherProfile(),
      TeacherDashboardService.getTeacherAssignments(),
      TeacherDashboardService.getTeacherExams(),
      TeacherDashboardService.getTeacherNotices(3),
    ])
    const stats = await TeacherDashboardService.getTeacherStats()

    return NextResponse.json({
      data: {
        profile,
        assignmentCount: assignments.length,
        examCount: exams.length,
        noticeCount: stats.noticesCount,
        coursesCount: stats.coursesCount,
        resultsCount: stats.resultsCount,
        assignments,
        exams,
        notices,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to load dashboard' }, { status: 500 })
  }
}
