import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ user: null }, { status: 200 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name, role, avatar_url, profile_photo_path, profile_photo_bucket')
      .eq('id', user.id)
      .single()

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          firstName: profile?.first_name || user.user_metadata?.first_name || '',
          lastName: profile?.last_name || user.user_metadata?.last_name || '',
          role: profile?.role || user.user_metadata?.role || 'student',
          avatarUrl: profile?.avatar_url || profile?.profile_photo_path || '',
        },
      },
      { status: 200 },
    )
  } catch (error) {
    console.error('[ccht] Me error:', error)
    return NextResponse.json({ user: null }, { status: 200 })
  }
}
