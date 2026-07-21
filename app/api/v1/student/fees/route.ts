import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get student profile to get current session
    const { data: studentProfile } = await supabase
      .from('student_profiles')
      .select('admission_session, current_level')
      .eq('profile_id', user.id)
      .single()

    const currentSession = studentProfile?.admission_session || '2026/2027'
    const currentLevel = studentProfile?.current_level || '100'

    // Get student's enrollments to find their program
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('*, program:programs(id, title, department:departments(name))')
      .eq('student_id', user.id)
      .eq('status', 'active')
      .single()

    // Get fees from the fees table for the student's program
    const { data: fees } = await supabase
      .from('fees')
      .select('*, program:programs(id, title)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    // Filter fees by student's program if they have one
    const relevantFees = fees?.filter((fee: any) => {
      // If student has an enrollment, only show fees for their program
      if (enrollments?.program_id) {
        return fee.program_id === enrollments.program_id
      }
      // Otherwise show all active fees
      return true
    }).map((fee: any) => ({
      id: fee.id,
      session: currentSession,
      semester: 'all',
      fee_type: fee.fee_type,
      amount: parseFloat(fee.amount),
      due_date: fee.due_in_days ? new Date(Date.now() + fee.due_in_days * 24 * 60 * 60 * 1000).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      description: fee.description || '',
      program_id: fee.program_id
    })) || []

    const totalFees = relevantFees.reduce((sum: number, fee: any) => sum + fee.amount, 0)

    // Get student's payment history from payments table
    const { data: payments } = await supabase
      .from('payments')
      .select('id, student_id, enrollment_id, invoice_id, amount, currency, payment_method, paystack_reference, status, description, paid_at, created_at')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false })

    // console.log('Payments for student:', user.id, payments)

    // Get aspirant admission payments
    const { data: admissionPayments } = await supabase
      .from('aspirant_admission_payment')
      .select('*')
      .eq('profile_id', user.id)
      .order('created_at', { ascending: false })

    // Get aspirant application payments
    const { data: applicationPayments } = await supabase
      .from('aspirant_application_payment')
      .select('*')
      .eq('profile_id', user.id)
      .order('created_at', { ascending: false })

    // Combine all payments
    const allPayments = [
      ...(payments || []).map((p: any) => ({ ...p, source: 'payments' })),
      ...(admissionPayments || []).map((p: any) => ({ ...p, source: 'admission' })),
      ...(applicationPayments || []).map((p: any) => ({ ...p, source: 'application' }))
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    // Calculate total paid
    const totalPaid = allPayments.filter((p: any) => p.status === 'success' || p.status === 'paid')
      .reduce((sum: number, p: any) => sum + (p.amount || 0), 0)

    const pendingFees = Math.max(0, totalFees - totalPaid)

    return NextResponse.json({ 
      data: {
        fees: relevantFees,
        payments: allPayments,
        summary: {
          totalFees,
          totalPaid,
          pendingFees,
          currentSession,
          currentLevel,
          program: enrollments?.program || null
        }
      }
    })
  } catch (error: any) {
    console.error('Fees API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
