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

    // Get student's payment history from payments table
    const { data: payments } = await supabase
      .from('payments')
      .select('*')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false })

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

    // For now, return empty fees array since fee_schedules may not exist
    const relevantFees: any[] = []
    const totalFees = 0
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
