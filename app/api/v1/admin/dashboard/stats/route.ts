import { NextResponse } from 'next/server'
import { DashboardService } from '@/lib/services/admin/dashboard-service'

export async function GET() {
  try {
    const stats = await DashboardService.getDashboardStats()
    return NextResponse.json({ success: true, data: stats })
  } catch (error: any) {
    console.error('[Dashboard stats API] Error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
