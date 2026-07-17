import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Use admin client to get all recordings
    const adminSupabase = createAdminClient()
    const { data: recordings, error: recordingsError } = await adminSupabase
      .from('exam_recordings')
      .select('*')
      .order('created_at', { ascending: false })

    if (recordingsError) {
      console.error('Failed to fetch recordings:', recordingsError)
      return NextResponse.json({ error: 'Failed to fetch recordings' }, { status: 500 })
    }

    return NextResponse.json({ data: recordings || [] })
  } catch (error) {
    console.error('Fetch recordings error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}