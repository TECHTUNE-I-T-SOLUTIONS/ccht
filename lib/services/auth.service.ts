import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { LoginInput, SignUpInput } from '@/lib/validation'
import { z } from 'zod'

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

  static async register(input: any, origin: string) {
    const supabase = await createClient()
    const jambRegNo = input.jambRegNo ?? input.jamb_reg_no ?? ''

    const passwordCheck = this.validatePassword(input.password)
    if (!passwordCheck.success) {
      throw new Error(passwordCheck.error.issues[0]?.message || 'Password is too weak')
    }

    await this.ensureEmailAvailable(input.email)

    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? origin}/auth/callback`,
        data: {
          first_name: input.firstName,
          last_name: input.lastName,
          role: input.role,
          phone: input.phone ?? '',
          jamb_reg_no: jambRegNo,
        },
      },
    })

    if (error) throw new Error(error.message || 'Failed to register')
    if (!data.user) throw new Error('Failed to create user')

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

    if (error) throw new Error('Invalid email or password')
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
