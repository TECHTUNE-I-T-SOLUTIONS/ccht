import { NextRequest, NextResponse } from 'next/server'
import { LecturerAuthService } from '@/lib/services/lecturer-auth.service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const origin = request.nextUrl.origin
    
    console.log('[LecturerSignupAPI] Received request:', {
      email: body.email,
      firstName: body.firstName,
      lastName: body.lastName,
      employeeNumber: body.employeeNumber,
    })

    const result = await LecturerAuthService.register(body, origin)

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    console.error('[LecturerSignupAPI] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create lecturer account' },
      { status: 400 }
    )
  }
}
