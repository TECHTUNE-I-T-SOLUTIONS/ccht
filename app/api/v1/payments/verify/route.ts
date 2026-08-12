import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import { paystackService } from '@/lib/services/payment.service'
import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'

const paystackVerifySchema = z.object({
  reference: z.string().optional(),
  paymentId: z.string().uuid().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validated = paystackVerifySchema.parse(body)

    if (!validated.reference && !validated.paymentId) {
      return NextResponse.json(
        { error: 'Either reference or paymentId is required' },
        { status: 400 }
      )
    }

    // Verify payment with Paystack
    const verification = validated.reference
      ? await paystackService.verifyPayment(validated.reference)
      : null

    if (verification && (!verification.status || verification.status !== 'success')) {
      return NextResponse.json(
        { error: 'Payment verification failed', details: verification },
        { status: 400 }
      )
    }

    // Find payment by paymentId first, then reference
    let paymentQuery = supabase.from('payments').select('*')
    if (validated.paymentId) {
      paymentQuery = paymentQuery.eq('id', validated.paymentId)
    } else if (validated.reference) {
      paymentQuery = paymentQuery.or(`paystack_reference.eq.${validated.reference},provider_transaction_id.eq.${validated.reference},id.eq.${validated.reference}`)
    }

    const { data: existingPayment, error: findError } = await paymentQuery

    if (findError) {
      console.error('Failed to find payment record:', findError)
      return NextResponse.json(
        { error: 'Database error finding payment' },
        { status: 500 }
      )
    }

    if (!existingPayment || existingPayment.length === 0) {
      console.error('Payment not found for verification payload:', validated)
      return NextResponse.json(
        { error: 'Payment record not found', reference: validated.reference, paymentId: validated.paymentId },
        { status: 404 }
      )
    }

    const payment = existingPayment[0]

    // Verify student owns this payment
    if (payment.student_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden - Payment does not belong to user' },
        { status: 403 }
      )
    }

    // Check if payment is already successful
    if (payment.status === 'success') {
      console.log('Payment already successful:', payment.id)
      // Insert payment event for verification (idempotent)
      try {
        await supabase
          .from('payment_events')
          .insert({
            payment_id: payment.id,
            invoice_id: payment.invoice_id,
            event_type: 'payment_verified',
            provider: 'paystack',
            provider_reference: validated.reference || validated.paymentId || payment.id,
            payload: verification || body,
            signature: null,
            processed: true,
            processed_at: new Date().toISOString(),
          })
      } catch (err) {
        console.log('Payment event already exists or failed:', err)
      }

      return NextResponse.json({
        success: true,
        payment,
        verification,
        message: 'Payment was already verified',
      })
    }

    console.log('Updating payment:', payment.id, 'Current status:', payment.status)

    // Use service client to bypass RLS for payment update
    const serviceSupabase = await createServiceClient()

    // Update payment record
    const { error: updateError } = await serviceSupabase
      .from('payments')
      .update({
        status: 'success',
        paid_at: new Date().toISOString(),
      })
      .eq('id', payment.id)

    console.log('Update error:', updateError)

    if (updateError) {
      console.error('Failed to update payment record:', updateError)
      return NextResponse.json(
        { error: 'Failed to update payment record', details: updateError },
        { status: 500 }
      )
    }

    // Update invoice if payment has an invoice_id
    if (payment.invoice_id) {
      // Get current invoice
      const { data: currentInvoice } = await serviceSupabase
        .from('invoices')
        .select('amount_paid')
        .eq('id', payment.invoice_id)
        .single()

      const newAmountPaid = (currentInvoice?.amount_paid || 0) + payment.amount

      const { error: invoiceUpdateError } = await serviceSupabase
        .from('invoices')
        .update({
          amount_paid: newAmountPaid,
          status: 'paid',
        })
        .eq('id', payment.invoice_id)

      if (invoiceUpdateError) {
        console.error('Failed to update invoice:', invoiceUpdateError)
        // Don't fail the payment verification if invoice update fails
      }
    }

    // Fetch the updated payment to verify the update
    const { data: updatedPayment, error: fetchError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', payment.id)

    if (fetchError) {
      console.error('Failed to fetch updated payment:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch updated payment' },
        { status: 500 }
      )
    }

    const finalPayment = updatedPayment && updatedPayment.length > 0 ? updatedPayment[0] : payment

    // Verify the update actually happened
    if (finalPayment.status !== 'success') {
      console.error('Payment status did not update to success:', finalPayment.status)
      return NextResponse.json(
        { error: 'Payment status was not updated', currentStatus: finalPayment.status },
        { status: 500 }
      )
    }

    console.log('Payment successfully updated:', finalPayment.id, finalPayment.status)

    // Insert payment event for successful verification
    await supabase
      .from('payment_events')
      .insert({
        payment_id: payment.id,
        invoice_id: payment.invoice_id,
        event_type: 'payment_verified',
        provider: 'paystack',
        provider_reference: validated.reference || validated.paymentId || payment.id,
        payload: verification || body,
        signature: null,
        processed: true,
        processed_at: new Date().toISOString(),
      })

    return NextResponse.json({
      success: true,
      payment,
      verification,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Payment verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
