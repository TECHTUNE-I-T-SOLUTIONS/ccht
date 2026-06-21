import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AdmissionService } from '@/lib/services/admission.service'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Passport photo is required' }, { status: 400 })
    }

    const { data: profile } = await supabase
      .from('aspirant_profiles')
      .select('profile_id')
      .eq('profile_id', user.id)
      .maybeSingle()

    if (!profile) {
      return NextResponse.json({ error: 'Aspirant profile not found' }, { status: 404 })
    }

    const uploaded = await AdmissionService.uploadProfilePhoto(user.id, file, user.id)

    return NextResponse.json({ success: true, data: uploaded }, { status: 201 })
  } catch (error) {
    console.error('[admissions/profile-photo] upload error:', error)
    return NextResponse.json({ error: 'Failed to upload passport photo' }, { status: 500 })
  }
}
