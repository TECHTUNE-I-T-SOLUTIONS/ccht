import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      console.log('[Aspirant Notifications] No user found')
      return NextResponse.json({ data: [] }, { status: 200 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .single()

    console.log('[Aspirant Notifications] User profile:', profile)

    // Allow aspirants and students who have aspirant profiles to see notifications
    const role = profile?.role || user.user_metadata?.role
    if (role !== 'aspirant' && role !== 'student') {
      console.log('[Aspirant Notifications] User is not an aspirant or student')
      return NextResponse.json({ data: [] }, { status: 200 })
    }

    // For students, check if they have an aspirant profile
    if (role === 'student') {
      const { data: aspirantProfile } = await supabase
        .from('aspirant_profiles')
        .select('profile_id')
        .eq('profile_id', user.id)
        .maybeSingle()
      
      if (!aspirantProfile) {
        console.log('[Aspirant Notifications] Student has no aspirant profile')
        return NextResponse.json({ data: [] }, { status: 200 })
      }
    }

    const { data, error } = await supabase
      .from('aspirant_notifications')
      .select('id, title, message, notification_type, category, deep_link, is_read, priority, created_at')
      .eq('aspirant_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('[Aspirant Notifications] Query error:', error)
      throw error
    }

    console.log('[Aspirant Notifications] Fetched notifications:', data?.length || 0)
    return NextResponse.json({ data: data || [] }, { status: 200 })
  } catch (error) {
    console.error('[Aspirant Notifications] Error:', error)
    return NextResponse.json({ data: [] }, { status: 200 })
  }
}
