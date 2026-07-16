import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const adminSupabase = createAdminClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { paymentType } = body

    if (!paymentType || !['application', 'admission'].includes(paymentType)) {
      return NextResponse.json({ error: 'Invalid payment type' }, { status: 400 })
    }

    // Get payment record
    const tableName = paymentType === 'application' ? 'aspirant_application_payments' : 'aspirant_admission_payments'
    const { data: payment } = await supabase
      .from(tableName)
      .select('*')
      .eq('aspirant_id', user.id)
      .eq('status', 'success')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!payment) {
      return NextResponse.json({ error: 'No successful payment found' }, { status: 404 })
    }

    // Update aspirant profile using admin client
    if (paymentType === 'application') {
      const { error } = await adminSupabase
        .from('aspirant_profiles')
        .update({
          application_fee_paid: true,
          application_fee_paid_at: payment.paid_at || new Date().toISOString(),
          current_stage: 'documents'
        })
        .eq('profile_id', user.id)

      if (error) {
        console.error('Error updating aspirant profile:', error)
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
      }
    } else {
      const { error } = await adminSupabase
        .from('aspirant_profiles')
        .update({
          admission_fee_paid: true,
          admission_fee_paid_at: payment.paid_at || new Date().toISOString(),
          current_stage: 'migration'
        })
        .eq('profile_id', user.id)

      if (error) {
        console.error('Error updating aspirant profile:', error)
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Profile sync error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to sync profile' },
      { status: 500 }
    )
  }
}
