import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'
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

export class StudentAuthService {
  static async register(input: StudentSignupInput, origin?: string) {
    console.log('[StudentAuthService] Starting student registration')

    // Step 1: Create auth user using Supabase auth API (absolute minimal - email + password only)
    // Use direct client without cookies (like client-side calls)
    const supabase = await createServerSupabaseClient()
    
    console.log('[StudentAuthService] Creating auth user with absolute minimal data:', {
      email: input.email,
      passwordLength: input.password.length,
    })
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        emailRedirectTo: `${origin ?? process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? 'http://localhost:3000'}/auth/callback`,
        data: {
          first_name: input.firstName,
          last_name: input.lastName,
          middle_name: input.middleName || '',
          phone: input.phone || '',
        },
      },
    })

    if (authError) {
      console.error('[StudentAuthService] Auth signup error:', authError)
      throw new Error(authError.message)
    }

    if (!authData.user) {
      throw new Error('Failed to create auth user')
    }

    const userId = authData.user.id
    console.log('[StudentAuthService] Auth user created:', userId)

    const admin = createAdminClient()
    const { error: profileError } = await admin
      .from('profiles')
      .upsert({
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
      console.error('[StudentAuthService] Profile error:', profileError)
      await admin.auth.admin.deleteUser(userId)
      throw new Error(`Failed to create profile: ${profileError.message}`)
    }

    const { error: studentError } = await admin
      .from('student_profiles')
      .upsert({
        profile_id: userId,
        student_number: input.studentNumber || null,
        matric_number: input.matricNumber || null,
        date_of_birth: input.dateOfBirth || null,
        gender: input.gender || null,
        admission_session: null,
        current_level: null,
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
      console.error('[StudentAuthService] Student profile error:', studentError)
      // Cleanup auth user
      await admin.auth.admin.deleteUser(userId)
      throw new Error(`Failed to create student profile: ${studentError.message}`)
    }

    console.log('[StudentAuthService] Student registration completed successfully')

    return {
      user: authData.user,
      message: 'Student account created successfully. You can now login.',
    }
  }
}
