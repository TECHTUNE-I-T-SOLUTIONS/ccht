import { createClient } from '@/lib/supabase/server';

export class AdminAssessmentService {
  static async getAllCourses() {
    const supabase = await createClient();
    const { data, error } = await supabase.from('courses').select('id, title, code').order('title');
    if (error) throw new Error('Failed to fetch courses: ' + error.message);
    return data;
  }

  static async getAssessments(typeFilter?: string) {
    const supabase = await createClient();
    
    let query = supabase
      .from('assessments')
      .select('*, course:courses(title, code), session:academic_sessions(name)')
      .order('created_at', { ascending: false });

    if (typeFilter && typeFilter !== 'all') {
      query = query.eq('type', typeFilter);
    }

    const { data, error } = await query;
    if (error) throw new Error('Failed to fetch assessments: ' + error.message);
    
    return data;
  }

  static async getAssessmentDetails(id: string) {
    const supabase = await createClient();
    
    // Fetch Assessment + Submissions + Proctoring Logs
    const { data, error } = await supabase
      .from('assessments')
      .select(`
        *,
        course:courses(title, code),
        session:academic_sessions(name),
        submissions:assessment_submissions(
          id, score, status, created_at,
          student:profiles!assessment_submissions_student_id_fkey(first_name, last_name, avatar_url, student_profiles(matric_number))
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw new Error('Failed to fetch assessment details: ' + error.message);
    return data;
  }

  static async createAssessment(payload: any) {
    const supabase = await createClient();
    
    // We need current session
    const { data: currentSession } = await supabase.from('academic_sessions').select('id').eq('is_current', true).single();
    
    const { data, error } = await supabase
      .from('assessments')
      .insert({
        course_id: payload.courseId,
        session_id: currentSession?.id,
        title: payload.title,
        type: payload.type,
        total_marks: payload.totalMarks,
        passing_marks: payload.passingMarks,
        is_published: payload.isPublished ?? false,
        proctoring_enabled: payload.proctoringEnabled ?? false,
        proctoring_strictness: payload.proctoringStrictness ?? 'medium',
      })
      .select()
      .single();

    if (error) throw new Error('Failed to create assessment: ' + error.message);
    return data;
  }

  static async updateAssessment(id: string, payload: any) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('assessments')
      .update({
        title: payload.title,
        type: payload.type,
        total_marks: payload.totalMarks,
        passing_marks: payload.passingMarks,
        is_published: payload.isPublished,
        proctoring_enabled: payload.proctoringEnabled,
        proctoring_strictness: payload.proctoringStrictness,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error('Failed to update assessment: ' + error.message);
    return data;
  }

  static async deleteAssessment(id: string) {
    const supabase = await createClient();
    const { error } = await supabase
      .from('assessments')
      .delete()
      .eq('id', id);

    if (error) throw new Error('Failed to delete assessment: ' + error.message);
    return true;
  }
}
