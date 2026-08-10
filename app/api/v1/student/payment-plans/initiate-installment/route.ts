import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PaymentService } from '@/lib/services/payment.service'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { paymentPlanId, installmentNumber, email, enrollmentId, description } = body

    if (!paymentPlanId || !installmentNumber || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (![1, 2].includes(installmentNumber)) {
      return NextResponse.json({ error: 'Invalid installment number' }, { status: 400 })
    }

    // Get the payment plan to verify ownership and get amount
    const { data: paymentPlan, error: planError } = await supabase
      .from('payment_plans')
      .select('*')
      .eq('id', paymentPlanId)
      .eq('student_id', user.id)
      .single()

    if (planError || !paymentPlan) {
      return NextResponse.json({ error: 'Payment plan not found or unauthorized' }, { status: 404 })
    }

    // Determine amount based on installment number
    const amount = installmentNumber === 1 
      ? paymentPlan.first_installment_amount 
      : paymentPlan.second_installment_amount

    if (!amount) {
      return NextResponse.json({ error: 'Invalid installment amount' }, { status: 400 })
    }

    // Check if installment is already paid
    if (installmentNumber === 1 && paymentPlan.first_installment_paid) {
      return NextResponse.json({ error: 'First installment already paid' }, { status: 400 })
    }

    if (installmentNumber === 2 && paymentPlan.second_installment_paid) {
      return NextResponse.json({ error: 'Second installment already paid' }, { status: 400 })
    }

    // Check if first installment is paid before allowing second
    if (installmentNumber === 2 && !paymentPlan.first_installment_paid) {
      return NextResponse.json({ error: 'First installment must be paid before second installment' }, { status: 400 })
    }

    const paymentResult = await PaymentService.initiateInstallmentPayment(
      user.id,
      email,
      paymentPlanId,
      installmentNumber,
      amount,
      enrollmentId,
      description
    )

    return NextResponse.json({ data: paymentResult })
  } catch (error: any) {
    console.error('Installment payment initiation error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}