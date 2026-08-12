import { createClient } from '@/lib/supabase/server';
import { PAYSTACK_CONFIG } from '@/lib/constants';

export type Payment = {
  id: string;
  student_id: string;
  enrollment_id?: string;
  amount: number;
  payment_method: string;
  paystack_reference?: string;
  paystack_access_code?: string;
  status: string;
  description?: string;
  paid_at?: string;
  created_at: string;
  updated_at: string;
  payment_plan_type?: 'full' | 'installment_1' | 'installment_2';
  installment_number?: 1 | 2;
  payment_plan_id?: string;
  due_date?: string;
};

export type PaymentPlan = {
  id: string;
  student_id: string;
  enrollment_id?: string;
  session_id?: string;
  total_amount: number;
  amount_paid: number;
  amount_remaining: number;
  plan_type: 'full' | 'installment';
  first_installment_amount?: number;
  first_installment_paid: boolean;
  first_installment_paid_at?: string;
  second_installment_amount?: number;
  second_installment_paid: boolean;
  second_installment_paid_at?: string;
  second_installment_due_date?: string;
  status: 'pending' | 'partial' | 'completed' | 'overdue';
  is_late: boolean;
  created_at: string;
  updated_at: string;
};

export class PaymentService {
  static async initiatePaystackPayment(
    studentId: string,
    amount: number,
    enrollmentId?: string,
    description?: string
  ): Promise<{ accessCode: string; authorizationUrl: string; reference: string }> {
    const supabase = await createClient();

    // Create payment record first with pending status
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        student_id: studentId,
        enrollment_id: enrollmentId || null,
        amount,
        payment_method: 'paystack',
        status: 'pending',
        description: description || null,
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Error creating payment record:', paymentError);
      throw new Error('Failed to create payment record');
    }

    try {
      // Call Paystack API
      const response = await fetch(`${PAYSTACK_CONFIG.API_BASE_URL}/transaction/initialize`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${PAYSTACK_CONFIG.SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: studentId, // This should be student email, but we'll use ID for now
          amount: Math.round(amount * 100), // Convert to kobo
          reference: payment.id,
          metadata: {
            student_id: studentId,
            enrollment_id: enrollmentId || null,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Paystack API error');
      }

      const data = await response.json();

      if (data.status) {
        // Update payment with Paystack details
        await supabase
          .from('payments')
          .update({
            paystack_reference: data.data.reference,
            paystack_access_code: data.data.access_code,
          })
          .eq('id', payment.id);

        return {
          accessCode: data.data.access_code,
          authorizationUrl: data.data.authorization_url,
          reference: data.data.reference,
        };
      } else {
        throw new Error('Failed to initialize Paystack payment');
      }
    } catch (error) {
      console.error('Error initiating Paystack payment:', error);

      // Update payment as failed
      await supabase
        .from('payments')
        .update({ status: 'failed' })
        .eq('id', payment.id);

      throw new Error('Failed to initiate payment');
    }
  }

  static async verifyPaystackPayment(reference: string): Promise<boolean> {
    try {
      const response = await fetch(`${PAYSTACK_CONFIG.API_BASE_URL}/transaction/verify/${reference}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${PAYSTACK_CONFIG.SECRET_KEY}`,
        },
      });

      if (!response.ok) {
        throw new Error('Paystack API error');
      }

      const data = await response.json();

      if (data.status && data.data.status === 'success') {
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error verifying Paystack payment:', error);
      throw new Error('Failed to verify payment');
    }
  }

  static async getPaymentHistory(studentId: string): Promise<Payment[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching payment history:', error);
      throw new Error('Failed to fetch payment history');
    }

