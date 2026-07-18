import { NextRequest, NextResponse } from 'next/server'
import { AspirantPaymentsService } from '@/lib/services/aspirant-payments.service'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const adminSupabase = createAdminClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const status = await AspirantPaymentsService.getAspirantPaymentStatus(user.id, adminSupabase)
    
    return NextResponse.json({ success: true, data: status })
  } catch (error: any) {
    console.error('Payment status fetch error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch payment status' },
      { status: 500 }
    )
  }
}
