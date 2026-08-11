import { createClient } from '@/lib/supabase/client'

export class CourseService {
  static async getStudentSelectedCourses(studentId: string) {
    const supabase = createClient()
    
    try {
      const { data, error } = await supabase
        .from('student_selected_courses')
        .select(`
          id,
          student_id,
          course_id,
          session_id,
          selected_at,
          course:courses(id, code, title, credit_units),
          academic_session:academic_sessions(id, name)
        `)
        .eq('student_id', studentId)
        .order('selected_at', { ascending: false })

      if (error) throw error

      return data?.map((selection: any) => ({
        id: selection.id,
        studentId: selection.student_id,
        courseId: selection.course_id,
        sessionId: selection.session_id,
        selectedAt: selection.selected_at,
        course: selection.course,
        academicSession: selection.academic_session
      })) || []
    } catch (error) {
      console.error('[CourseService] Failed to get student selected courses:', error)
      return []
    }
  }
}