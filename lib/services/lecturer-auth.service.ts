import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export interface LecturerSignupInput {
  email: string
  password: string
  firstName: string
  lastName: string
  middleName?: string | null
  phone?: string | null
  employeeNumber: string
  staffNumber?: string
  qualification: string
  specialization: string
  department?: string
  departments?: string[]
  employmentType?: 'full_time' | 'part_time' | 'adjunct' | 'contract'
  dateJoined?: string
  officeLocation?: string | null
  officeHours?: string | null
}

export class LecturerAuthService {
  static async register(input: LecturerSignupInput, origin?: string) {
    console.log('[LecturerAuthService] Starting lecturer registration')

    const admin = createAdminClient()
    const supabase = await createServerSupabaseClient()

    console.log('[LecturerAuthService] Creating auth user with supabase signUp:', {
      email: input.email,
      passwordLength: input.password.length,
    })
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        emailRedirectTo: `${origin ?? process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? 'http://localhost:3000'}/auth/callback`,
        data: {
          role: 'lecturer',
          first_name: input.firstName,
          last_name: input.lastName,
          middle_name: input.middleName || '',
          phone: input.phone || '',
        },
      },
    })

    if (authError) {
      console.error('[LecturerAuthService] Auth signup error:', authError)
      throw new Error(authError.message)
    }

    if (!authData.user) {
      throw new Error('Failed to create auth user')
    }

    const userId = authData.user.id
    console.log('[LecturerAuthService] Auth user created:', userId)

    // Step 2: Write the shared profile explicitly so the result does not depend on auth triggers.
    const { error: profileError } = await admin
      .from('profiles')
      .upsert({
        id: userId,
        email: input.email,
        first_name: input.firstName,
        last_name: input.lastName,
        middle_name: input.middleName || null,
        phone: input.phone || null,
        role: 'lecturer',
        is_active: true,
      })

    if (profileError) {
      console.error('[LecturerAuthService] Profile upsert error:', profileError)
      await admin.auth.admin.deleteUser(userId)
      throw new Error(`Failed to create profile: ${profileError.message}`)
    }

    // Remove any student profile that may have been created by a legacy auth trigger.
    const { error: cleanupError } = await admin
      .from('student_profiles')
      .delete()
      .eq('profile_id', userId)

    if (cleanupError) {
      console.warn('[LecturerAuthService] Student profile cleanup warning:', cleanupError)
    }

    const { error: teacherError } = await admin
      .from('teacher_profiles')
      .upsert({
        profile_id: userId,
        employee_number: input.employeeNumber,
        staff_number: input.staffNumber || input.employeeNumber,
        qualification: input.qualification || null,
        specialization: input.specialization || null,
        department: input.department || null,
        departments: input.departments || (input.department ? [input.department] : []),
        employment_type: input.employmentType || 'full_time',
        date_joined: input.dateJoined || null,
        office_location: input.officeLocation || null,
        office_hours: input.officeHours || null,
        can_publish_results: false,
        can_enter_scores: true,
        employment_status: 'active',
      })

    if (teacherError) {
      console.error('[LecturerAuthService] Teacher profile error:', teacherError)
      // Cleanup auth user
      await admin.auth.admin.deleteUser(userId)
      throw new Error(`Failed to create teacher profile: ${teacherError.message}`)
    }

    console.log('[LecturerAuthService] Lecturer registration completed successfully')

    return {
      user: authData.user,
      message: 'Lecturer account created successfully. You can now login.',
    }
  }
}
