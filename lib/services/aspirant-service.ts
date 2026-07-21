import { createClient } from '@/lib/supabase/server';

export class AspirantService {
  static async getAspirantProfile(profileId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('aspirant_profiles')
      .select('*, profile:profiles(first_name, last_name, middle_name, email, phone, avatar_url), program:programs(title, slug)')
      .eq('profile_id', profileId)
      .single();

    if (error) throw new Error('Failed to fetch aspirant profile: ' + error.message);
    return data;
  }

  static async updateAspirantProfile(profileId: string, payload: any) {
    const supabase = await createClient();
    
    // Update aspirant_profiles table (phone is collected during registration, not in profile modal)
    const { data, error } = await supabase
      .from('aspirant_profiles')
      .update({
        gender: payload.gender,
        nationality: payload.nationality,
        date_of_birth: payload.dateOfBirth,
        state_of_origin: payload.stateOfOrigin,
        updated_at: new Date().toISOString(),
      })
      .eq('profile_id', profileId)
      .select()
      .single();

    if (error) throw new Error('Failed to update aspirant profile: ' + error.message);

    return data;
  }

  static async updateProfileCompletion(profileId: string, completionPercentage: number) {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('aspirant_profiles')
      .update({
        profile_completion: completionPercentage,
        updated_at: new Date().toISOString(),
      })
      .eq('profile_id', profileId)
      .select()
      .single();

    if (error) throw new Error('Failed to update profile completion: ' + error.message);
    return data;
  }

  static async checkProfileCompletion(profileId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('aspirant_profiles')
      .select('gender, nationality, date_of_birth, state_of_origin, profile_completion')
      .eq('profile_id', profileId)
      .single();

    if (error) throw new Error('Failed to check profile completion: ' + error.message);

    const requiredFields = [
      { key: 'gender', value: data.gender },
      { key: 'nationality', value: data.nationality },
      { key: 'date_of_birth', value: data.date_of_birth },
      { key: 'state_of_origin', value: data.state_of_origin },
    ];
    const missingFields = requiredFields.filter(field => !field.value).map(field => field.key);
    
    return {
      isComplete: missingFields.length === 0,
      missingFields,
      profileCompletion: data.profile_completion,
    };
  }

  static async checkOfferStatus(profileId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('aspirant_profiles')
      .select('application_status, current_stage, review_feedback, program:programs(title), preferred_program_id')
      .eq('profile_id', profileId)
      .single();

    if (error) throw new Error('Failed to check offer status: ' + error.message);

    // Show offer modal when status is 'accepted' (admin has accepted the application)
    return {
      hasOffer: data.application_status === 'accepted',
      offerDetails: data,
    };
  }

  static async respondToOffer(profileId: string, accept: boolean) {
    const supabase = await createClient();
    
    if (accept) {
      // When accepted, set status to pending_payment and stage to admission_fee
      const { data, error } = await supabase
        .from('aspirant_profiles')
        .update({
          application_status: 'pending_payment',
          current_stage: 'admission_fee',
          updated_at: new Date().toISOString(),
        })
        .eq('profile_id', profileId)
        .select('profile_id, preferred_program_id, application_status')
        .single();

      if (error) throw new Error('Failed to accept offer: ' + error.message);
      return data;
    } else {
      // When rejected, set status to rejected
      const { data, error } = await supabase
        .from('aspirant_profiles')
        .update({
          application_status: 'rejected',
          updated_at: new Date().toISOString(),
        })
        .eq('profile_id', profileId)
        .select('profile_id, application_status')
        .single();

      if (error) throw new Error('Failed to reject offer: ' + error.message);
      return data;
    }
  }

  static async processAdmissionFeePayment(profileId: string, adminId: string, adminNote: string) {
    const supabase = await createClient();
    
    // Generate admission number
    const admissionNumber = await this.generateAdmissionNumber();
    
    // Update profile with admission details and convert to student
    const { data, error } = await supabase
      .from('aspirant_profiles')
      .update({
        admission_number: admissionNumber,
        application_status: 'admitted',
        current_stage: 'migration',
        admission_fee_paid: true,
        admission_fee_paid_at: new Date().toISOString(),
        reviewed_by: adminId,
        review_feedback: adminNote,
        submitted_at: new Date().toISOString(),
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('profile_id', profileId)
      .select('profile_id, preferred_program_id, admission_number')
      .single();

    if (error) throw new Error('Failed to process admission fee payment: ' + error.message);

    // Trigger student conversion
    const { AdminAdmissionService } = await import('@/lib/services/admin/admission-service');
    await AdminAdmissionService.convertToStudent(profileId, data.preferred_program_id, admissionNumber);

    return data;
  }

  static async generateAdmissionNumber(): Promise<string> {
    const supabase = await createClient();
    const year = new Date().getFullYear();
    const prefix = `CCHT/${year}`;
    
    // Get the last admission number for this year
    const { data, error } = await supabase
      .from('aspirant_profiles')
      .select('admission_number')
      .ilike('admission_number', `${prefix}%`)
      .order('admission_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    let sequence = 1;
    if (data?.admission_number) {
      const lastSequence = parseInt(data.admission_number.split('/').pop() || '0');
      sequence = lastSequence + 1;
    }

    // Format sequence as 4-digit number (e.g., 0001)
    const sequenceStr = sequence.toString().padStart(4, '0');
    return `${prefix}/${sequenceStr}`;
  }
}
