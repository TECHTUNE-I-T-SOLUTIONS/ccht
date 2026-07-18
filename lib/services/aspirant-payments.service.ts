import { createClient } from '@/lib/supabase/client'

export interface AspirantApplicationPayment {
  id: string
  aspirant_id: string
  amount: number
  currency: string
  payment_method: string | null
  paystack_reference: string | null
  paystack_access_code: string | null
  provider_transaction_id: string | null
  status: 'pending' | 'success' | 'failed' | 'abandoned' | 'refunded'
  description: string | null
  paid_at: string | null
  created_at: string
  updated_at: string
}

export interface AspirantAdmissionPayment {
  id: string
  aspirant_id: string
  amount: number
  currency: string
  payment_method: string | null
  paystack_reference: string | null
  paystack_access_code: string | null
  provider_transaction_id: string | null
  status: 'pending' | 'success' | 'failed' | 'abandoned' | 'refunded'
  description: string | null
  paid_at: string | null
  created_at: string
  updated_at: string
}

export interface PaystackInitiateResponse {
  status: boolean
  message: string
  data: {
    access_code: string
    reference: string
  }
}

export interface PaystackVerifyResponse {
  status: boolean
  message: string
  data: {
    status: string
    reference: string
    amount: number
    paid_at: string
    transaction?: string
    customer: {
      email: string
      first_name: string
      last_name: string
    }
  }
}

export class AspirantPaymentsService {
  private static readonly PAYSTACK_SECRET_KEY = process.env.NEXT_PUBLIC_PAYSTACK_SECRET_KEY || process.env.PAYSTACK_SECRET_KEY
  private static readonly PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY

