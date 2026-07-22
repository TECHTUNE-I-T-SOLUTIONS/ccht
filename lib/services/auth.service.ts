import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { LoginInput, SignUpInput } from '@/lib/validation'
import { z } from 'zod'
import { STAFF_ID_PREFIX } from '@/lib/admin-constants'

export type AuthUserRole = 'student' | 'lecturer' | 'admin' | 'super_admin' | 'aspirant'

const passwordRules = z
  .string()
  .min(10, 'Password must be at least 10 characters')
  .regex(/[A-Z]/, 'Add at least one uppercase letter')
  .regex(/[a-z]/, 'Add at least one lowercase letter')
  .regex(/[0-9]/, 'Add at least one number')
  .regex(/[^A-Za-z0-9]/, 'Add at least one special character')

export class AuthService {
  static validatePassword(password: string) {
    return passwordRules.safeParse(password)
  }

  static async ensureEmailAvailable(email: string) {
    const admin = createAdminClient()
    const normalized = email.trim().toLowerCase()

    const [{ data: authUsers }, { data: profileMatch }] = await Promise.all([
      admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      admin.from('profiles').select('id').ilike('email', normalized).limit(1),
    ])

    const authExists = Boolean(authUsers?.users?.some((user) => (user.email || '').toLowerCase() === normalized))
    const profileExists = Array.isArray(profileMatch) && profileMatch.length > 0

    if (authExists || profileExists) {
      throw new Error('This email is already in use')
    }
  }

  static async generateStaffId(): Promise<string> {
    const admin = createAdminClient()
    const { data: lastAdmin } = await admin
      .from('admin_profiles')
      .select('staff_id')
      .not('staff_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    let nextNumber = 1
    if (lastAdmin?.staff_id) {
      const lastNumber = parseInt(lastAdmin.staff_id.replace(STAFF_ID_PREFIX, ''))
      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1
      }
    }

    return `${STAFF_ID_PREFIX}${String(nextNumber).padStart(4, '0')}`
  }

