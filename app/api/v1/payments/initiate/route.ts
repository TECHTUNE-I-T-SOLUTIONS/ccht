import { createClient } from '@/lib/supabase/server'
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

    const { authorization_url, access_code, reference } = await paystackService.initiatePayment({
      amount: validated.amount,
      email: validated.email,
      description: validated.description || 'Program Fee Payment',
    })

    // Store payment record
    const { data, error } = await supabase
      .from('payments')
      .insert({
        student_id: validated.studentId,
        enrollment_id: validated.enrollmentId,
        amount: validated.amount,
        payment_method: 'paystack',
        paystack_reference: reference,
        paystack_access_code: access_code,
        status: 'pending',
        description: validated.description || 'Program Fee',
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create payment record' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      paymentId: data.id,
      authorizationUrl: authorization_url,
      reference,
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
