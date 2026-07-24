import { NextResponse } from 'next/server'
import { LecturerSignupService } from '@/lib/services/lecturer-signup.service'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { 
      email, 
      password, 
      firstName, 
      lastName, 
      middleName, 
      phone, 
      employeeNumber,
      staffNumber,
      qualification,
      specialization,
      department,
      departments,
      employmentType,
      dateJoined,
      officeLocation,
      officeHours,
    } = body

    console.log('Create lecturer request:', { email, firstName, lastName })

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const origin = new URL(request.url).origin
    
    const result = await LecturerSignupService.register(
      {
        email,
        password,
        firstName,
        lastName,
        middleName,
        phone,
        employeeNumber,
        staffNumber,
        qualification,
        specialization,
        department,
        departments,
        employmentType,
        dateJoined,
        officeLocation,
        officeHours,
      },
      origin
    )

    return NextResponse.json({
      success: true,
      data: {
        userId: result.user.id,
        email: result.user.email,
      }
    })
  } catch (error: any) {
    console.error('Failed to create lecturer:', {
      message: error.message || 'No message',
      status: error.status,
      code: error.code,
      name: error.name,
      stack: error.stack?.substring(0, 500),
    })
    return NextResponse.json(
      { success: false, error: error.message || error.name || 'Failed to create lecturer' },
      { status: error.status || 500 }
    )
  }
}
