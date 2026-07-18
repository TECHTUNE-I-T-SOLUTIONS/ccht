import { createClient } from '@/lib/supabase/server'

export class ManagementService {
  // Aspirant Management
  static async getAspirantStats() {
    const supabase = await createClient()
    
    try {
      const [totalResult, pendingResult, approvedResult, rejectedResult, inReviewResult] = await Promise.all([
        supabase.from('profiles').select('id').eq('role', 'aspirant'),
        supabase.from('aspirant_profiles').select('id').eq('application_status', 'pending'),
        supabase.from('aspirant_profiles').select('id').eq('application_status', 'approved'),
        supabase.from('aspirant_profiles').select('id').eq('application_status', 'rejected'),
        supabase.from('aspirant_profiles').select('id').eq('application_status', 'in_review'),
      ])

      const total = totalResult.data?.length || 0
      const pending = pendingResult.data?.length || 0
      const approved = approvedResult.data?.length || 0
      const rejected = rejectedResult.data?.length || 0
      const inReview = inReviewResult.data?.length || 0

      return { total, pending, approved, rejected, inReview }
    } catch (error) {
      console.error('[ManagementService] Failed to get aspirant stats:', error)
      return { total: 0, pending: 0, approved: 0, rejected: 0, inReview: 0 }
    }
  }

