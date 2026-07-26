import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

// GET - Fetch online classes for the current teacher
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('course_id')
    
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const admin = createAdminClient()
    let query = admin
      .from('online_classes')
      .select('id, course_id, teacher_id, day_of_week, start_time, end_time, meet_link, meet_link_display_name, notes, is_active, class_date, created_at, updated_at, course:courses(id, code, title)')
      .eq('teacher_id', user.id)
      .eq('is_active', true)
      .order('class_date, day_of_week, start_time', { ascending: true })
    
    if (courseId) {
      query = query.eq('course_id', courseId)
    }
    
    const { data, error } = await query
    
    if (error) throw new Error(error.message)
    return NextResponse.json({ data: data || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to load online classes' }, { status: 500 })
  }
}

// POST - Create a new online class
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('online_classes')
      .insert({
        ...body,
        teacher_id: user.id,
      })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return NextResponse.json({ data })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to create online class' }, { status: 500 })
  }
}
