import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Use admin client to get analytics data
    const adminSupabase = createAdminClient()
    
    const { data: aspirants, error: aspirantsError } = await adminSupabase
      .from('aspirant_profiles')
      .select('*')

    if (aspirantsError) {
      console.error('Failed to fetch aspirants:', aspirantsError)
      return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
    }

    const { data: payments, error: paymentsError } = await adminSupabase
      .from('aspirant_payment_events')
      .select('*')

    if (paymentsError) {
      console.error('Failed to fetch payments:', paymentsError)
    }

    // Calculate conversion analytics
    const totalApplications = aspirants?.length || 0
    const totalPaid = payments?.filter((p: any) => p.status === 'success').length || 0
    const totalSubmitted = aspirants?.filter((a: any) => a.application_status === 'submitted' || a.application_status === 'in_review').length || 0
    const totalAdmitted = aspirants?.filter((a: any) => a.application_status === 'accepted' || a.application_status === 'admitted').length || 0
    
    const paymentConversion = totalApplications > 0 ? (totalPaid / totalApplications) * 100 : 0
    const submissionConversion = totalPaid > 0 ? (totalSubmitted / totalPaid) * 100 : 0
    const admissionConversion = totalSubmitted > 0 ? (totalAdmitted / totalSubmitted) * 100 : 0
    const overallConversion = totalApplications > 0 ? (totalAdmitted / totalApplications) * 100 : 0

    return NextResponse.json({ 
      data: {
        totalApplications,
        totalPaid,
        totalSubmitted,
        totalAdmitted,
        paymentConversion,
        submissionConversion,
        admissionConversion,
        overallConversion
      }
    })
  } catch (error) {
    console.error('Fetch analytics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
