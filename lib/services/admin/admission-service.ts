import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export class AdminAdmissionService {
  static async getApplications(status?: string, programId?: string) {
    const supabase = await createClient();
    
    let query = supabase
      .from('aspirant_profiles')
      .select('*, profile:profiles(first_name, last_name, email, avatar_url, admission_documents(*)), program:programs(title)')
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('application_status', status);
    }
    
    if (programId && programId !== 'all') {
      query = query.eq('preferred_program_id', programId);
    }

    const { data, error } = await query;
    if (error) throw new Error('Failed to fetch applications: ' + error.message);
    
    return data.map((ap: any) => ({
      id: ap.profile_id,
      profile_id: ap.profile_id,
      status: ap.application_status,
      payment_status: ap.application_fee_paid ? 'paid' : 'pending',
      screening_score: ap.exam_score,
      created_at: ap.created_at,
      program: ap.program,
      profile: {
        ...ap.profile,
        aspirant_profiles: [ap]
      }
    }));
  }

  static async getApplicationDetails(id: string) {
    const supabase = await createClient();
    const { data: ap, error } = await supabase
      .from('aspirant_profiles')
      .select('*, profile:profiles(first_name, last_name, email, phone, avatar_url, admission_documents(*)), program:programs(title, level, department:departments(name))')
      .eq('profile_id', id)
      .single();

    if (error) throw new Error('Failed to fetch application details: ' + error.message);
    
    return {
      id: ap.profile_id,
      profile_id: ap.profile_id,
      status: ap.application_status,
      payment_status: ap.application_fee_paid ? 'paid' : 'pending',
      screening_score: ap.exam_score,
      admin_note: ap.review_feedback,
      created_at: ap.created_at,
      program: ap.program,
      profile: {
        ...ap.profile,
        aspirant_profiles: [ap]
      }
    };
  }

  static async updateApplicationStatus(id: string, status: string, adminNote?: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('aspirant_profiles')
      .update({
        application_status: status,
        ...(adminNote ? { review_feedback: adminNote } : {})
      })
      .eq('profile_id', id)
      .select('profile_id, preferred_program_id, application_status')
      .single();

    if (error) throw new Error('Failed to update application status: ' + error.message);
    
    if (status === 'admitted') {
      await AdminAdmissionService.convertToStudent(data.profile_id, data.preferred_program_id);
    }

    return { ...data, status: data.application_status, program_id: data.preferred_program_id };
  }

  static async updateScreeningScore(id: string, score: number) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('aspirant_profiles')
      .update({ exam_score: score })
      .eq('profile_id', id)
      .select()
      .single();

    if (error) throw new Error('Failed to update screening score: ' + error.message);
    return data;
  }

  private static async convertToStudent(profileId: string, programId: string) {
    const adminAuth = createAdminClient();
    const supabase = await createClient();
    
    // Change role in profiles
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ role: 'student' })
      .eq('id', profileId);
      
    if (profileError) console.error("Failed to update profile role to student", profileError);

    // Create student profile
    const matricNumber = `CCHT/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`;
    
    // Check if student profile already exists
    const { data: existingStudent } = await supabase.from('student_profiles').select('id').eq('profile_id', profileId).single();
    
    if (!existingStudent) {
      const { error: studentError } = await supabase
        .from('student_profiles')
        .insert({
          profile_id: profileId,
          matric_number: matricNumber,
          current_level: '100',
          admission_status: 'admitted',
        });
      
      if (studentError) console.error("Failed to create student profile", studentError);
    }

    // Enroll in program
    const { data: currentSession } = await supabase.from('academic_sessions').select('id').eq('is_current', true).single();
    if (currentSession) {
      const { error: enrollError } = await supabase
        .from('program_enrollments')
        .insert({
          student_id: profileId,
          program_id: programId,
          session_id: currentSession.id,
          status: 'active'
        });
        
      if (enrollError) console.error("Failed to enroll student", enrollError);
    }

    // Update Auth Metadata (Admin Client)
    await adminAuth.auth.admin.updateUserById(profileId, {
      user_metadata: { role: 'student' }
    });
  }
}
