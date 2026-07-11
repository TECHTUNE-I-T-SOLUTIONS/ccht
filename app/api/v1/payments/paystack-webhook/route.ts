import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || ''

function verifyPaystackSignature(req: any, signature: string): boolean {
  const hash = crypto.createHmac('sha512', PAYSTACK_SECRET)
    .update(JSON.stringify(req))
    .digest('hex')
  return hash === signature
}

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-paystack-signature')
    const body = await request.json()

    if (!signature || !verifyPaystackSignature(body, signature)) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    const supabase = await createClient()
    const { event, data } = body

    if (event === 'charge.success') {
      const { reference, amount, customer } = data

      // Update payment record
      const { error } = await supabase
        .from('payments')
        .update({
          status: 'success',
          paid_at: new Date().toISOString(),
        })
        .eq('paystack_reference', reference)

      if (error) {
        console.error('Failed to update payment:', error)
        return NextResponse.json(
          { error: 'Failed to process payment' },
          { status: 500 }
        )
      }

      // You can add additional logic here like:
      // - Send confirmation email
      // - Update enrollment status
      // - Generate receipt
      // - Send to accounting system

      return NextResponse.json({ success: true })
    }

    if (event === 'charge.failed') {
      const { reference } = data

      // Update payment record
      await supabase
        .from('payments')
        .update({ status: 'failed' })
        .eq('paystack_reference', reference)

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
