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

    // Use admin client to get all sessions with aspirant information
    const adminSupabase = createAdminClient()
    const { data: sessions, error: sessionsError } = await adminSupabase
      .from('exam_sessions')
      .select(`
        *,
        profiles (
          first_name,
          last_name,
          email
        )
      `)
      .order('started_at', { ascending: false })

    if (sessionsError) {
      console.error('Failed to fetch exam sessions:', sessionsError)
      return NextResponse.json({ error: 'Failed to fetch exam sessions' }, { status: 500 })
    }

    // Format the response to include aspirant name and email
    const formattedSessions = sessions?.map((session: any) => ({
      ...session,
      aspirant_name: session.profiles ? `${session.profiles.first_name} ${session.profiles.last_name}` : null,
      aspirant_email: session.profiles?.email || null,
    })) || []

    return NextResponse.json({ data: formattedSessions })
  } catch (error) {
    console.error('Fetch exam sessions error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}