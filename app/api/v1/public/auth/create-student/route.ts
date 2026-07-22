import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const admin = createAdminClient()

    const body = await request.json()
    const { 
      email, 
      password, 
      firstName, 
      lastName, 
      middleName, 
      phone, 
      studentNumber,
      matricNumber,
      dateOfBirth,
      gender,
      nationality,
      stateOfOrigin,
      lga,
      address,
      city,
      state,
      guardianName,
      guardianPhone,
      guardianEmail,
      admissionStatus,
    } = body

    console.log('Create student request:', { email, firstName, lastName })

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate password strength (min 6 characters)
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const normalized = email.trim().toLowerCase()
    const [{ data: authUsers }, { data: profileMatch }] = await Promise.all([
      admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      admin.from('profiles').select('id').ilike('email', normalized).limit(1),
    ])

    const authExists = Boolean(authUsers?.users?.some((user) => (user.email || '').toLowerCase() === normalized))
    const profileExists = Array.isArray(profileMatch) && profileMatch.length > 0

    if (authExists || profileExists) {
      return NextResponse.json(
        { success: false, error: 'A user with this email already exists' },
        { status: 409 }
      )
    }


    // Use direct REST API with service role key for reliable user creation
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!serviceRoleKey || !supabaseUrl) {
      return NextResponse.json(
        { success: false, error: 'Server configuration error: Missing Supabase credentials' },
        { status: 500 }
      )
    }

    console.log('Creating student via REST API:', { email, passwordLength: password.length })

    const response = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
          middle_name: middleName || '',
          role: 'student',
          phone: phone || '',
        },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Supabase REST API error:', {
        status: response.status,
        body: errorText,
      })
      
      let errorMessage = `Supabase API error: ${response.status}`
      try {
        const errorJson = JSON.parse(errorText)
        errorMessage = errorJson.msg || errorJson.message || errorMessage
      } catch {
        errorMessage = `${errorMessage} - ${errorText}`
      }
      
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: response.status }
      )
    }

    const authData = await response.json()
    
    if (!authData || !authData.id) {
      throw new Error('Failed to create user - no user returned from API')
    }

    const userId = authData.id

    // Step 2: Update profile with additional data
    const { error: profileError } = await admin
      .from('profiles')
      .update({
        phone: phone || null,
        middle_name: middleName || null,
        is_active: true,
      })
      .eq('id', userId)

    if (profileError) {
      console.error('Profile update error:', profileError)
      // Attempt to clean up auth user
      await admin.auth.admin.deleteUser(userId)
      throw profileError
    }

    // Step 3: Create student profile
    const { error: studentError } = await admin
      .from('student_profiles')
      .insert({
        profile_id: userId,
        student_number: studentNumber || null,
        matric_number: matricNumber || null,
        date_of_birth: dateOfBirth || null,
        gender: gender || null,
        admission_session: null,
        current_level: null,
        admission_status: admissionStatus || 'active',
        nationality: nationality || 'Nigerian',
        state_of_origin: stateOfOrigin || null,
        local_government_area: lga || null,
        guardian_name: guardianName || null,
        guardian_phone: guardianPhone || null,
        guardian_email: guardianEmail || null,
        address_line_1: address || null,
        city: city || null,
        state: state || null,
      })

    if (studentError) {
      console.error('Student profile insert error:', studentError)
      // Attempt to clean up
      await admin.from('profiles').delete().eq('id', userId)
      await admin.auth.admin.deleteUser(userId)
      throw studentError
    }

    return NextResponse.json({
      success: true,
      data: {
        userId,
        email,
      }
    })
  } catch (error: any) {
    console.error('Failed to create student:', {
      message: error.message || 'No message',
      status: error.status,
      code: error.code,
      name: error.name,
      stack: error.stack?.substring(0, 500),
    })
    return NextResponse.json(
      { success: false, error: error.message || error.name || 'Failed to create student' },
      { status: error.status || 500 }
    )
  }
}
