import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()

    const { data: enrollment, error } = await admin
      .from('enrollments')
      .select('*')
      .eq('student_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found - this is ok
      console.error('Error fetching enrollment:', error)
      return NextResponse.json({ error: 'Failed to fetch enrollment' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: enrollment || null })
  } catch (error: any) {
    console.error('Error fetching enrollment:', error)
    return NextResponse.json({ error: error?.message || 'Failed to fetch enrollment' }, { status: 500 })
  }
}
