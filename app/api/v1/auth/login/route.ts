import { LoginSchema } from '@/lib/validation';
import { AuthService } from '@/lib/services/auth.service';
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

    const result = await AuthService.login(validationResult.data);

    return NextResponse.json(
      {
        success: true,
        user: result.user,
        redirectTo:
          result.user.role === 'admin'
            ? '/admin/dashboard'
            : result.user.role === 'lecturer'
              ? '/teacher/dashboard'
              : result.user.role === 'aspirant'
                ? '/aspirant/dashboard'
                : '/student/dashboard',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[ccht] Login error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Invalid email or password';
    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}
