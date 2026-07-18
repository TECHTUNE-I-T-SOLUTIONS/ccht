import { NextResponse } from 'next/server'
import { ManagementService } from '@/lib/services/admin/management-service'

export async function GET() {
  try {
    const stats = await ManagementService.getAdminStats()
    return NextResponse.json({ success: true, data: stats })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
