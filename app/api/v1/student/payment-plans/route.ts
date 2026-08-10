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
    const { totalAmount, planType, enrollmentId, sessionId } = body

    if (!totalAmount || !planType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!['full', 'installment'].includes(planType)) {
      return NextResponse.json({ error: 'Invalid plan type' }, { status: 400 })
    }

    const paymentPlan = await PaymentService.createPaymentPlan(
      user.id,
      totalAmount,
      planType,
      enrollmentId,
      sessionId
    )

    return NextResponse.json({ data: paymentPlan })
  } catch (error: any) {
    console.error('Payment plan creation error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    const paymentPlan = await PaymentService.getPaymentPlan(user.id, sessionId || undefined)

    return NextResponse.json({ data: paymentPlan })
  } catch (error: any) {
    console.error('Payment plan fetch error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}