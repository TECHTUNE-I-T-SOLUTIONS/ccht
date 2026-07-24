import { NextRequest, NextResponse } from 'next/server'
import { StudentAuthService } from '@/lib/services/student-auth.service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const origin = request.nextUrl.origin
    
    console.log('[StudentSignupAPI] Received request:', {
      email: body.email,
      firstName: body.firstName,
      lastName: body.lastName,
      studentNumber: body.studentNumber,
    })

    const result = await StudentAuthService.register(body, origin)

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    console.error('[StudentSignupAPI] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create student account' },
      { status: 400 }
    )
  }
}