  /**
   * Initialize application fee payment
   */
  static async initiateApplicationPayment(aspirantId: string, email: string, supabaseClient?: any): Promise<PaystackInitiateResponse> {
    const supabase = supabaseClient || createClient()
    
    // Check if there's already a pending payment
    const { data: existingPayment } = await supabase
      .from('aspirant_application_payments')
      .select('*')
      .eq('aspirant_id', aspirantId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (existingPayment && existingPayment.paystack_access_code) {
      return {
        status: true,
        message: 'Existing payment found',
        data: {
          access_code: existingPayment.paystack_access_code,
          reference: existingPayment.paystack_reference || '',
        }
      }
    }

    // Create new payment record
    const reference = `APP-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    
    const { data: payment, error: dbError } = await supabase
      .from('aspirant_application_payments')
      .insert({
        aspirant_id: aspirantId,
        amount: 6500,
        currency: 'NGN',
        payment_method: 'paystack',
        paystack_reference: reference,
        status: 'pending',
        description: 'Application Fee Payment'
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error creating payment:', dbError)
      throw new Error(`Failed to create payment record: ${dbError.message || 'Table may not exist. Please run the SQL migration.'}`)
    }

    // Initialize Paystack transaction
    const paystackResponse = await this.initializePaystackTransaction(
      email,
      6500,
      reference,
      'Application Fee Payment'
    )

    // Update payment record with access code
    await supabase
      .from('aspirant_application_payments')
      .update({
        paystack_access_code: paystackResponse.data.access_code,
        provider_transaction_id: paystackResponse.data.reference
      })
      .eq('id', payment.id)

    return paystackResponse
  }

  /**
   * Initialize admission fee payment
   */
  static async initiateAdmissionPayment(aspirantId: string, email: string, supabaseClient?: any): Promise<PaystackInitiateResponse> {
    const supabase = supabaseClient || createClient()
    
    // Check if aspirant has completed previous stages
    const { data: aspirant } = await supabase
      .from('aspirant_profiles')
      .select('*')
      .eq('profile_id', aspirantId)
      .single()

    if (!aspirant) throw new Error('Aspirant profile not found')
    if (!aspirant.application_fee_paid) throw new Error('Application fee must be paid first')
    if (!aspirant.documents_uploaded) throw new Error('Documents must be uploaded first')
    if (!aspirant.exam_completed) throw new Error('Entrance exam must be completed first')

    // Check if there's already a pending payment
    const { data: existingPayment } = await supabase
      .from('aspirant_admission_payments')
      .select('*')
      .eq('aspirant_id', aspirantId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (existingPayment && existingPayment.paystack_access_code) {
      return {
        status: true,
        message: 'Existing payment found',
        data: {
          access_code: existingPayment.paystack_access_code,
          reference: existingPayment.paystack_reference || '',
        }
      }
    }

    // Create new payment record
    const reference = `ADM-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    
    const { data: payment, error: dbError } = await supabase
      .from('aspirant_admission_payments')
      .insert({
        aspirant_id: aspirantId,
        amount: 30000,
        currency: 'NGN',
        payment_method: 'paystack',
        paystack_reference: reference,
        status: 'pending',
        description: 'Admission Administrative Charges'
      })
      .select()
      .single()

    if (dbError) throw new Error('Failed to create payment record')

    // Initialize Paystack transaction
    const paystackResponse = await this.initializePaystackTransaction(
      email,
      30000,
      reference,
      'Admission Administrative Charges'
    )

    // Update payment record with access code
    await supabase
      .from('aspirant_admission_payments')
      .update({
        paystack_access_code: paystackResponse.data.access_code,
        provider_transaction_id: paystackResponse.data.reference
      })
      .eq('id', payment.id)

    return paystackResponse
  }

  /**
   * Initialize Paystack transaction
   */
  private static async initializePaystackTransaction(
    email: string,
    amount: number,
    reference: string,
    description: string
  ): Promise<PaystackInitiateResponse> {
    if (!this.PAYSTACK_SECRET_KEY) {
      throw new Error('Paystack secret key not configured')
    }

    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: amount * 100, // Paystack expects amount in kobo
        reference,
        description,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/v1/aspirant/payments/callback`,
        metadata: {
          custom_fields: [
            {
              display_name: 'Payment Type',
              variable_name: 'payment_type',
              value: description,
            },
          ],
        },
      }),
    })

    const data = await response.json()
    
    if (!data.status) {
      throw new Error(data.message || 'Failed to initialize Paystack transaction')
    }

    return data
  }

  /**
   * Verify Paystack transaction
   */
  static async verifyTransaction(reference: string): Promise<PaystackVerifyResponse> {
    if (!this.PAYSTACK_SECRET_KEY) {
      throw new Error('Paystack secret key not configured')
    }

    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.PAYSTACK_SECRET_KEY}`,
      },
    })

    if (!response.ok) {
      const text = await response.text()
      console.error('Paystack verification failed:', response.status, text)
      throw new Error(`Paystack API returned ${response.status}: ${text.substring(0, 200)}`)
    }

    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text()
      console.error('Paystack returned non-JSON response:', text.substring(0, 200))
      throw new Error('Paystack API returned non-JSON response. Please try again later.')
    }

    const data = await response.json()
    
    if (!data.status) {
      throw new Error(data.message || 'Failed to verify transaction')
    }

    return data
  }

  /**
   * Get aspirant payment status
   */
  static async getAspirantPaymentStatus(aspirantId: string, supabaseClient?: any) {
    const supabase = supabaseClient || createClient()
    
    const [applicationPayments, admissionPayments, aspirantProfile] = await Promise.all([
      supabase
        .from('aspirant_application_payments')
        .select('*')
        .eq('aspirant_id', aspirantId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('aspirant_admission_payments')
        .select('*')
        .eq('aspirant_id', aspirantId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('aspirant_profiles')
        .select('*')
        .eq('profile_id', aspirantId)
        .maybeSingle()
    ])

    return {
      applicationFee: applicationPayments.data,
      admissionFee: admissionPayments.data,
      profile: aspirantProfile.data,
    }
  }

  /**
   * Process payment webhook
   */
  static async processWebhook(event: any) {
    const supabase = createClient()
    
    // Log the event
    await supabase.from('aspirant_payment_events').insert({
      payment_id: null,
      payment_type: event.data.metadata?.payment_type === 'Admission Administrative Charges' ? 'admission' : 'application',
      event_type: event.event,
      provider: 'paystack',
      provider_reference: event.data.reference,
      payload: event,
      signature: '',
      processed: false,
    })

    if (event.event === 'charge.success') {
      const reference = event.data.reference
      
      // Determine payment type from reference prefix
      const isApplicationPayment = reference.startsWith('APP-')
      const tableName = isApplicationPayment ? 'aspirant_application_payments' : 'aspirant_admission_payments'
      
      // Update payment status
      const { data: payment } = await supabase
        .from(tableName)
        .update({
          status: 'success',
          paid_at: new Date(event.data.paid_at).toISOString(),
          provider_transaction_id: event.data.transaction,
        })
        .eq('paystack_reference', reference)
        .select()
        .single()

      // Update payment event as processed
      await supabase
        .from('aspirant_payment_events')
        .update({ processed: true, processed_at: new Date().toISOString(), payment_id: payment?.id })
        .eq('provider_reference', reference)
        .order('created_at', { ascending: false })
        .limit(1)

      return payment
    }

    return null
  }
}
