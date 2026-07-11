import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get payments for the current user
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false })

    if (paymentsError) {
      console.error('[payments] Error fetching payments:', paymentsError)
      return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
    }

    return NextResponse.json({ data: payments || [] })
  } catch (error) {
    console.error('[payments] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { amount, description, paymentMethod, enrollmentId } = body

    if (!amount || !description) {
      return NextResponse.json({ error: 'Amount and description are required' }, { status: 400 })
    }

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        student_id: user.id,
        amount,
        description,
        payment_method: paymentMethod || 'paystack',
        status: 'pending',
        enrollment_id: enrollmentId || null,
      })
      .select()
      .single()

    if (paymentError) {
      console.error('[payments] Error creating payment:', paymentError)
      return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 })
    }

    return NextResponse.json({ data: payment }, { status: 201 })
  } catch (error) {
    console.error('[payments] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}