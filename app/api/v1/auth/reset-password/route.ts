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

    // Use Supabase's built-in password reset functionality
    // Supabase will handle sending the email using their configured email template
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.covenantcollegeofhealthtech.com.ng'}/reset-password/confirm`,
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
