import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is an admin using service client to bypass RLS
    const serviceSupabase = await createServiceClient()
    const { data: profile } = await serviceSupabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can record manual payments' }, { status: 403 })
    }

    const body = await request.json()
    const { aspirantId, paymentType, amount, description, paymentMethod, reference, paidAt } = body

    if (!aspirantId || !paymentType || !amount) {
      return NextResponse.json({ 
        error: 'Missing required fields: aspirantId, paymentType, and amount are required' 
      }, { status: 400 })
    }

    if (!['application', 'admission'].includes(paymentType)) {
      return NextResponse.json({ 
        error: 'Invalid payment type. Must be "application" or "admission"' 
      }, { status: 400 })
    }

    // Determine the table based on payment type
    const tableName = paymentType === 'application' 
      ? 'aspirant_application_payments' 
      : 'aspirant_admission_payments'

    // Generate a manual reference if not provided
    const manualReference = reference || `MANUAL-${paymentType.toUpperCase()}-${Date.now()}`

    // Map payment method to allowed values in database constraint
    const allowedPaymentMethods = ['paystack', 'bank_transfer', 'cash']
    const mappedPaymentMethod = allowedPaymentMethods.includes(paymentMethod) 
      ? paymentMethod 
      : 'cash' // Default to cash for manual payments

    // Use service client for writing to bypass RLS
    const paymentInsertData = {
      aspirant_id: aspirantId,
      amount,
      currency: 'NGN',
      payment_method: mappedPaymentMethod,
      paystack_reference: manualReference,
      provider_transaction_id: manualReference,
      status: 'success',
      description: description || `Offline ${paymentType} fee payment`,
      paid_at: paidAt || new Date().toISOString(),
    }

    const { data: payment, error: paymentError } = await serviceSupabase
      .from(tableName)
      .insert(paymentInsertData)
      .select()
      .single()

    if (paymentError) {
      console.error('Error creating manual payment:', paymentError)
      return NextResponse.json({ 
        error: `Failed to create manual payment: ${paymentError.message}` 
      }, { status: 500 })
    }

    // Update the aspirant profile to reflect the payment
    const updateField = paymentType === 'application' ? 'application_fee_paid' : 'admission_fee_paid'
    const timestampField = paymentType === 'application' ? 'application_fee_paid_at' : 'admission_fee_paid_at'
    
    const updateData: Record<string, any> = {
      [updateField]: true,
      [timestampField]: paidAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { error: updateError } = await serviceSupabase
      .from('aspirant_profiles')
      .update(updateData)
      .eq('profile_id', aspirantId)

    if (updateError) {
      console.error('Error updating aspirant profile:', updateError)
      return NextResponse.json({ 
        error: `Payment recorded but failed to update aspirant profile: ${updateError.message}` 
      }, { status: 500 })
    }

    // Optionally update the current_stage if needed based on payment type
    try {
      const { data: currentAspirant } = await serviceSupabase
        .from('aspirant_profiles')
        .select('current_stage')
        .eq('profile_id', aspirantId)
        .single()

      if (currentAspirant) {
        let stageUpdate = null
        if (paymentType === 'application' && currentAspirant.current_stage === 'signup') {
          stageUpdate = { current_stage: 'documents' }
        } else if (paymentType === 'admission' && currentAspirant.current_stage === 'admission_fee') {
          stageUpdate = { current_stage: 'migration' }
        }

        if (stageUpdate) {
          await serviceSupabase
            .from('aspirant_profiles')
            .update(stageUpdate)
            .eq('profile_id', aspirantId)
        }
      }
    } catch (stageError) {
      console.error('Error updating aspirant stage:', stageError)
      // Don't fail the request if stage update fails
    }

    return NextResponse.json({
      success: true,
      data: payment,
      message: 'Offline payment recorded successfully'
    })

  } catch (error: any) {
    console.error('Manual payment API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to record manual payment' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is an admin using service client
    const serviceSupabase = await createServiceClient()
    const { data: profile } = await serviceSupabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Only admins can view manual payments' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const aspirantId = searchParams.get('aspirantId')
    const paymentType = searchParams.get('paymentType')

    let query = serviceSupabase
      .from('aspirant_application_payments')
      .select('*')
      .in('payment_method', ['cash', 'bank_transfer'])
      .order('created_at', { ascending: false })

    if (aspirantId) {
      query = query.eq('aspirant_id', aspirantId)
    }

    const { data: applicationPayments, error: appError } = await query

    let admissionPayments = []
    if (!paymentType || paymentType === 'admission') {
      let admissionQuery = serviceSupabase
        .from('aspirant_admission_payments')
        .select('*')
        .in('payment_method', ['cash', 'bank_transfer'])
        .order('created_at', { ascending: false })

      if (aspirantId) {
        admissionQuery = admissionQuery.eq('aspirant_id', aspirantId)
      }

      const { data: admPayments, error: admError } = await admissionQuery
      if (!admError) {
        admissionPayments = admPayments || []
      }
    }

    const allPayments = [
      ...(applicationPayments || []).map((p: any) => ({ ...p, payment_type: 'application' })),
      ...admissionPayments.map((p: any) => ({ ...p, payment_type: 'admission' }))
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return NextResponse.json({
      success: true,
      data: allPayments
    })

  } catch (error: any) {
    console.error('Manual payments fetch error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch manual payments' },
      { status: 500 }
    )
  }
}