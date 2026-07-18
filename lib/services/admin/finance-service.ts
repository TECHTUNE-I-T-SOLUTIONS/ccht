import { createClient } from '@/lib/supabase/server';

export class AdminFinanceService {
  // --- Fee Schedules ---
  static async getFeeSchedules() {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('fee_schedules')
      .select('*, program:programs(title), session:academic_sessions(name)')
      .order('created_at', { ascending: false });

    if (error) throw new Error('Failed to fetch fee schedules: ' + error.message);
    return data;
  }

  static async createFeeSchedule(payload: any) {
    const supabase = await createClient();
    
    // Auto-fetch current session if not provided
    let sessionId = payload.sessionId;
    if (!sessionId) {
      const { data: currentSession } = await supabase.from('academic_sessions').select('id').eq('is_current', true).single();
      sessionId = currentSession?.id;
    }

    const { data, error } = await supabase
      .from('fee_schedules')
      .insert({
        program_id: payload.programId,
        session_id: sessionId,
        fee_type: payload.feeType,
        amount: payload.amount,
        currency: payload.currency || 'NGN',
        due_date: payload.dueDate,
        is_mandatory: payload.isMandatory ?? true,
      })
      .select()
      .single();

    if (error) throw new Error('Failed to create fee schedule: ' + error.message);
    return data;
  }

  static async deleteFeeSchedule(id: string) {
    const supabase = await createClient();
    const { error } = await supabase
      .from('fee_schedules')
      .delete()
      .eq('id', id);

    if (error) throw new Error('Failed to delete fee schedule: ' + error.message);
    return true;
  }

  static async getPayments(statusFilter?: string) {
    const supabase = await createClient();
    
    const { data: pData } = await supabase.from('payments').select('*, profile:profiles(first_name, last_name, email, role), fee_schedule:fee_schedules(fee_type, amount)');
    const { data: appData } = await supabase.from('aspirant_application_payments').select('*, profile:profiles(first_name, last_name, email, role)');
    const { data: admData } = await supabase.from('aspirant_admission_payments').select('*, profile:profiles(first_name, last_name, email, role)');

    let combined: any[] = [];
    if (pData) {
      combined = [...combined, ...pData.map((p: any) => ({
        ...p,
        payment_source: 'student_fee'
      }))];
    }
    if (appData) {
      combined = [...combined, ...appData.map((p: any) => ({
        ...p,
        fee_schedule: { fee_type: 'Application Fee', amount: p.amount },
        payment_source: 'application_fee'
      }))];
    }
    if (admData) {
      combined = [...combined, ...admData.map((p: any) => ({
        ...p,
        fee_schedule: { fee_type: 'Admission Fee', amount: p.amount },
        payment_source: 'admission_fee'
      }))];
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
