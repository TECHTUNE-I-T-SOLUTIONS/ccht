import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { EmailTemplates } from '@/lib/services/email-templates'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = await createClient()
    const admin = createAdminClient()
    const origin = request.nextUrl.origin

    const {
      email,
      password,
      firstName,
      lastName,
      middleName,
      phone,
      dateOfBirth,
      gender,
      studentNumber,
      matricNumber,
      nationality,
      stateOfOrigin,
      lga,
      address,
      addressLine2,
      city,
      state,
      guardianName,
      guardianPhone,
      guardianEmail,
      emergencyContactName,
      emergencyContactPhone,
      bloodGroup,
      genotype,
      passportPhotoUrl,
      program,
      programId,
      department,
      academicSession,
      academicSessionId,
      level,
      admissionDate,
      expectedGraduationDate,
    } = body

    if (!email || !password || !firstName || !lastName || !dateOfBirth || !gender || !studentNumber || !matricNumber) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
        data: {
          first_name: firstName,
          last_name: lastName,
          middle_name: middleName || '',
          phone: phone || '',
        },
      },
    })

    if (error || !data.user) {
      return NextResponse.json(
        { error: error?.message || 'Database error creating new user' },
        { status: 500 }
      )
    }

    const userId = data.user.id

    const { error: profileError } = await admin.from('profiles').upsert({
      id: userId,
      email,
      first_name: firstName,
      last_name: lastName,
      middle_name: middleName || null,
      phone: phone || null,
      role: 'student',
      avatar_url: passportPhotoUrl || null,
      is_active: true,
    })

    if (profileError) {
      await admin.auth.admin.deleteUser(userId)
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    const { error: studentError } = await admin.from('student_profiles').upsert({
      profile_id: userId,
      student_number: studentNumber,
      matric_number: matricNumber,
      admission_session: academicSession || null,
      admission_date: admissionDate || null,
      date_of_birth: dateOfBirth,
      gender,
      nationality: nationality || 'Nigerian',
      state_of_origin: stateOfOrigin || null,
      local_government_area: lga || null,
      address_line_1: address || null,
      address_line_2: addressLine2 || null,
      city: city || null,
      state: state || null,
      guardian_name: guardianName || null,
      guardian_phone: guardianPhone || null,
      guardian_email: guardianEmail || null,
      emergency_contact_name: emergencyContactName || null,
      emergency_contact_phone: emergencyContactPhone || null,
      blood_group: bloodGroup || null,
      genotype: genotype || null,
      current_level: level || null,
      admission_status: 'active',
    })

    if (studentError) {
      await admin.auth.admin.deleteUser(userId)
      return NextResponse.json({ error: studentError.message }, { status: 500 })
    }

    // Create enrollment record if program and session are provided
    if (programId && academicSessionId) {
      const { error: enrollmentError } = await admin.from('enrollments').insert({
        student_id: userId,
        program_id: programId,
        session_id: academicSessionId,
        expected_graduation_date: expectedGraduationDate || null,
        status: 'active',
      })

      if (enrollmentError) {
        console.error('Failed to create enrollment:', enrollmentError)
        // Don't fail the signup if enrollment creation fails, just log the error
      }
    }

    // Send welcome email to the new student
    try {
      const welcomeEmail = EmailTemplates.studentWelcome({
        email,
        fullName: `${firstName} ${lastName}`,
        matricNumber,
        program: program || 'Not specified',
        department: department || 'Not specified',
      })

      await fetch(`${origin}/api/v1/email/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(welcomeEmail),
      })
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError)
      // Don't fail the signup if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Student account created successfully.',
      user: { id: userId, email },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to create student account' },
      { status: 500 }
    )
  }
}
