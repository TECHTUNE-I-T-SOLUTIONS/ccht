import { createAdminClient } from '@/lib/supabase/admin'

export class DashboardService {
  static async getDashboardStats() {
    const admin = createAdminClient()
    
    try {
      const [
        totalUsersResult,
        totalAspirantsResult,
        totalStudentsResult,
        totalLecturersResult,
        totalAdminsResult,
        totalProgramsResult,
        paymentsResult,
        admissionPaymentsResult,
        applicationPaymentsResult,
        totalApplicationsResult
      ] = await Promise.all([
        admin.from('profiles').select('id'),
        admin.from('profiles').select('id').eq('role', 'aspirant'),
        admin.from('profiles').select('id').eq('role', 'student'),
        admin.from('profiles').select('id').eq('role', 'lecturer'),
        admin.from('profiles').select('id').eq('role', 'admin'),
        admin.from('programs').select('id'),
        admin.from('payments').select('id'),
        admin.from('aspirant_admission_payments').select('id'),
        admin.from('aspirant_application_payments').select('id'),
        admin.from('aspirant_profiles').select('id'),
      ])

      const totalUsers = totalUsersResult.data?.length || 0
      const totalAspirants = totalAspirantsResult.data?.length || 0
      const totalStudents = totalStudentsResult.data?.length || 0
      const totalLecturers = totalLecturersResult.data?.length || 0
      const totalAdmins = totalAdminsResult.data?.length || 0
      const totalPrograms = totalProgramsResult.data?.length || 0
      const payments = paymentsResult.data?.length || 0
      const admissionPayments = admissionPaymentsResult.data?.length || 0
      const applicationPayments = applicationPaymentsResult.data?.length || 0
      const totalApplications = totalApplicationsResult.data?.length || 0
      const totalPayments = payments + admissionPayments + applicationPayments

      console.log('[DashboardService] Stats fetched successfully:', {
        totalUsers,
        totalAspirants,
        totalStudents,
        totalLecturers,
        totalAdmins,
        totalPrograms,
        totalPayments,
        totalApplications,
      })

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
      console.error('[DashboardService] Failed to get dashboard stats:', error)
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