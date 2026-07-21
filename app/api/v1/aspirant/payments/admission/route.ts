import { NextRequest, NextResponse } from 'next/server'
import { AspirantPaymentsService } from '@/lib/services/aspirant-payments.service'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Check if user is an aspirant
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'aspirant') {
      return NextResponse.json({ error: 'Only aspirants can initiate admission payments' }, { status: 403 })
    }

    // Check if aspirant has been accepted for admission
    const { data: aspirantProfile } = await supabase
      .from('aspirant_profiles')
      .select('application_status')
      .eq('profile_id', user.id)
      .single()

    if (aspirantProfile?.application_status !== 'accepted') {
      return NextResponse.json({ error: 'Payment is only available after you have been accepted for admission' }, { status: 403 })
    }

    const response = await AspirantPaymentsService.initiateAdmissionPayment(user.id, email, supabase)
    
    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Admission payment initiation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to initiate payment' },
      { status: 500 }
    )
  }
}
