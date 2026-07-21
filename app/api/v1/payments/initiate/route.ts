import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import { paystackService } from '@/lib/services/payment.service'
import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'

const paystackInitiateSchema = z.object({
  amount: z.number().positive(),
  email: z.string().email(),
  studentId: z.string().uuid(),
  enrollmentId: z.string().uuid().optional(),
  description: z.string().optional(),
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
    const validated = paystackInitiateSchema.parse(body)

    // Verify student owns this payment
    if (validated.studentId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Get student's enrollment
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('id, program_id')
      .eq('student_id', user.id)
      .eq('status', 'active')
      .single()

    console.log('Enrollment data:', enrollment, 'Error:', enrollmentError)

    const enrollmentId = enrollment?.id || null

    // Get academic session
    const { data: session, error: sessionError } = await supabase
      .from('academic_sessions')
      .select('id')
      .eq('name', '2026/2027')
      .single()

    console.log('Session data:', session, 'Error:', sessionError)

    const sessionId = session?.id || null

    // Create invoice using service client to bypass RLS
    const serviceSupabase = await createServiceClient()
    
    console.log('Creating invoice with data:', {
      student_id: user.id,
      enrollment_id: enrollmentId,
      session_id: sessionId,
      amount: validated.amount,
      description: validated.description
    })
    
    const { data: invoice, error: invoiceError } = await serviceSupabase
      .from('invoices')
      .insert({
        student_id: user.id,
        enrollment_id: enrollmentId,
        session_id: sessionId,
        invoice_number: `INV-${Date.now()}`,
        description: validated.description || 'Program Fee',
        amount_due: validated.amount,
        amount_paid: 0,
        currency: 'NGN',
        status: 'pending',
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      })
      .select()
      .single()

    console.log('Invoice created:', invoice, 'Error:', invoiceError)

    if (invoiceError) {
      console.error('Failed to create invoice:', invoiceError)
      return NextResponse.json(
        { error: 'Failed to create invoice', details: invoiceError },
        { status: 500 }
      )
    }

    console.log('Initiating Paystack payment')
    const { authorization_url, access_code, reference } = await paystackService.initiatePayment({
      amount: validated.amount,
      email: validated.email,
      description: validated.description || 'Program Fee Payment',
    })

    console.log('Paystack response:', { authorization_url, access_code, reference })

    // Store payment record with all fields using service client
    console.log('Creating payment record')
    const { data, error } = await serviceSupabase
      .from('payments')
      .insert({
        student_id: validated.studentId,
        enrollment_id: enrollmentId,
        invoice_id: invoice.id,
        amount: validated.amount,
        currency: 'NGN',
        payment_method: 'paystack',
        paystack_reference: reference,
        paystack_access_code: access_code,
        provider_transaction_id: reference, // Use reference as provider transaction ID
        status: 'pending',
        description: validated.description || 'Program Fee',
        paid_at: null,
      })
      .select()
      .single()

    console.log('Payment record created:', data, 'Error:', error)

    if (error) {
      console.error('Failed to create payment record:', error)
      return NextResponse.json(
        { error: 'Failed to create payment record', details: error },
        { status: 500 }
      )
    }

    console.log('Creating payment event')
    // Insert payment event for initiation using service client
    const { error: eventError } = await serviceSupabase
      .from('payment_events')
      .insert({
        payment_id: data.id,
        invoice_id: invoice.id,
        event_type: 'payment_initiated',
        provider: 'paystack',
        provider_reference: reference,
        payload: {
          amount: validated.amount,
          email: validated.email,
          description: validated.description,
          enrollmentId,
          invoiceId: invoice.id,
        },
        signature: null,
        processed: true,
        processed_at: new Date().toISOString(),
      })

    console.log('Payment event created, Error:', eventError)

    if (eventError) {
      console.error('Failed to create payment event:', eventError)
      // Don't fail the payment initiation if event creation fails
    }

    return NextResponse.json({
      paymentId: data.id,
      authorizationUrl: authorization_url,
      reference,
      invoiceId: invoice.id,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Payment initiation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
