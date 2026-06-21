import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ data: [] }, { status: 200 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .single()

    if ((profile?.role || user.user_metadata?.role) !== 'aspirant') {
      return NextResponse.json({ data: [] }, { status: 200 })
    }

    const { data, error } = await supabase
      .from('aspirant_notifications')
      .select('id, title, message, notification_type, category, deep_link, is_read, priority, created_at')
      .eq('aspirant_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      throw error
    }

    return NextResponse.json({ data: data || [] }, { status: 200 })
  } catch (error) {
    console.error('[ccht] Aspirant notifications error:', error)
    return NextResponse.json({ data: [] }, { status: 200 })
  }
}
