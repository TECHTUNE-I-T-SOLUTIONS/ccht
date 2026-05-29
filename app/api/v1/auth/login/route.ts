import { createClient } from '@/lib/supabase/server';
import { LoginSchema } from '@/lib/validation';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = LoginSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const { email, password } = validationResult.data;

    const supabase = await createClient();

    // Sign in user
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('[ccht] Login error:', error);
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    if (!data.user) {
      return NextResponse.json(
        { error: 'Failed to log in' },
        { status: 401 }
      );
    }

    // Get user profile to determine role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();

    return NextResponse.json(
      {
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email,
          role: profile?.role || 'student',
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[ccht] Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
