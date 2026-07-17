import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ data: [] }, { status: 200 })
    }

    const adminClient = createAdminClient()
    const { data: profile } = await adminClient
      .from('admin_profiles')
      .select('profile_id')
      .eq('profile_id', user.id)
      .maybeSingle()

    if (!profile?.profile_id) {
      return NextResponse.json({ data: [] }, { status: 200 })
    }

    const { data, error } = await adminClient
      .from('admin_notifications')
      .select('id, title, message, notification_type, category, deep_link, priority, is_read, read_at, created_at')
      .eq('admin_id', profile.profile_id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('[Admin Notifications GET]', error)
      return NextResponse.json({ data: [] }, { status: 200 })
    }

    return NextResponse.json({ data: data || [] }, { status: 200 })
  } catch (error) {
    console.error('[Admin Notifications GET]', error)
    return NextResponse.json({ data: [] }, { status: 200 })
  }
}