import { createAdminClient } from '@/lib/supabase/admin'

export interface StudentSignupInput {
  email: string
  password: string
  firstName: string
  lastName: string
  middleName?: string | null
  phone?: string | null
  studentNumber: string
  matricNumber: string
  dateOfBirth: string
  gender: string
  nationality?: string
  stateOfOrigin?: string | null
  lga?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  guardianName?: string | null
  guardianPhone?: string | null
  guardianEmail?: string | null
  admissionStatus?: string
}

export class StudentSignupService {
  static async register(input: StudentSignupInput, origin: string) {
    console.log('[StudentSignupService] Register called with:', {
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      studentNumber: input.studentNumber,
      matricNumber: input.matricNumber,
    })

    const admin = createAdminClient()

    console.log('[StudentSignupService] Creating auth user via admin.createUser...')
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
      user_metadata: {
        first_name: input.firstName,
        last_name: input.lastName,
        middle_name: input.middleName || '',
        phone: input.phone || '',
        role: 'student',
      },
    })

    if (authError) {
      console.error('[StudentSignupService] Auth user creation error:', authError)
      throw new Error(`Failed to create auth user: ${authError.message}`)
    }

    const userId = authData.user.id
    console.log('[StudentSignupService] Auth user created successfully, writing profile records...')

    // Step 2: Write the shared profile explicitly so signup does not depend on auth triggers.
    const { error: profileError } = await admin.from('profiles').upsert({
      id: userId,
      email: input.email,
      first_name: input.firstName,
      last_name: input.lastName,
      middle_name: input.middleName || null,
      phone: input.phone || null,
      role: 'student',
      is_active: true,
    })

    if (profileError) {
      console.error('[StudentSignupService] Profile upsert error:', profileError)
      // Attempt to clean up auth user
      await admin.auth.admin.deleteUser(userId)
      throw new Error(`Failed to create profile: ${profileError.message}`)
    }

    const { error: studentError } = await admin.from('student_profiles').upsert({
      profile_id: userId,
      student_number: input.studentNumber || null,
      matric_number: input.matricNumber || null,
      date_of_birth: input.dateOfBirth || null,
      gender: input.gender || null,
      admission_status: input.admissionStatus || 'active',
      nationality: input.nationality || 'Nigerian',
      state_of_origin: input.stateOfOrigin || null,
      local_government_area: input.lga || null,
      guardian_name: input.guardianName || null,
      guardian_phone: input.guardianPhone || null,
      guardian_email: input.guardianEmail || null,
      address_line_1: input.address || null,
      city: input.city || null,
      state: input.state || null,
    })

    if (studentError) {
      console.error('[StudentSignupService] Student profile insert error:', studentError)
      // Attempt to clean up auth user
      await admin.auth.admin.deleteUser(userId)
      throw new Error(`Failed to create student profile: ${studentError.message}`)
    }

    console.log('[StudentSignupService] Student registration completed successfully')

    return {
      user: {
        id: userId,
        email: input.email,
      },
      message: 'Student account created successfully. You can now login.',
    }
  }
}