    return data || [];
  }

  static async getPaymentById(paymentId: string): Promise<Payment | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching payment:', error);
      throw new Error('Failed to fetch payment');
    }

    return data || null;
  }

  static async updatePaymentStatus(paymentId: string, status: string): Promise<Payment> {
    const supabase = await createClient();

    const updateData: Record<string, any> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'success') {
      updateData.paid_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('payments')
      .update(updateData)
      .eq('id', paymentId)
      .select()
      .single();

    if (error) {
      console.error('Error updating payment status:', error);
      throw new Error('Failed to update payment status');
    }

    return data;
  }

  static async getAllPayments(): Promise<Payment[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching payments:', error);
      throw new Error('Failed to fetch payments');
    }

    return data || [];
  }

  static async getPaymentStats() {
    const supabase = await createClient();

    const { data: successPayments, error: successError } = await supabase
      .from('payments')
      .select('amount')
      .eq('status', 'success');

    const { data: pendingPayments, error: pendingError } = await supabase
      .from('payments')
      .select('amount')
      .eq('status', 'pending');

    if (successError || pendingError) {
      console.error('Error fetching payment stats:', successError || pendingError);
      throw new Error('Failed to fetch payment stats');
    }

    const totalSuccessful = (successPayments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalPending = (pendingPayments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalCount = (successPayments || []).length + (pendingPayments || []).length;

    return {
      totalSuccessful,
      totalPending,
      totalCount,
    };
  }

  static async createPaymentPlan(
    studentId: string,
    totalAmount: number,
    planType: 'full' | 'installment',
    enrollmentId?: string,
    sessionId?: string
  ): Promise<PaymentPlan> {
    const supabase = await createClient();

    const firstInstallmentAmount = planType === 'installment' ? Math.round(totalAmount * 0.6) : totalAmount;
    const secondInstallmentAmount = planType === 'installment' ? Math.round(totalAmount * 0.4) : 0;
    
    // Calculate due date for second installment (1 month from now)
    const secondInstallmentDueDate = planType === 'installment' 
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      : null;

    const { data, error } = await supabase
      .from('payment_plans')
      .insert({
        student_id: studentId,
        enrollment_id: enrollmentId || null,
        session_id: sessionId || null,
        total_amount: totalAmount,
        amount_paid: 0,
        amount_remaining: totalAmount,
        plan_type: planType,
        first_installment_amount: firstInstallmentAmount,
        second_installment_amount: secondInstallmentAmount || null,
        second_installment_due_date: secondInstallmentDueDate,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating payment plan:', error);
      throw new Error('Failed to create payment plan');
    }

    return data;
  }

  static async getPaymentPlan(studentId: string, sessionId?: string): Promise<PaymentPlan | null> {
    const supabase = await createClient();

    let query = supabase
      .from('payment_plans')
      .select('*')
      .eq('student_id', studentId);

    if (sessionId) {
      query = query.eq('session_id', sessionId);
    }

    const { data, error } = await query.order('created_at', { ascending: false }).limit(1).single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching payment plan:', error);
      throw new Error('Failed to fetch payment plan');
    }

    return data || null;
  }

  static async initiateInstallmentPayment(
    studentId: string,
    email: string,
    paymentPlanId: string,
    installmentNumber: 1 | 2,
    amount: number,
    enrollmentId?: string,
    description?: string
  ): Promise<{ accessCode: string; authorizationUrl: string; reference: string; paymentId: string }> {
    const supabase = await createClient();

    const paymentPlanType = installmentNumber === 1 ? 'installment_1' : 'installment_2';

    // Create payment record with installment details
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        student_id: studentId,
        enrollment_id: enrollmentId || null,
        amount,
        payment_method: 'paystack',
        status: 'pending',
        description: description || null,
        payment_plan_type: paymentPlanType,
        installment_number: installmentNumber,
        payment_plan_id: paymentPlanId,
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Error creating payment record:', paymentError);
      throw new Error('Failed to create payment record');
    }

    try {
      // Call Paystack API
      const response = await fetch(`${PAYSTACK_CONFIG.API_BASE_URL}/transaction/initialize`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${PAYSTACK_CONFIG.SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          amount: Math.round(amount * 100),
          reference: payment.id,
          metadata: {
            student_id: studentId,
            enrollment_id: enrollmentId || null,
            payment_plan_id: paymentPlanId,
            installment_number: installmentNumber,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Paystack API error');
      }

      const data = await response.json();

      if (data.status) {
        // Update payment with Paystack details
        await supabase
          .from('payments')
          .update({
            paystack_reference: data.data.reference,
            paystack_access_code: data.data.access_code,
          })
          .eq('id', payment.id);

        return {
          accessCode: data.data.access_code,
          authorizationUrl: data.data.authorization_url,
          reference: data.data.reference,
          paymentId: payment.id,
        };
      } else {
        throw new Error('Failed to initialize Paystack payment');
      }
    } catch (error) {
      console.error('Error initiating Paystack payment:', error);

      // Update payment as failed
      await supabase
        .from('payments')
        .update({ status: 'failed' })
        .eq('id', payment.id);

      throw new Error('Failed to initiate payment');
    }
  }

  static async getStudentPaymentSummary(studentId: string, sessionId?: string) {
    const supabase = await createClient();

    // Get payment plan
    const { data: paymentPlan, error: planError } = await supabase
      .from('payment_plans')
      .select('*')
      .eq('student_id', studentId)
      .maybeSingle();

    // Get all payments
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (planError || paymentsError) {
      console.error('Error fetching payment summary:', planError || paymentsError);
      throw new Error('Failed to fetch payment summary');
    }

    const totalPaid = (payments || [])
      .filter(p => p.status === 'success')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    return {
      paymentPlan: paymentPlan || null,
      payments: payments || [],
      totalPaid,
      hasPaymentPlan: !!paymentPlan,
      canTakeSecondInstallment: paymentPlan?.plan_type === 'installment' && 
                               paymentPlan?.first_installment_paid && 
                               !paymentPlan?.second_installment_paid,
      isFullyPaid: paymentPlan?.status === 'completed' || 
                   (paymentPlan?.plan_type === 'full' && totalPaid >= paymentPlan.total_amount),
    };
  }
}

type InitiatePaymentPayload = {
  amount: number;
  email: string;
  description?: string;
};

export const paystackService = {
  async initiatePayment({ amount, email, description }: InitiatePaymentPayload) {
    if (!PAYSTACK_CONFIG.SECRET_KEY) {
      throw new Error('Missing PAYSTACK_SECRET_KEY environment variable');
    }

    const response = await fetch(`${PAYSTACK_CONFIG.API_BASE_URL}/transaction/initialize`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_CONFIG.SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: Math.round(amount * 100),
        metadata: {
          description: description || 'Program Fee Payment',
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to initialize Paystack payment');
    }

    const result = await response.json();

    if (!result?.status || !result?.data) {
      throw new Error('Invalid response from Paystack');
    }

    return {
      authorization_url: result.data.authorization_url as string,
      access_code: result.data.access_code as string,
      reference: result.data.reference as string,
    };
  },

  async verifyPayment(reference: string) {
    if (!PAYSTACK_CONFIG.SECRET_KEY) {
      throw new Error('Missing PAYSTACK_SECRET_KEY environment variable');
    }

    const response = await fetch(`${PAYSTACK_CONFIG.API_BASE_URL}/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${PAYSTACK_CONFIG.SECRET_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to verify Paystack payment');
    }

    const result = await response.json();

    if (!result?.status || !result?.data) {
      throw new Error('Invalid response from Paystack');
    }

    return {
      status: result.data.status as string,
      amount: result.data.amount as number,
      paid_at: result.data.paid_at as string,
      reference: result.data.reference as string,
      data: result.data,
    };
  },
};
