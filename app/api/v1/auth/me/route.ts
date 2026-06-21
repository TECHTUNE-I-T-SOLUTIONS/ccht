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
      .select('id, email, first_name, last_name, phone, role, avatar_url, profile_photo_path, profile_photo_bucket')
      .eq('id', user.id)
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
          phone: profile?.phone || user.user_metadata?.phone || '',
          role: profile?.role || user.user_metadata?.role || 'student',
          avatarUrl,
        },
      },
      { status: 200 },
    )
  } catch (error) {
    console.error('[ccht] Me error:', error)
    return NextResponse.json({ user: null }, { status: 200 })
  }
}