  static async register(input: any, origin: string) {
    const supabase = await createClient()
    const admin = createAdminClient()
    const jambRegNo = input.jambRegNo ?? input.jamb_reg_no ?? ''

    console.log('[AuthService] Register called with:', {
      email: input.email,
      role: input.role,
      passwordLength: input.password?.length,
      firstName: input.firstName,
      lastName: input.lastName,
    })

    const passwordCheck = this.validatePassword(input.password)
    if (!passwordCheck.success) {
      console.error('[AuthService] Password validation failed:', passwordCheck.error)
      throw new Error(passwordCheck.error.issues[0]?.message || 'Password is too weak')
    }

    await this.ensureEmailAvailable(input.email)

    console.log('[AuthService] Calling supabase.auth.signUp...')
    
    // Only include jamb_reg_no for aspirant role
    const userData: any = {
      first_name: input.firstName,
      middle_name: input.middleName || '',
      last_name: input.lastName,
      role: input.role,
      phone: input.phone ?? '',
    }
    
    if (input.role === 'aspirant' && jambRegNo) {
      userData.jamb_reg_no = jambRegNo
    }

    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? origin}/auth/callback`,
        data: userData,
      },
    })

    console.log('[AuthService] signUp result:', { 
      hasError: !!error, 
      errorMessage: error?.message, 
      errorName: error?.name,
      errorStatus: error?.status,
      hasUser: !!data?.user,
      userId: data?.user?.id,
      errorFull: error,
    })

    if (error) {
      console.error('[AuthService] Full error object:', JSON.stringify(error, null, 2))
      throw new Error(error.message || 'Failed to register')
    }
    if (!data.user) throw new Error('Failed to create user')

    // Update profiles table with phone and middle_name
    const { error: profileUpdateError } = await admin
      .from('profiles')
      .update({
        phone: input.phone || null,
        middle_name: input.middleName || null,
      })
      .eq('id', data.user.id)

    if (profileUpdateError) {
      console.error('[AuthService] Failed to update profile with phone/middle_name:', profileUpdateError)
    }

    // Create or update aspirant profile if role is aspirant
    if (input.role === 'aspirant') {
      // Check if aspirant profile already exists
      const { data: existingProfile } = await admin
        .from('aspirant_profiles')
        .select('profile_id')
        .eq('profile_id', data.user.id)
        .single()

      if (!existingProfile) {
        // Create new aspirant profile
        const { error: aspirantError } = await admin
          .from('aspirant_profiles')
          .insert({
            profile_id: data.user.id,
            jamb_reg_no: jambRegNo || null,
            phone: input.phone,
            preferred_program_id: input.preferred_program_id || null,
            admission_session: input.admission_session || null,
            application_status: 'draft',
            current_stage: 'signup',
          })

        if (aspirantError) {
          console.error('[AuthService] Failed to create aspirant profile:', aspirantError)
        } else {
          console.log('[AuthService] Aspirant profile created for user:', data.user.id)
        }
      } else {
        // Update existing aspirant profile with latest data
        const { error: updateError } = await admin
          .from('aspirant_profiles')
          .update({
            jamb_reg_no: jambRegNo || null,
            preferred_program_id: input.preferred_program_id || null,
            admission_session: input.admission_session || null,
          })
          .eq('profile_id', data.user.id)

        if (updateError) {
          console.error('[AuthService] Failed to update aspirant profile:', updateError)
        } else {
          console.log('[AuthService] Aspirant profile updated for user:', data.user.id)
        }
      }

      // Note: Enrollment creation is handled during admin migration from aspirant to student
      // This ensures the student_profiles record exists before creating enrollments
    }

    // Create admin profile if role is admin
    if (input.role === 'admin') {
      // Check if admin profile already exists
      const { data: existingProfile } = await admin
        .from('admin_profiles')
        .select('profile_id, staff_id')
        .eq('profile_id', data.user.id)
        .single()

      const staffId = existingProfile?.staff_id || await this.generateStaffId()
      
      const profileData = {
        profile_id: data.user.id,
        staff_id: staffId,
        department: input.department || null,
        designation: input.designation || null,
        admin_scope: input.adminScope || 'operations',
        can_manage_users: input.canManageUsers || false,
        can_manage_content: input.canManageContent || false,
        can_manage_academics: input.canManageAcademics || false,
        can_manage_finance: input.canManageFinance || false,
      }

      if (!existingProfile) {
        // Create new profile
        const { error: profileError } = await admin
          .from('admin_profiles')
          .insert(profileData)

        if (profileError) {
          console.error('[AuthService] Failed to create admin profile:', profileError)
        }
      } else {
        // Update existing profile with new data
        const { error: updateError } = await admin
          .from('admin_profiles')
          .update({
            department: profileData.department,
            designation: profileData.designation,
            admin_scope: profileData.admin_scope,
            can_manage_users: profileData.can_manage_users,
            can_manage_content: profileData.can_manage_content,
            can_manage_academics: profileData.can_manage_academics,
            can_manage_finance: profileData.can_manage_finance,
          })
          .eq('profile_id', data.user.id)

        if (updateError) {
          console.error('[AuthService] Failed to update admin profile:', updateError)
        } else {
          console.log('[AuthService] Admin profile updated successfully')
        }
      }
    }

    return {
      user: {
        id: data.user.id,
        email: data.user.email,
      },
      message: 'Registration successful. Please check your email to verify your account.',
    }
  }

  static async login(input: LoginInput) {
    const supabase = await createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    })

    if (error) {
      // Check if the error is due to invalid credentials (email not found or wrong password)
      if (error.message === 'Invalid login credentials') {
        // Check if email exists in the system
        const admin = createAdminClient()
        const normalized = input.email.trim().toLowerCase()
        
        const [{ data: authUsers }, { data: profileMatch }] = await Promise.all([
          admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
          admin.from('profiles').select('id').ilike('email', normalized).limit(1),
        ])

        const authExists = Boolean(authUsers?.users?.some((user) => (user.email || '').toLowerCase() === normalized))
        const profileExists = Array.isArray(profileMatch) && profileMatch.length > 0

        if (!authExists && !profileExists) {
          throw new Error('Account does not exist')
        }
      }
      throw new Error('Invalid email or password')
    }
    
    if (!data.user) throw new Error('Failed to log in')

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    if (profileError) throw new Error('Unable to load account profile')

    return {
      user: {
        id: data.user.id,
        email: data.user.email,
        role: (profile?.role as AuthUserRole) || 'student',
      },
    }
  }
}
