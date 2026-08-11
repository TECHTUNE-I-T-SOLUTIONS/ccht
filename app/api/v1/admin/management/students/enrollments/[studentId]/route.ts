import { NextRequest, NextResponse } from 'next/server'
import { EnrollmentService } from '@/lib/services/admin/enrollment-service'

export async function GET(
  request: NextRequest,
  { params }: { params: { studentId: string } }
) {
  try {
    const enrollments = await EnrollmentService.getStudentEnrollments(params.studentId)
    return NextResponse.json({ success: true, data: enrollments })
  } catch (error: any) {
    console.error('[Student enrollments API] Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}