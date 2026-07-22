import { NextResponse } from 'next/server'
import { AuthService } from '@/lib/services/auth.service'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const admin = createAdminClient()

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

    // Use AuthService.register (same as admission page)
    const origin = new URL(request.url).origin
    
    console.log('Calling AuthService.register with:', { 
      email, 
      passwordLength: password?.length, 
      firstName, 
      lastName, 
      role: 'lecturer' 
    })

    const registerResult = await AuthService.register(
      {
        email,
        password,
        firstName,
        lastName,
        middleName,
        phone,
        role: 'lecturer',
      },
      origin
    )

    const userId = registerResult.user.id
    console.log('Auth user created successfully via AuthService, creating teacher profile...')

    // Create teacher profile
    const { error: teacherError } = await admin
      .from('teacher_profiles')
      .insert({
        profile_id: userId,
        employee_number: employeeNumber,
        staff_number: staffNumber || employeeNumber,
        qualification: qualification || null,
        specialization: specialization || null,
        department: department || null,
        departments: departments || (department ? [department] : []),
        employment_type: employmentType || 'full_time',
        date_joined: dateJoined || null,
        office_location: officeLocation || null,
        office_hours: officeHours || null,
        can_publish_results: false,
        can_enter_scores: true,
        employment_status: 'active',
      })

    if (teacherError) {
      console.error('Teacher profile insert error:', teacherError)
      throw teacherError
    }

    return NextResponse.json({
      success: true,
      data: {
        userId,
        email,
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
