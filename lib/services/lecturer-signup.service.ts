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

export class LecturerSignupService {
  static async register(input: LecturerSignupInput, origin: string) {
    console.log('[LecturerSignupService] Register called with:', {
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      employeeNumber: input.employeeNumber,
    })

    const admin = createAdminClient()
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing Supabase admin credentials')
    }

    console.log('[LecturerSignupService] Creating auth user via Supabase Admin API...')
    const createUserResponse = await fetch(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        apikey: serviceRoleKey,
        authorization: `Bearer ${serviceRoleKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        email: input.email,
        password: input.password,
        email_confirm: true,
        user_metadata: {
          first_name: input.firstName,
          last_name: input.lastName,
          middle_name: input.middleName || '',
          phone: input.phone || '',
        },
      }),
    })

    const authPayload = await createUserResponse.json().catch(() => null)
    if (!createUserResponse.ok || !authPayload?.id) {
      console.error('[LecturerSignupService] Auth user creation error payload:', authPayload)
      throw new Error(authPayload?.msg || authPayload?.message || 'Failed to create auth user')
    }

    const userId = authPayload.id as string
    console.log('[LecturerSignupService] Auth user created successfully, creating teacher profile...')

    const { error: profileUpsertError } = await admin
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

    if (profileUpsertError) {
      console.error('[LecturerSignupService] Profile upsert error:', profileUpsertError)
      await admin.auth.admin.deleteUser(userId)
      throw new Error(`Failed to create profile: ${profileUpsertError.message}`)
    }

    const { error: studentCleanupError } = await admin
      .from('student_profiles')
      .delete()
      .eq('profile_id', userId)

    if (studentCleanupError) {
      console.warn('[LecturerSignupService] Student profile cleanup warning:', studentCleanupError)
    }

    // Step 3: Create teacher profile
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
      console.error('[LecturerSignupService] Teacher profile insert error:', teacherError)
      // Attempt to clean up auth user
      await admin.auth.admin.deleteUser(userId)
      throw new Error(`Failed to create teacher profile: ${teacherError.message}`)
    }

    console.log('[LecturerSignupService] Lecturer registration completed successfully')

    return {
      user: {
        id: userId,
        email: input.email,
      },
      message: 'Lecturer account created successfully. You can now login.',
    }
  }
}
