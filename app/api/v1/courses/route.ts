import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const level = searchParams.get('level')
    const programId = searchParams.get('program_id')
    
    const admin = createAdminClient()
    let query = admin
      .from('courses')
      .select('id, code, title, level, semester, program_id, program:programs(id, title, department:departments(id, name))')
      .eq('is_active', true)
    
    if (level) {
      query = query.eq('level', level)
    }
    if (programId) {
      query = query.eq('program_id', programId)
    }
    
    const { data, error } = await query.order('code', { ascending: true })
    
    if (error) throw new Error(error.message)
    return NextResponse.json({ data: data || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to load courses' }, { status: 500 })
  }
}
