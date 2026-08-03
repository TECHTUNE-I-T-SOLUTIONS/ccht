import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Use Supabase's built-in password reset functionality.
    //
    // The `redirectTo` URL must be registered in the Supabase dashboard under
    // Authentication → URL Configuration → Redirect URLs. We point it at the
    // server-side `/auth/confirm` token-exchange endpoint (PKCE flow) so that
    // the recovery token is verified server-side, then the user is redirected
    // to `/reset-password/confirm` with a valid session cookie already set.
    //
    // NOTE: For this to work end-to-end, the Supabase "Reset password" email
    // template MUST link to:
    //   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next={{ .RedirectTo }}
    // See supabase/PASSWORD_RESET_SETUP.md for setup instructions.
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || 'https://www.covenantcollegeofhealthtech.com.ng'
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${appUrl}/auth/confirm?next=/reset-password/confirm`,
    })

    if (error) {
      console.error('Password reset error:', error)
      // Don't reveal specific error for security
      return NextResponse.json(
        { error: 'If an account exists with this email, a password reset link has been sent.' },
        { status: 200 }
      )
    }

    // Always return success for security (don't reveal if email exists)
    return NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.'
    })
  } catch (error) {
    console.error('Password reset error:', error)
    return NextResponse.json(
      { error: 'An error occurred. Please try again later.' },
      { status: 500 }
    )
  }
}
