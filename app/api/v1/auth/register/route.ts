import { SignUpSchema } from '@/lib/validation';
import { AuthService } from '@/lib/services/auth.service';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validationResult = SignUpSchema.safeParse(body);
    if (!validationResult.success) {
      console.error('[register route] Validation failed:', validationResult.error.flatten());
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const result = await AuthService.register(
      {
        ...validationResult.data,
        phone: typeof body.phone === 'string' ? body.phone : '',
        jambRegNo: typeof body.jambRegNo === 'string' ? body.jambRegNo : undefined,
        jamb_reg_no: typeof body.jamb_reg_no === 'string' ? body.jamb_reg_no : undefined,
      },
      request.nextUrl.origin,
    )

    return NextResponse.json(
      {
        success: true,
        message: result.message,
        user: result.user,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[ccht] Register error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: message },
      { status: message === 'Internal server error' ? 500 : 400 }
    );
  }
}
