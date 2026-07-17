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

    // Use admin client to get all violations
    const adminSupabase = createAdminClient()
    const { data: violations, error: violationsError } = await adminSupabase
      .from('exam_violations')
      .select('*')
      .order('timestamp', { ascending: false })

    if (violationsError) {
      console.error('Failed to fetch violations:', violationsError)
      return NextResponse.json({ error: 'Failed to fetch violations' }, { status: 500 })
    }

    return NextResponse.json({ data: violations || [] })
  } catch (error) {
    console.error('Fetch violations error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}