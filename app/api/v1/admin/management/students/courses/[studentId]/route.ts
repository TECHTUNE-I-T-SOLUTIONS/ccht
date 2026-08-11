import { NextRequest, NextResponse } from 'next/server'
import { CourseService } from '@/lib/services/admin/course-service'

export async function GET(
  request: NextRequest,
  { params }: { params: { studentId: string } }
) {
  try {
    const courses = await CourseService.getStudentSelectedCourses(params.studentId)
    return NextResponse.json({ success: true, data: courses })
  } catch (error: any) {
    console.error('[Student courses API] Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}