import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { uploadFileToCloudinary } from '@/lib/cloudinary'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: 'Missing Supabase admin credentials' }, { status: 500 })
    }

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
      passportPhotoUrl,
      passportPhotoFile,
      canPublishResults,
      canEnterScores,
    } = body

    if (
      !email ||
      !password ||
      !firstName ||
      !lastName ||
      !employeeNumber ||
      !qualification ||
      !specialization ||
      !department ||
      !Array.isArray(departments) ||
      departments.length === 0 ||
      !dateJoined
    ) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    let resolvedPassportUrl = passportPhotoUrl || null
    if (!resolvedPassportUrl && passportPhotoFile?.base64 && passportPhotoFile?.name) {
      const blob = await fetch(`data:${passportPhotoFile.type || 'image/png'};base64,${passportPhotoFile.base64}`).then((r) => r.blob())
      const file = new File([blob], passportPhotoFile.name, { type: passportPhotoFile.type || 'image/png' })
      const uploaded = await uploadFileToCloudinary(file, {
        folder: `profile-photos/${email}`,
        publicId: `${Date.now()}-${passportPhotoFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`,
        resourceType: 'image',
      })
      resolvedPassportUrl = uploaded.secure_url
    }

    const authResponse = await fetch(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        apikey: serviceRoleKey,
        authorization: `Bearer ${serviceRoleKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
          middle_name: middleName || '',
          phone: phone || '',
        },
      }),
    })

    const authPayload = await authResponse.json().catch(() => null)
    if (!authResponse.ok || !authPayload?.id) {
      console.error('[lecturer-signup] auth_create error', authPayload)
      return NextResponse.json(
        {
          error: authPayload?.msg || authPayload?.message || 'Database error creating new user',
          stage: 'auth_create',
          details: authPayload,
        },
        { status: 500 }
      )
    }

    const userId = authPayload.id as string
    const admin = createAdminClient()

    const { error: profileError } = await admin.from('profiles').upsert({
      id: userId,
      email,
      first_name: firstName,
      last_name: lastName,
      middle_name: middleName || null,
      phone: phone || null,
      role: 'lecturer',
      avatar_url: resolvedPassportUrl || null,
      is_active: true,
    })

    if (profileError) {
      await admin.auth.admin.deleteUser(userId)
      return NextResponse.json({ error: profileError.message, stage: 'profile_upsert', details: profileError }, { status: 500 })
    }

    const { error: lecturerError } = await admin.from('teacher_profiles').upsert({
      profile_id: userId,
      employee_number: employeeNumber,
      staff_number: staffNumber || employeeNumber,
      qualification,
      specialization,
      department,
      departments,
      employment_type: employmentType || 'full_time',
      date_joined: dateJoined,
      office_location: officeLocation || null,
      office_hours: officeHours || null,
      can_publish_results: Boolean(canPublishResults),
      can_enter_scores: canEnterScores !== false,
      employment_status: 'active',
    })

    if (lecturerError) {
      await admin.auth.admin.deleteUser(userId)
      return NextResponse.json({ error: lecturerError.message, stage: 'teacher_profiles_upsert', details: lecturerError }, { status: 500 })
    }

    try {
      await admin.from('teacher_notifications').insert({
        teacher_id: userId,
        title: 'Welcome to CCHT!',
        message: 'Your lecturer account has been created successfully. You can now access the lecturer dashboard.',
        notification_type: 'account_created',
        category: 'account',
        deep_link: '/teacher/dashboard',
      })

      const { data: admins } = await admin
        .from('admin_profiles')
        .select('profile_id')

      if (admins?.length) {
        await admin.from('admin_notifications').insert(
          admins.map((adminRow) => ({
            admin_id: adminRow.profile_id,
            title: 'New Lecturer Signup',
            message: `A new lecturer has signed up: ${firstName} ${lastName} (${email})`,
            notification_type: 'new_signup',
            category: 'user_management',
            deep_link: '/admin/management/lecturers',
          }))
        )
      }
    } catch (notificationError) {
      console.warn('[lecturer-signup] notification_insert_warning', notificationError)
    }

    return NextResponse.json({
      success: true,
      message: 'Lecturer account created successfully.',
      user: { id: userId, email },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to create lecturer account' },
      { status: 500 }
    )
  }
}
