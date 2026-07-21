import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const adminSupabase = createAdminClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is teacher
    const { data: teacherProfile } = await supabase
      .from('teacher_profiles')
      .select('profile_id, department_id')
      .eq('profile_id', user.id)
      .single()

    if (!teacherProfile) {
      return NextResponse.json({ error: 'Forbidden - Teacher access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'pending'
    const session = searchParams.get('session') || '2026/2027'

    // Get course selections for teacher's department
    const { data: selections, error } = await adminSupabase
      .from('selected_courses')
      .select(`
        *,
        course:courses(*, department:departments(name)),
        student:profiles(first_name, last_name, email),
        enrollment:enrollments(*, program:programs(title))
      `)
      .eq('session', session)
      .eq('status', status)
      .order('selected_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Filter by teacher's department
    const filteredSelections = selections?.filter((selection: any) => 
      selection.course?.department_id === teacherProfile.department_id
    ) || []

    return NextResponse.json({ data: filteredSelections })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const adminSupabase = createAdminClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is teacher
    const { data: teacherProfile } = await supabase
      .from('teacher_profiles')
      .select('profile_id, department_id')
      .eq('profile_id', user.id)
      .single()

    if (!teacherProfile) {
      return NextResponse.json({ error: 'Forbidden - Teacher access required' }, { status: 403 })
    }

    const body = await request.json()
    const { selectionIds, status, reviewNotes } = body

    if (!selectionIds || !Array.isArray(selectionIds) || selectionIds.length === 0) {
      return NextResponse.json({ error: 'Selection IDs are required' }, { status: 400 })
    }

    if (!status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Valid status (approved/rejected) is required' }, { status: 400 })
    }

    // Verify that all selections belong to teacher's department
    const { data: selections } = await adminSupabase
      .from('selected_courses')
      .select('course:courses(department_id)')
      .in('id', selectionIds)

    const invalidSelections = selections?.filter((s: any) => 
      s.course?.department_id !== teacherProfile.department_id
    )

    if (invalidSelections && invalidSelections.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot approve courses from other departments' 
      }, { status: 403 })
    }

    const updateData: any = {
      status,
      reviewed_by: teacherProfile.profile_id,
      reviewed_at: new Date().toISOString(),
    }

    if (reviewNotes) {
      updateData.review_notes = reviewNotes
    }

    const { error } = await adminSupabase
      .from('selected_courses')
      .update(updateData)
      .in('id', selectionIds)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      message: `Course selections ${status} successfully`,
      data: { updatedCount: selectionIds.length }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
