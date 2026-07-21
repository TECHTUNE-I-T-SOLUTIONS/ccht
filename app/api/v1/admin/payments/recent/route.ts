import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    const supabase = await createAdminClient()

    // Fetch recent payments from all three tables
    const [paymentsRes, admissionPaymentsRes, applicationPaymentsRes] = await Promise.all([
      supabase
        .from('payments')
        .select(`
          id,
          amount,
          payment_type,
          status,
          reference,
          description,
          created_at,
          paid_at,
          student_id,
          profiles:student_id (
            id,
            first_name,
            last_name,
            email
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit),
      supabase
        .from('aspirant_admission_payments')
        .select(`
          id,
          amount,
          payment_status,
          paystack_reference,
          provider_transaction_id,
          created_at,
          paid_at,
          aspirant_id,
          profiles:aspirant_id (
            id,
            first_name,
            last_name,
            email
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit),
      supabase
        .from('aspirant_application_payments')
        .select(`
          id,
          amount,
          payment_status,
          paystack_reference,
          provider_transaction_id,
          created_at,
          paid_at,
          aspirant_id,
          profiles:aspirant_id (
            id,
            first_name,
            last_name,
            email
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit),
    ])

    // Combine and format all payments
    const allPayments = [
      ...(paymentsRes.data || []).map((p: any) => ({
        id: p.id,
        amount: p.amount,
        payment_type: p.payment_type || 'fee',
        status: p.status || 'pending',
        reference: p.paystack_reference || p.provider_transaction_id || p.reference || 'N/A',
        description: p.description || 'Payment',
        created_at: p.created_at,
        paid_at: p.paid_at,
        user: p.profiles,
        source: 'payments'
      })),
      ...(admissionPaymentsRes.data || []).map((p: any) => ({
        id: p.id,
        amount: p.amount,
        payment_type: 'admission_fee',
        status: p.payment_status || 'pending',
        reference: p.paystack_reference || p.provider_transaction_id || 'N/A',
        description: 'Admission Fee Payment',
        created_at: p.created_at,
        paid_at: p.paid_at,
        user: p.profiles,
        source: 'aspirant_admission_payments'
      })),
      ...(applicationPaymentsRes.data || []).map((p: any) => ({
        id: p.id,
        amount: p.amount,
        payment_type: 'application_fee',
        status: p.payment_status || 'pending',
        reference: p.paystack_reference || p.provider_transaction_id || 'N/A',
        description: 'Application Fee Payment',
        created_at: p.created_at,
        paid_at: p.paid_at,
        user: p.profiles,
        source: 'aspirant_application_payments'
      }))
    ]

    // Sort by created_at and limit
    allPayments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    const recentPayments = allPayments.slice(0, limit)

    return NextResponse.json({ success: true, data: recentPayments })
  } catch (error: any) {
    console.error('Failed to fetch recent payments:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
