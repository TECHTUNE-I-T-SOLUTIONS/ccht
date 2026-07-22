import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { AuthService } from '@/lib/services/auth.service'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const admin = createAdminClient()

    // Verify the requesting user is an admin
    const { data: { user: adminUser }, error: authError } = await supabase.auth.getUser()
    if (authError || !adminUser) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', adminUser.id)
      .single()

    if (!adminProfile || !['admin', 'super_admin'].includes(adminProfile.role)) {
      return NextResponse.json(
        { success: false, error: 'Not authorized' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { email, password, firstName, lastName, middleName, phone, role, ...profileData } = body

    console.log('Create user request:', { email, firstName, lastName, role, profileDataKeys: Object.keys(profileData) })

    if (!email || !password || !firstName || !lastName || !role) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Use AuthService.register (same as admission page)
    const origin = new URL(request.url).origin
    const registerResult = await AuthService.register(
      {
        email,
        password,
        firstName,
        lastName,
        middleName,
        phone,
        role,
      },
      origin
    )

    const userId = registerResult.user.id
    console.log('Auth user created successfully via AuthService, updating profile...')

    // Update profiles table with additional data using admin client
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
      throw new Error(`Profile update failed: ${profileError.message}`)
    }

    console.log('Profile updated successfully, creating role-specific profile...')

    // If lecturer, create teacher profile
    if (role === 'lecturer') {
      const { error: teacherError } = await admin
        .from('teacher_profiles')
        .insert({
          profile_id: userId,
          employee_number: profileData.employeeNumber,
          staff_number: profileData.staffNumber || profileData.employeeNumber,
          qualification: profileData.qualification,
          specialization: profileData.specialization,
          department: profileData.department || '',
          departments: profileData.departments || [profileData.department].filter(Boolean),
          employment_type: profileData.employmentType || 'full_time',
          date_joined: profileData.dateJoined,
          office_location: profileData.officeLocation || null,
          office_hours: profileData.officeHours || null,
          can_publish_results: profileData.canPublishResults || false,
          can_enter_scores: profileData.canEnterScores !== false,
          employment_status: profileData.employmentStatus || 'active',
        })

      if (teacherError) {
        console.error('Teacher profile insert error:', teacherError)
        // Attempt to clean up
        await admin.from('profiles').delete().eq('id', userId)
        await admin.auth.admin.deleteUser(userId)
        throw teacherError
      }
    }

    // If student, create student profile
    if (role === 'student') {
      const { error: studentError } = await admin
        .from('student_profiles')
        .insert({
          profile_id: userId,
          student_number: profileData.studentNumber || null,
          matric_number: profileData.matricNumber || null,
          date_of_birth: profileData.dateOfBirth || null,
          gender: profileData.gender || null,
          admission_session: profileData.admissionSession || null,
          current_level: profileData.currentLevel || null,
          admission_status: profileData.admissionStatus || 'active',
          nationality: profileData.nationality || 'Nigerian',
          state_of_origin: profileData.stateOfOrigin || null,
          local_government_area: profileData.lga || null,
          guardian_name: profileData.guardianName || null,
          guardian_phone: profileData.guardianPhone || null,
          guardian_email: profileData.guardianEmail || null,
          address_line_1: profileData.address || null,
          city: profileData.city || null,
          state: profileData.state || null,
        })

      if (studentError) {
        console.error('Student profile insert error:', studentError)
        // Attempt to clean up
        await admin.from('profiles').delete().eq('id', userId)
        await admin.auth.admin.deleteUser(userId)
        throw studentError
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        userId,
        email,
        defaultPassword: password,
        message: 'Account created successfully. Default password: ' + password
      }
    })
  } catch (error: any) {
    console.error('Failed to create user:', {
      message: error.message || 'No message',
      status: error.status,
      code: error.code,
      name: error.name,
      stack: error.stack?.substring(0, 500),
    })
    return NextResponse.json(
      { success: false, error: error.message || error.name || 'Failed to create user' },
      { status: error.status || 500 }
    )
  }
}
