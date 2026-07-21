import { NextRequest, NextResponse } from 'next/server'
import { AspirantPaymentsService } from '@/lib/services/aspirant-payments.service'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      console.error('[Payment History] No user found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[Payment History] Fetching for user:', user.id)

    const payments = await AspirantPaymentsService.getAspirantPaymentHistory(user.id)

    // console.log('[Payment History] Returning payments:', payments.length)

    return NextResponse.json({ success: true, data: payments })
  } catch (error: any) {
    console.error('[Payment History] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch payment history' },
      { status: 500 }
    )
  }
}
