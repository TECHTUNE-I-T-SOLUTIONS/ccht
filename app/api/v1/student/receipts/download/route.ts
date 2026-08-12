import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generatePaymentReceipt } from '@/lib/templates/payment-receipt'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const paymentId = body.paymentId as string | undefined
    const source = (body.source as 'fees' | 'receipts' | undefined) || 'fees'

    if (!paymentId) {
      return NextResponse.json({ error: 'paymentId is required' }, { status: 400 })
    }

    const admin = createAdminClient()

    const tableName = source === 'receipts' ? 'payments' : 'payments'
    const { data: payment, error: paymentError } = await admin
      .from(tableName)
      .select('*')
      .eq('id', paymentId)
      .single()

    if (paymentError || !payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    const { data: profile } = await admin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    const { data: studentProfile } = await admin
      .from('student_profiles')
      .select('*')
      .eq('profile_id', user.id)
      .single()

    const { data: enrollment } = await admin
      .from('enrollments')
      .select('*, program:programs(title, department:departments(name))')
      .eq('student_id', user.id)
      .eq('status', 'active')
      .single()

    const paymentDate = payment.paid_at
      ? new Date(payment.paid_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
      : 'Pending'
    const createdDate = new Date(payment.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

    const doc = generatePaymentReceipt({
      receiptId: payment.id,
      firstName: profile?.first_name || '',
      lastName: profile?.last_name || '',
      matricNumber: studentProfile?.matric_number || '',
      program: enrollment?.program?.title || '',
      department: enrollment?.program?.department?.name || '',
      email: profile?.email || '',
      phone: profile?.phone || studentProfile?.student_number || '',
      paymentType: payment.payment_type || payment.description || 'Fee Payment',
      amount: payment.amount,
      reference: payment.reference || payment.paystack_reference || 'N/A',
      description: payment.description || payment.payment_type || 'Fee Payment',
      status: payment.status || 'pending',
      paymentDate,
      requestDate: createdDate,
    })

    const pdfBytes = doc.output('arraybuffer')
    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Receipt_${paymentId}.pdf"`,
      },
    })
  } catch (error: any) {
    console.error('[student/receipts/download] Error:', error)
    return NextResponse.json({ error: error?.message || 'Failed to generate receipt' }, { status: 500 })
  }
}
