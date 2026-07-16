import { NextRequest, NextResponse } from 'next/server'
import { AspirantPaymentsService } from '@/lib/services/aspirant-payments.service'
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
    const { reference } = body

    if (!reference) {
      return NextResponse.json({ error: 'Reference is required' }, { status: 400 })
    }

    // Verify transaction with Paystack
    const verifyResponse = await AspirantPaymentsService.verifyTransaction(reference)
    
    if (verifyResponse.data.status !== 'success') {
      return NextResponse.json({ error: 'Payment not successful' }, { status: 400 })
    }

    // Check if payment belongs to this user
    const isApplicationPayment = reference.startsWith('APP-')
    const tableName = isApplicationPayment ? 'aspirant_application_payments' : 'aspirant_admission_payments'
    
    const { data: payment } = await supabase
      .from(tableName)
      .select('*')
      .eq('paystack_reference', reference)
      .eq('aspirant_id', user.id)
      .single()

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    // Update payment status if not already successful using admin client to bypass RLS
    if (payment.status !== 'success') {
      const { error: updateError } = await adminSupabase
        .from(tableName)
        .update({
          status: 'success',
          paid_at: new Date(verifyResponse.data.paid_at).toISOString(),
          provider_transaction_id: verifyResponse.data.transaction || verifyResponse.data.reference,
        })
        .eq('id', payment.id)

      if (updateError) {
        console.error('Error updating payment:', updateError)
        return NextResponse.json({ error: 'Failed to update payment status' }, { status: 500 })
      }
    }

    // Always update aspirant profile if payment is successful
    if (payment.status === 'success' || verifyResponse.data.status === 'success') {
      if (isApplicationPayment) {
        const { error: profileError } = await adminSupabase
          .from('aspirant_profiles')
          .update({
            application_fee_paid: true,
            application_fee_paid_at: new Date().toISOString(),
            current_stage: 'documents'
          })
          .eq('profile_id', user.id)

        if (profileError) {
          console.error('Error updating aspirant profile:', profileError)
          return NextResponse.json({ error: 'Failed to update aspirant profile: ' + profileError.message }, { status: 500 })
        }
      } else {
        const { error: profileError } = await adminSupabase
          .from('aspirant_profiles')
          .update({
            admission_fee_paid: true,
            admission_fee_paid_at: new Date().toISOString(),
            current_stage: 'migration'
          })
          .eq('profile_id', user.id)

        if (profileError) {
          console.error('Error updating aspirant profile:', profileError)
          return NextResponse.json({ error: 'Failed to update aspirant profile: ' + profileError.message }, { status: 500 })
        }
      }
    }

    // Fetch updated payment
    const { data: updatedPayment } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', payment.id)
      .single()

    return NextResponse.json({ success: true, payment: updatedPayment })
  } catch (error: any) {
    console.error('Payment verification error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to verify payment' },
      { status: 500 }
    )
  }
}
