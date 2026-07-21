import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { buildCloudinaryPublicUrl, getCloudinaryConfig } from '@/lib/cloudinary';

function getFormatFromMimeType(mimeType?: string | null): string | null {
  if (!mimeType) return null
  const map: Record<string, string> = {
    'application/pdf': 'pdf',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
  }
  return map[mimeType] || null
}

function getFormatFromFileName(fileName?: string | null): string | null {
  if (!fileName) return null
  const match = fileName.match(/\.([^.]+)$/)
  if (!match) return null
  return match[1].toLowerCase()
}

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
      phone: ap.phone,
      gender: ap.gender,
      nationality: ap.nationality,
      date_of_birth: ap.date_of_birth,
      state_of_origin: ap.state_of_origin,
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
      .select('*, profile:profiles(first_name, last_name, email, phone, avatar_url), program:programs(title, level, department:departments(name))')
      .eq('profile_id', id)
      .single();

    if (error) throw new Error('Failed to fetch application details: ' + error.message);
    
    // Fetch documents separately
    const { data: docs, error: docsError } = await supabase
      .from('admission_documents')
      .select('*')
      .eq('application_id', id)
      .order('uploaded_at', { ascending: false });

    if (docsError) console.error('Failed to fetch documents:', docsError);
    
    const cloudName = getCloudinaryConfig().cloudName;
    const documentsWithUrls = (docs || []).map((doc: any) => ({
      ...doc,
      file_url: (() => {
        const format = getFormatFromMimeType(doc.mime_type) || getFormatFromFileName(doc.file_name);
        return buildCloudinaryPublicUrl(cloudName, doc.storage_path, format);
      })()
    }));

    return {
      id: ap.profile_id,
      profile_id: ap.profile_id,
      status: ap.application_status,
      payment_status: ap.application_fee_paid ? 'paid' : 'pending',
      screening_score: ap.exam_score,
      admin_note: ap.review_feedback,
      created_at: ap.created_at,
      program: ap.program,
      phone: ap.phone,
      gender: ap.gender,
      nationality: ap.nationality,
      date_of_birth: ap.date_of_birth,
      state_of_origin: ap.state_of_origin,
      admission_documents: documentsWithUrls,
      profile: {
        ...ap.profile,
        admission_documents: documentsWithUrls,
        aspirant_profiles: [ap]
      }
    };
  }

  static async updateApplicationStatus(id: string, status: string, adminNote?: string) {
    const supabase = await createClient();
    
    // Get current stage to preserve it if not changing
    const { data: currentProfile } = await supabase
      .from('aspirant_profiles')
      .select('current_stage, profile_completion')
      .eq('profile_id', id)
      .single();
    
    const existingStage = currentProfile?.current_stage || 'signup';
    
    // Determine the appropriate stage based on status
    let currentStage = existingStage; // Default to existing stage
    if (status === 'accepted') {
      currentStage = 'admission_fee'; // Show payment step after acceptance
    } else if (status === 'student') {
      currentStage = 'completed'; // Final stage when fully migrated
    }
    
    // Update profile completion to 100% when admitted
    const profileCompletion = (status === 'accepted' || status === 'admitted') ? 100 : currentProfile?.profile_completion || 0;
    
    const { data, error } = await supabase
      .from('aspirant_profiles')
      .update({
        application_status: status,
        current_stage: currentStage,
        review_feedback: adminNote || null,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        profile_completion: profileCompletion
      })
      .eq('profile_id', id)
      .select('profile_id, preferred_program_id, application_status')
      .single();

    if (error) throw new Error('Failed to update application status: ' + error.message);
    
    // Auto-convert to student if status is 'student'
    if (status === 'student') {
      await AdminAdmissionService.convertToStudent(data.profile_id, data.preferred_program_id);
    }

    return { ...data, status: data.application_status, program_id: data.preferred_program_id };
  }

  static async processAspirantAcceptance(profileId: string) {
    const supabase = await createClient();
    
    // Get the aspirant's preferred program
    const { data: aspirant, error: fetchError } = await supabase
      .from('aspirant_profiles')
      .select('preferred_program_id')
      .eq('profile_id', profileId)
      .single();

    if (fetchError) throw new Error('Failed to fetch aspirant details: ' + fetchError.message);
    
    // Convert to student
    await AdminAdmissionService.convertToStudent(profileId, aspirant.preferred_program_id);
    
    return { success: true };
  }

  static async updateDocumentVerificationStatus(docId: string, status: string, note?: string) {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('admission_documents')
      .update({
        verification_status: status,
        verification_note: note || null,
        verified_at: status === 'verified' ? new Date().toISOString() : null,
      })
      .eq('id', docId)
      .select()
      .single();

    if (error) throw new Error('Failed to update document verification status: ' + error.message);
    
    return data;
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

  public static async convertToStudent(profileId: string, programId: string, admissionNumber?: string) {
    const adminAuth = createAdminClient();
    const supabase = await createClient();
    
    // Change role in profiles
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ role: 'student' })
      .eq('id', profileId);
      
    if (profileError) console.error("Failed to update profile role to student", profileError);

    // Use provided admission number as matric number, or generate one
    const matricNumber = admissionNumber || `CCHT/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`;
    
    // Check if student profile already exists
    const { data: existingStudent } = await supabase.from('student_profiles').select('id').eq('profile_id', profileId).single();
    
    if (!existingStudent) {
      const { error: studentError } = await supabase
        .from('student_profiles')
        .insert({
          profile_id: profileId,
          matric_number: matricNumber,
          current_level: '100',
          admission_status: 'active', // Must match the check constraint
        });
      
      if (studentError) console.error("Failed to create student profile", studentError);
    }

    // Enroll in program
    const { data: currentSession } = await supabase.from('academic_sessions').select('id').eq('is_current', true).single();
    if (currentSession) {
      const { error: enrollError } = await supabase
        .from('enrollments')
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

  static async migrateToStudent(profileId: string, adminId: string) {
    const adminSupabase = createAdminClient();
    const supabase = await createClient();
    
    // Get aspirant details with profile information
    const { data: aspirant, error: fetchError } = await adminSupabase
      .from('aspirant_profiles')
      .select('preferred_program_id, admission_number, phone, gender, nationality, date_of_birth, state_of_origin, admission_session, profile:profiles(first_name, last_name, email, phone)')
      .eq('profile_id', profileId)
      .single();

    if (fetchError) throw new Error('Failed to fetch aspirant details: ' + fetchError.message);
    
    if (!aspirant.admission_number) {
      throw new Error('Aspirant does not have an admission number. Payment must be completed first.');
    }

    // Get admin profile details
    const { data: adminProfile } = await adminSupabase
      .from('admin_profiles')
      .select('profile_id')
      .eq('profile_id', adminId)
      .single();

    // Update aspirant profile status to migrated with all required fields
    const { error: updateError } = await adminSupabase
      .from('aspirant_profiles')
      .update({
        application_status: 'migrated',
        current_stage: 'completed',
        migration_completed: true,
        migration_completed_at: new Date().toISOString(),
        matric_number: aspirant.admission_number,
        profile_completion: 100,
        submission_notes: `Applicant successfully migrated to student. Matric number: ${aspirant.admission_number}. Migration completed on ${new Date().toLocaleDateString()}.`,
        reviewed_by: adminProfile?.profile_id || adminId,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('profile_id', profileId);

    if (updateError) throw new Error('Failed to update aspirant status: ' + updateError.message);

    // Convert to student with full details
    await AdminAdmissionService.convertToStudent(profileId, aspirant.preferred_program_id, aspirant.admission_number);

    // Update student_profiles with additional details
    const phoneNumber = aspirant.phone || (aspirant.profile as any)?.phone || null;
    const { error: studentUpdateError } = await adminSupabase
      .from('student_profiles')
      .update({
        matric_number: aspirant.admission_number,
        student_number: phoneNumber,
        admission_session: aspirant.admission_session,
        admission_date: new Date().toISOString().split('T')[0],
        date_of_birth: aspirant.date_of_birth,
        gender: aspirant.gender,
        nationality: aspirant.nationality,
        state_of_origin: aspirant.state_of_origin,
        current_level: '100',
        admission_status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('profile_id', profileId);

    if (studentUpdateError) console.error("Failed to update student profile details:", studentUpdateError);

    // Create notification for aspirant
    await adminSupabase
      .from('aspirant_notifications')
      .insert({
        aspirant_id: profileId,
        title: 'Migration Completed',
        message: `Congratulations! You have been successfully migrated to the student portal. Your matric number is ${aspirant.admission_number}. You can now access the student portal.`,
        type: 'success',
        read: false,
      });

    return { success: true, matricNumber: aspirant.admission_number };
  }

  static async bulkMigrateToStudents(profileIds: string[], adminId: string) {
    const results = [];
    
    for (const profileId of profileIds) {
      try {
        const result = await AdminAdmissionService.migrateToStudent(profileId, adminId);
        results.push({ profileId, ...result });
      } catch (error: any) {
        results.push({ profileId, success: false, error: error.message });
      }
    }

    return results;
  }
}
