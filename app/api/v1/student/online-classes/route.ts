import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

// GET - Fetch online classes for the current student
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const admin = createAdminClient()
    
    // Get student's profile to find their program and level
    const { data: studentProfile, error: profileError } = await admin
      .from('student_profiles')
      .select('current_level, program_id')
      .eq('profile_id', user.id)
      .single()
    
    if (profileError || !studentProfile) {
      throw new Error('Student profile not found')
    }
    
    // Get online classes for courses in the student's program and level
    const { data, error } = await admin
      .from('online_classes')
      .select('id, course_id, teacher_id, day_of_week, start_time, end_time, meet_link, meet_link_display_name, notes, is_active, created_at, updated_at, course:courses(id, code, title, level, semester, program_id), teacher:profiles(id, first_name, last_name)')
      .eq('is_active', true)
      .order('day_of_week, start_time', { ascending: true })
    
    if (error) throw new Error(error.message)
    
    // Filter to only show classes for courses in student's program and level
    const filteredClasses = (data || []).filter((onlineClass: any) => {
      return onlineClass.course?.program_id === studentProfile.program_id &&
             onlineClass.course?.level === studentProfile.current_level
    })
    
    return NextResponse.json({ data: filteredClasses })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to load online classes' }, { status: 500 })
  }
}