  static async getRecentAspirants(limit = 10) {
    const supabase = await createClient()
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          email,
          aspirant_profiles(
            jamb_reg_no,
            application_status,
            current_stage,
            profile_completion
          )
        `)
        .eq('role', 'aspirant')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      return data?.map((profile: any) => ({
        id: profile.id,
        firstName: profile.first_name,
        lastName: profile.last_name,
        email: profile.email,
        jambRegNo: profile.aspirant_profiles?.[0]?.jamb_reg_no || '',
        applicationStatus: profile.aspirant_profiles?.[0]?.application_status || 'pending',
        currentStage: profile.aspirant_profiles?.[0]?.current_stage || 'signup',
        profileCompletion: profile.aspirant_profiles?.[0]?.profile_completion || 0,
        submittedAt: profile.created_at,
      })) || []
    } catch (error) {
      console.error('[ManagementService] Failed to get recent aspirants:', error)
      return []
    }
  }

  // Student Management
  static async getStudentStats() {
    const supabase = await createClient()
    
    try {
      const [totalResult, activeResult, inactiveResult, suspendedResult, graduatedResult] = await Promise.all([
        supabase.from('profiles').select('id').eq('role', 'student'),
        supabase.from('student_profiles').select('id').eq('admission_status', 'active'),
        supabase.from('student_profiles').select('id').eq('admission_status', 'suspended'),
        supabase.from('student_profiles').select('id').eq('admission_status', 'graduated'),
        supabase.from('student_profiles').select('id').eq('admission_status', 'withdrawn'),
      ])

      const total = totalResult.data?.length || 0
      const active = activeResult.data?.length || 0
      const inactive = inactiveResult.data?.length || 0
      const suspended = suspendedResult.data?.length || 0
      const graduated = graduatedResult.data?.length || 0

      return { total, active, inactive, suspended, graduated }
    } catch (error) {
      console.error('[ManagementService] Failed to get student stats:', error)
      return { total: 0, active: 0, inactive: 0, suspended: 0, graduated: 0 }
    }
  }

  static async getRecentStudents(limit = 10) {
    const supabase = await createClient()
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          email,
          student_profiles(
            student_number,
            matric_number,
            current_level,
            admission_status
          )
        `)
        .eq('role', 'student')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      return data?.map((profile: any) => ({
        id: profile.id,
        firstName: profile.first_name,
        lastName: profile.last_name,
        email: profile.email,
        studentNumber: profile.student_profiles?.[0]?.student_number || '',
        matricNumber: profile.student_profiles?.[0]?.matric_number || '',
        currentLevel: profile.student_profiles?.[0]?.current_level || '',
        admissionStatus: profile.student_profiles?.[0]?.admission_status || 'active',
        enrolledAt: profile.created_at,
      })) || []
    } catch (error) {
      console.error('[ManagementService] Failed to get recent students:', error)
      return []
    }
  }

  // Lecturer Management
  static async getLecturerStats() {
    const supabase = await createClient()
    
    try {
      const [totalResult, activeResult, inactiveResult, suspendedResult, partTimeResult] = await Promise.all([
        supabase.from('profiles').select('id').eq('role', 'lecturer'),
        supabase.from('teacher_profiles').select('id').eq('employment_status', 'active'),
        supabase.from('teacher_profiles').select('id').eq('employment_status', 'inactive'),
        supabase.from('teacher_profiles').select('id').eq('employment_status', 'suspended'),
        supabase.from('teacher_profiles').select('id').eq('employment_type', 'part_time'),
      ])

      const total = totalResult.data?.length || 0
      const active = activeResult.data?.length || 0
      const inactive = inactiveResult.data?.length || 0
      const suspended = suspendedResult.data?.length || 0
      const partTime = partTimeResult.data?.length || 0

      return { total, active, inactive, suspended, partTime }
    } catch (error) {
      console.error('[ManagementService] Failed to get lecturer stats:', error)
      return { total: 0, active: 0, inactive: 0, suspended: 0, partTime: 0 }
    }
  }

  static async getRecentLecturers(limit = 10) {
    const supabase = await createClient()
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          email,
          teacher_profiles(
            employee_number,
            department,
            specialization,
            employment_type,
            employment_status
          )
        `)
        .eq('role', 'lecturer')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      return data?.map((profile: any) => ({
        id: profile.id,
        firstName: profile.first_name,
        lastName: profile.last_name,
        email: profile.email,
        employeeNumber: profile.teacher_profiles?.[0]?.employee_number || '',
        department: profile.teacher_profiles?.[0]?.department || '',
        specialization: profile.teacher_profiles?.[0]?.specialization || '',
        employmentType: profile.teacher_profiles?.[0]?.employment_type || '',
        employmentStatus: profile.teacher_profiles?.[0]?.employment_status || 'active',
        joinedAt: profile.created_at,
      })) || []
    } catch (error) {
      console.error('[ManagementService] Failed to get recent lecturers:', error)
      return []
    }
  }

  // Admin Management
  static async getAdminStats() {
    const supabase = await createClient()
    
    try {
      const [totalResult, superAdminResult, operationsResult, academicsResult, financeResult] = await Promise.all([
        supabase.from('profiles').select('id').eq('role', 'admin'),
        supabase.from('admin_profiles').select('id').eq('admin_scope', 'super'),
        supabase.from('admin_profiles').select('id').eq('admin_scope', 'operations'),
        supabase.from('admin_profiles').select('id').eq('admin_scope', 'academics'),
        supabase.from('admin_profiles').select('id').eq('admin_scope', 'finance'),
      ])

      const total = totalResult.data?.length || 0
      const superAdmins = superAdminResult.data?.length || 0
      const operations = operationsResult.data?.length || 0
      const academics = academicsResult.data?.length || 0
      const finance = financeResult.data?.length || 0

      return { total, superAdmins, operations, academics, finance }
    } catch (error) {
      console.error('[ManagementService] Failed to get admin stats:', error)
      return { total: 0, superAdmins: 0, operations: 0, academics: 0, finance: 0 }
    }
  }

  static async getRecentAdmins(limit = 10) {
    const supabase = await createClient()
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          email,
          admin_profiles(
            staff_id,
            department,
            designation,
            admin_scope,
            can_manage_users,
            can_manage_content,
            can_manage_academics,
            can_manage_finance
          )
        `)
        .eq('role', 'admin')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      return data?.map((profile: any) => ({
        id: profile.id,
        firstName: profile.first_name,
        lastName: profile.last_name,
        email: profile.email,
        staffId: profile.admin_profiles?.[0]?.staff_id || '',
        department: profile.admin_profiles?.[0]?.department || '',
        designation: profile.admin_profiles?.[0]?.designation || '',
        adminScope: profile.admin_profiles?.[0]?.admin_scope || 'operations',
        canManageUsers: profile.admin_profiles?.[0]?.can_manage_users || false,
        canManageContent: profile.admin_profiles?.[0]?.can_manage_content || false,
        canManageAcademics: profile.admin_profiles?.[0]?.can_manage_academics || false,
        canManageFinance: profile.admin_profiles?.[0]?.can_manage_finance || false,
        createdAt: profile.created_at,
      })) || []
    } catch (error) {
      console.error('[ManagementService] Failed to get recent admins:', error)
      return []
    }
  }

  // Dashboard Stats
  static async getDashboardStats() {
    const supabase = await createClient()
    
    try {
      const [
        totalUsersResult,
        totalAspirantsResult,
        totalStudentsResult,
        totalLecturersResult,
        totalAdminsResult,
        totalProgramsResult,
        totalPaymentsResult,
        totalApplicationsResult
      ] = await Promise.all([
        supabase.from('profiles').select('id'),
        supabase.from('profiles').select('id').eq('role', 'aspirant'),
        supabase.from('profiles').select('id').eq('role', 'student'),
        supabase.from('profiles').select('id').eq('role', 'lecturer'),
        supabase.from('profiles').select('id').eq('role', 'admin'),
        supabase.from('programs').select('id'),
        supabase.from('payments').select('id'),
        supabase.from('aspirant_profiles').select('id'),
      ])

      const totalUsers = totalUsersResult.data?.length || 0
      const totalAspirants = totalAspirantsResult.data?.length || 0
      const totalStudents = totalStudentsResult.data?.length || 0
      const totalLecturers = totalLecturersResult.data?.length || 0
      const totalAdmins = totalAdminsResult.data?.length || 0
      const totalPrograms = totalProgramsResult.data?.length || 0
      const totalPayments = totalPaymentsResult.data?.length || 0
      const totalApplications = totalApplicationsResult.data?.length || 0

      return {
        totalUsers,
        totalAspirants,
        totalStudents,
        totalLecturers,
        totalAdmins,
        totalPrograms,
        totalPayments,
        totalApplications,
      }
    } catch (error) {
      console.error('[ManagementService] Failed to get dashboard stats:', error)
      return {
        totalUsers: 0,
        totalAspirants: 0,
        totalStudents: 0,
        totalLecturers: 0,
        totalAdmins: 0,
        totalPrograms: 0,
        totalPayments: 0,
        totalApplications: 0,
      }
    }
  }
}
