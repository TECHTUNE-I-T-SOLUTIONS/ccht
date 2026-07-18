import { createClient } from '@/lib/supabase/server';

export class AdminFinanceService {
  // --- Fees ---
  static async getFees() {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('fees')
      .select('*, program:programs(title, slug)')
      .order('created_at', { ascending: false });

    if (error) throw new Error('Failed to fetch fees: ' + error.message);
    return data;
  }

  static async createFee(payload: any) {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('fees')
      .insert({
        program_id: payload.programId,
        fee_type: payload.feeType,
        amount: payload.amount,
        description: payload.description,
        due_in_days: payload.dueInDays,
        is_active: payload.isActive ?? true,
      })
      .select()
      .single();

    if (error) throw new Error('Failed to create fee: ' + error.message);
    return data;
  }

  static async deleteFee(id: string) {
    const supabase = await createClient();
    const { error } = await supabase
      .from('fees')
      .delete()
      .eq('id', id);

    if (error) throw new Error('Failed to delete fee: ' + error.message);
    return true;
  }

  static async updateFee(id: string, payload: any) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('fees')
      .update({
        fee_type: payload.feeType,
        amount: payload.amount,
        description: payload.description,
        due_in_days: payload.dueInDays,
        is_active: payload.isActive,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error('Failed to update fee: ' + error.message);
    return data;
  }

  static async getPayments(statusFilter?: string) {
    const supabase = await createClient();
    
    const { data: pData } = await supabase.from('payments').select('*, profile:profiles(first_name, last_name, email, role), invoice:invoices(invoice_number, amount_due, amount_paid)');
    const { data: appData } = await supabase.from('aspirant_application_payments').select('*, profile:profiles(first_name, last_name, email, role)');
    const { data: admData } = await supabase.from('aspirant_admission_payments').select('*, profile:profiles(first_name, last_name, email, role)');

    let combined: any[] = [];
    if (pData) {
      combined = [...combined, ...pData.map((p: any) => ({ ...p, payment_source: 'student_fee' }))];
    }
    if (appData) {
      combined = [...combined, ...appData.map((p: any) => ({ ...p, fee_schedule: { fee_type: 'Application Fee', amount: p.amount }, payment_source: 'application_fee' }))];
    }
    if (admData) {
      combined = [...combined, ...admData.map((p: any) => ({ ...p, fee_schedule: { fee_type: 'Admission Fee', amount: p.amount }, payment_source: 'admission_fee' }))];
    }

    if (statusFilter && statusFilter !== 'all') {
      combined = combined.filter((p: any) => p.status === statusFilter);
    }
    
    combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return combined;
  }

  static async updatePaymentStatus(id: string, status: string, source: string = 'student_fee') {
    const supabase = await createClient();
    
    let table = 'payments';
    if (source === 'application_fee') table = 'aspirant_application_payments';
    if (source === 'admission_fee') table = 'aspirant_admission_payments';

    const { data, error } = await supabase
      .from(table)
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error('Failed to update payment status: ' + error.message);
    return data;
  }
}
