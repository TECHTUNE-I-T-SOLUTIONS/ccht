import { createClient } from '@/lib/supabase/client'

export class EnrollmentService {
  static async getStudentEnrollments(studentId: string) {
    const supabase = createClient()
    
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          id,
          student_id,
          program_id,
          enrollment_date,
          expected_graduation_date,
          status,
          program:programs(id, title),
          academic_session:academic_sessions(id, name)
        `)
        .eq('student_id', studentId)
        .order('enrollment_date', { ascending: false })

      if (error) throw error

      return data?.map((enrollment: any) => ({
        id: enrollment.id,
        studentId: enrollment.student_id,
        programId: enrollment.program_id,
        enrollmentDate: enrollment.enrollment_date,
        expectedGraduationDate: enrollment.expected_graduation_date,
        status: enrollment.status,
        program: enrollment.program,
        academicSession: enrollment.academic_session
      })) || []
    } catch (error) {
      console.error('[EnrollmentService] Failed to get student enrollments:', error)
      return []
    }
  }
}