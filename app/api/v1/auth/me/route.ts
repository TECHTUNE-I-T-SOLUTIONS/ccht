import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AdmissionService } from '@/lib/services/admission.service'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ user: null }, { status: 200 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name, middle_name, phone, role, avatar_url, profile_photo_path, profile_photo_bucket')
      .eq('id', user.id)
      .single()

    // Fetch admin profile data
    const { data: adminProfile } = await supabase
      .from('admin_profiles')
      .select('*')
      .eq('profile_id', user.id)
      .single()

    const avatarStoragePath = profile?.profile_photo_path || profile?.avatar_url || ''
    const avatarUrl =
      avatarStoragePath && profile?.profile_photo_bucket
        ? await AdmissionService.createSignedUrl(profile.profile_photo_bucket, avatarStoragePath).catch(() => avatarStoragePath)
        : avatarStoragePath

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          firstName: profile?.first_name || user.user_metadata?.first_name || '',
          lastName: profile?.last_name || user.user_metadata?.last_name || '',
          middleName: profile?.middle_name || user.user_metadata?.middle_name || '',
          phone: profile?.phone || user.user_metadata?.phone || '',
          role: profile?.role || user.user_metadata?.role || 'student',
          avatarUrl,
          profilePhotoPath: profile?.profile_photo_path,
          profilePhotoBucket: profile?.profile_photo_bucket,
          adminProfile: adminProfile || null,
        },
      },
      { status: 200 },
    )
  } catch (error) {
    console.error('[ccht] Me error:', error)
    return NextResponse.json({ user: null }, { status: 200 })
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { firstName, lastName, middleName, phone, staffId, department, designation, qualification, specialization, employeeNumber, staffNumber, employmentType, dateJoined, officeLocation, officeHours, employmentStatus, canManageUsers, canManageContent, canManageAcademics, canManageFinance } = body

    // Update profiles table
    const profileUpdates: any = {}
    if (firstName !== undefined) profileUpdates.first_name = firstName
    if (lastName !== undefined) profileUpdates.last_name = lastName
    if (middleName !== undefined) profileUpdates.middle_name = middleName
    if (phone !== undefined) profileUpdates.phone = phone

    if (Object.keys(profileUpdates).length > 0) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', user.id)

      if (profileError) throw profileError
    }

    // Update admin_profiles table if user is an admin
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (existingProfile?.role === 'admin' || existingProfile?.role === 'super_admin') {
      const adminUpdates: any = {}
      if (staffId !== undefined) adminUpdates.staff_id = staffId
      if (department !== undefined) adminUpdates.department = department
      if (designation !== undefined) adminUpdates.designation = designation
      if (qualification !== undefined) adminUpdates.qualification = qualification
      if (specialization !== undefined) adminUpdates.specialization = specialization
      if (employeeNumber !== undefined) adminUpdates.employee_number = employeeNumber
      if (staffNumber !== undefined) adminUpdates.staff_number = staffNumber
      if (employmentType !== undefined) adminUpdates.employment_type = employmentType
      if (dateJoined !== undefined) adminUpdates.date_joined = dateJoined
      if (officeLocation !== undefined) adminUpdates.office_location = officeLocation
      if (officeHours !== undefined) adminUpdates.office_hours = officeHours
      if (employmentStatus !== undefined) adminUpdates.employment_status = employmentStatus
      if (canManageUsers !== undefined) adminUpdates.can_manage_users = canManageUsers
      if (canManageContent !== undefined) adminUpdates.can_manage_content = canManageContent
      if (canManageAcademics !== undefined) adminUpdates.can_manage_academics = canManageAcademics
      if (canManageFinance !== undefined) adminUpdates.can_manage_finance = canManageFinance

      if (Object.keys(adminUpdates).length > 0) {
        const { error: adminError } = await supabase
          .from('admin_profiles')
          .upsert({
            profile_id: user.id,
            ...adminUpdates
          })

        if (adminError) throw adminError
      }
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('[ccht] Update profile error:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}