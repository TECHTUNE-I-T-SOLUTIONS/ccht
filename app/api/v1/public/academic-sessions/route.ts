import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const admin = createAdminClient()
    
    const { data, error } = await admin
      .from('academic_sessions')
      .select('id, name, is_current')
      .eq('is_active', true)
      .order('name', { ascending: false })

    if (error) {
      console.error('Failed to fetch academic sessions:', error)
      return NextResponse.json({ error: 'Failed to fetch academic sessions' }, { status: 500 })
    }

    return NextResponse.json({ sessions: data || [] })
  } catch (error) {
    console.error('Error in academic sessions API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
