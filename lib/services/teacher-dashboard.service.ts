import { createClient as createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export class TeacherDashboardService {
  static async getCurrentTeacherProfile() {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const admin = createAdminClient()
    const { data: profile, error } = await admin
      .from('profiles')
      .select('id, email, first_name, last_name, phone, role, avatar_url')
      .eq('id', user.id)
      .single()

    if (error) throw new Error(error.message)
    return profile
  }

  static async getTeacherAssignments() {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('course_teacher_assignments')
      .select('id, course_id, teacher_id, session_id, is_active, assigned_at, course:courses(id, code, title, level, semester)')
      .eq('teacher_id', user.id)
      .order('assigned_at', { ascending: false })

    if (error) throw new Error(error.message)
    return (data || []).map((row: any) => ({
      ...row,
      title: row.course?.title || row.course?.code || 'Course assignment',
      description: row.course?.title ? `Assigned course: ${row.course.title}` : '',
      due_date: null,
      total_points: 100,
      allow_late_submission: false,
      late_penalty: 0,
      is_published: row.is_active,
      course_name: row.course?.title || row.course?.code || null,
    }))
  }

  static async getTeacherExams() {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const admin = createAdminClient()
    const { data: teacherCourses, error: teacherError } = await admin
      .from('course_teacher_assignments')
      .select('course_id')
      .eq('teacher_id', user.id)
      .eq('is_active', true)

    if (teacherError) throw new Error(teacherError.message)
    const courseIds = (teacherCourses || []).map((row) => row.course_id).filter(Boolean)
    if (!courseIds.length) return []

    const { data, error } = await admin
      .from('student_exam_sessions')
      .select('*, course:courses(code, title, level, program:programs(title)), session:academic_sessions(name), semester:academic_semesters(semester_name)')
      .in('course_id', courseIds)
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return (data || []).map((row: any) => ({
      ...row,
      exam_name: row.exam_title || row.exam_name || row.course?.title || 'Exam session',
      exam_description: row.exam_description || '',
      exam_date: row.start_date || null,
      is_active: row.is_published ?? false,
      course_name: row.course?.title || row.course?.code || null,
    }))
  }

  static async getTeacherNotices(limit = 3) {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('notices')
      .select('*')
      .eq('is_published', true)
      .in('audience', ['all', 'teachers'])
      .order('published_at', { ascending: false })
      .limit(limit)

    if (error) throw new Error(error.message)
    return data || []
  }

  static async getCurrentTeacherId() {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')
    return user.id
  }

  static async getCurrentTeacherTeacherProfile() {
    const teacherId = await this.getCurrentTeacherId()
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('teacher_profiles')
      .select('profile_id, employee_number, staff_number, qualification, specialization, department, employment_type, date_joined, office_location, office_hours, can_publish_results, can_enter_scores, employment_status, created_at, updated_at, departments, profile:profiles(id, email, first_name, last_name, middle_name, phone, role, avatar_url, profile_photo_bucket, profile_photo_path, profile_photo_mime_type, profile_photo_uploaded_at, media_provider)')
      .eq('profile_id', teacherId)
      .single()
    if (error) throw new Error(error.message)
    return data
  }

  static async getTeacherDepartmentNames() {
    const teacherId = await this.getCurrentTeacherId()
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('course_teacher_assignments')
      .select('course:courses(id, title, program:programs(id, department_id, department:departments(id, name)))')
      .eq('teacher_id', teacherId)
      .eq('is_active', true)
    if (error) throw new Error(error.message)

    const names = (data || [])
      .map((row: any) => String(row?.course?.program?.department?.name || row?.course?.program?.department_id || '').trim())
      .filter(Boolean)
    if (names.length) return names

    const teacher = await this.getCurrentTeacherTeacherProfile()
    let departments: any[] = []
    
    // Handle departments field - it might be a JSON array or JSON string
    if (teacher?.departments) {
      if (Array.isArray(teacher.departments)) {
        departments = teacher.departments
      } else if (typeof teacher.departments === 'string') {
        try {
          departments = JSON.parse(teacher.departments)
        } catch (e) {
          console.error('Failed to parse departments JSON:', e)
        }
      }
    }
    
    // Also check the single department field
    if (teacher?.department && !departments.includes(teacher.department)) {
      departments.push(teacher.department)
    }
    
    return departments
      .map((d: any) => String(d?.name || d?.label || d?.title || d?.department || d || '').trim())
      .filter(Boolean)
  }

  static async getTeacherStudents() {
    try {
      const teacherDepartments = await this.getTeacherDepartmentNames()
      console.log('[TeacherDashboardService] Teacher departments:', teacherDepartments)
      
      const admin = createAdminClient()
      const { data: students, error } = await admin
        .from('student_profiles')
        .select('profile_id, student_number, matric_number, admission_session, admission_date, date_of_birth, gender, blood_group, genotype, state_of_origin, local_government_area, nationality, address_line_1, address_line_2, city, state, guardian_name, guardian_phone, guardian_email, emergency_contact_name, emergency_contact_phone, current_level, admission_status, created_at, updated_at, profile:profiles(id, first_name, last_name, middle_name, email, phone, avatar_url)')
        .order('created_at', { ascending: false })
      if (error) throw new Error(error.message)

      const studentIds = (students || []).map((student: any) => student.profile_id)
      if (!studentIds.length) return []

      const { data: enrollments, error: enrollmentError } = await admin
        .from('enrollments')
        .select('student_id, program_id, program:programs(id, title, department_id, department:departments(id, name))')
        .in('student_id', studentIds)
      if (enrollmentError) throw new Error(enrollmentError.message)

      const enrollmentMap = new Map<string, any[]>()
      for (const enrollment of enrollments || []) {
        const list = enrollmentMap.get(enrollment.student_id) || []
        list.push(enrollment)
        enrollmentMap.set(enrollment.student_id, list)
      }

      const filteredStudents = (students || [])
        .map((student: any) => {
          const studentEnrollments = enrollmentMap.get(student.profile_id) || []
          const programDepartments = studentEnrollments
            .map((enrollment: any) => String(enrollment?.program?.department?.name || enrollment?.program?.department_id || '').trim())
            .filter(Boolean)
          return { ...student, enrollment: studentEnrollments, programDepartments }
        })
        .filter((student: any) => {
          // If teacher has no departments specified, show all students
          if (!teacherDepartments.length) {
            console.log('[TeacherDashboardService] No teacher departments, showing all students')
            return true
          }
          // If student has no enrollments or no department info, exclude them
          if (!student.programDepartments?.length) {
            console.log('[TeacherDashboardService] Student has no program departments:', student.profile_id)
            return false
          }
          // Check if student's department matches teacher's department
          const matches = student.programDepartments.some((dept: string) => teacherDepartments.includes(dept))
          console.log('[TeacherDashboardService] Student', student.profile_id, 'departments:', student.programDepartments, 'matches:', matches)
          return matches
        })
      
      console.log('[TeacherDashboardService] Filtered students count:', filteredStudents.length)
      return filteredStudents
    } catch (error: any) {
      console.error('[TeacherDashboardService] getTeacherStudents error:', error)
      throw error
    }
  }

  static async getTeacherStudentById(studentId: string) {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('student_profiles')
      .select('*, profile:profiles(id, first_name, last_name, email, phone, avatar_url), enrollment:enrollments(*, program:programs(title, department_id))')
      .eq('profile_id', studentId)
      .single()
    if (error) throw new Error(error.message)
    return data
  }

  static async getTeacherGrades() {
    const teacherId = await this.getCurrentTeacherId()
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('assessments')
      .select('id, enrollment_id, student_id, course_id, teacher_id, session_id, exam_score, grade, score_status, score_entered_at, approved_by, approved_at, created_at, updated_at, semester_id, ca_1, ca_2, assignments, continuous_assessment, total_score, student:profiles!assessments_student_id_fkey(id, first_name, last_name, middle_name, email, avatar_url), course:courses(id, code, title), enrollment:enrollments(id, program:programs(id, title))')
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return data || []
  }

  static async getTeacherStats() {
    const admin = createAdminClient()
    const [coursesRes, noticesRes, resultsRes] = await Promise.all([
      admin.from('courses').select('id', { count: 'exact', head: true }).eq('is_active', true),
      admin.from('notices').select('id', { count: 'exact', head: true }).eq('is_published', true).in('audience', ['all', 'teachers']),
      admin.from('results').select('id', { count: 'exact', head: true }),
    ])

    return {
      coursesCount: coursesRes.count || 0,
      noticesCount: noticesRes.count || 0,
      resultsCount: resultsRes.count || 0,
    }
  }

  static async getTeacherGradeById(id: string) {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('assessments')
      .select('*, student:profiles!assessments_student_id_fkey(id, first_name, last_name, email, avatar_url), course:courses(id, code, title), enrollment:enrollments(program:programs(title))')
      .eq('id', id)
      .single()
    if (error) throw new Error(error.message)
    return data
  }

  static async getTeacherTimetable() {
    const teacherId = await this.getCurrentTeacherId()
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('timetable_entries')
      .select('id, timetable_session_id, course_id, day_of_week, start_time, end_time, venue, lecturer_id, notes, course:courses(id, code, title)')
      .eq('lecturer_id', teacherId)
      .order('day_of_week', { ascending: true })
    
    if (error) throw new Error(error.message)
    return data || []
  }

  static async getTeacherSessions() {
    const teacherId = await this.getCurrentTeacherId()
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('student_exam_sessions')
      .select('id, course_id, session_id, semester_id, exam_title, exam_description, exam_type, duration_minutes, total_marks, passing_marks, start_date, end_date, instructions, is_published, published_at, published_by, allow_review, review_start_date, review_end_date, proctoring_enabled, google_meet_link, google_meet_code, created_at, updated_at, course:courses(id, code, title), session:academic_sessions(id, name), semester:academic_semesters(id, semester_name)')
      .eq('published_by', teacherId)
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return data || []
  }

  static async getTeacherSessionById(id: string) {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('student_exam_sessions')
      .select('id, course_id, session_id, semester_id, exam_title, exam_description, exam_type, duration_minutes, total_marks, passing_marks, start_date, end_date, instructions, is_published, published_at, published_by, allow_review, review_start_date, review_end_date, proctoring_enabled, google_meet_link, google_meet_code, created_at, updated_at, course:courses(id, code, title), session:academic_sessions(id, name), semester:academic_semesters(id, semester_name)')
      .eq('id', id)
      .single()
    if (error) throw new Error(error.message)
    return data
  }

  static async getTeacherCourses() {
    const teacherId = await this.getCurrentTeacherId()
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('course_teacher_assignments')
      .select('id, assigned_at, is_active, course_id, course:courses(id, code, title, level, semester)')
      .eq('teacher_id', teacherId)
      .order('assigned_at', { ascending: false })
    if (error) throw new Error(error.message)
    return (data || []).map((row: any) => row.course).filter(Boolean)
  }

  static async getTeacherCourseAssignments() {
    const teacherId = await this.getCurrentTeacherId()
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('course_teacher_assignments')
      .select('id, assigned_at, is_active, course:courses(id, code, title, level, semester)')
      .eq('teacher_id', teacherId)
      .order('assigned_at', { ascending: false })
    if (error) throw new Error(error.message)
    return data || []
  }

  static async getTeacherExamById(id: string) {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('student_exam_sessions')
      .select('*, course:courses(id, code, title, level, semester), session:academic_sessions(name), semester:academic_semesters(semester_name)')
      .eq('id', id)
      .single()
    if (error) throw new Error(error.message)
    return data
  }

  static async getTeacherExamQuestions(examId: string) {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('student_exam_questions')
      .select('*')
      .eq('exam_session_id', examId)
      .order('question_number', { ascending: true })
    if (error) throw new Error(error.message)
    return data || []
  }

  static async getTeacherAssignmentById(id: string) {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('course_teacher_assignments')
      .select('id, course_id, teacher_id, session_id, is_active, assigned_at, course:courses(id, code, title, level, semester)')
      .eq('id', id)
      .single()
    if (error) throw new Error(error.message)
    return data
  }
}
