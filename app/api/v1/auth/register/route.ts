import { createClient } from '@/lib/supabase/server';
import { SignUpSchema } from '@/lib/validation';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = SignUpSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const { email, password, firstName, lastName, role } = validationResult.data;
    const phone = typeof body.phone === 'string' ? body.phone : '';
    const jambRegNo = typeof body.jambRegNo === 'string' ? body.jambRegNo : typeof body.jamb_reg_no === 'string' ? body.jamb_reg_no : '';

    const supabase = await createClient();

    // Sign up user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? `${request.nextUrl.origin}`}/auth/callback`,
        data: {
          first_name: firstName,
          last_name: lastName,
          role: role,
          phone,
          jamb_reg_no: jambRegNo,
        },
      },
    });

    if (authError) {
      console.error('[ccht] Auth error:', authError);
      return NextResponse.json(
        { error: authError.message || 'Failed to register' },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 400 }
      );
    }

    // The profile will be auto-created by the trigger, but we can verify it here
    // For now, we'll return success and let the trigger handle profile creation
    return NextResponse.json(
      {
        success: true,
        message: 'Registration successful. Please check your email to verify your account.',
        user: {
          id: authData.user.id,
          email: authData.user.email,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[ccht] Register error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
