import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AdmissionService } from '@/lib/services/admission.service'

export async function POST(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Passport photo is required' }, { status: 400 })
    }

    const uploaded = await AdmissionService.uploadProfilePhotoForUser(userId, user.id, file)
    return NextResponse.json({ success: true, data: uploaded }, { status: 201 })
  } catch (error) {
    console.error('[admin/users/profile-photo] upload error:', error)
    return NextResponse.json({ error: 'Failed to upload profile photo' }, { status: 500 })
  }
}
