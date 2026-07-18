import { NextResponse } from 'next/server'
import { ManagementService } from '@/lib/services/admin/management-service'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const students = await ManagementService.getRecentStudents(limit)
    return NextResponse.json({ success: true, data: students })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
