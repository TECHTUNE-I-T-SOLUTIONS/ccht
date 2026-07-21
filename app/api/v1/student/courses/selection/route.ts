import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const session = searchParams.get('session') || '2026/2027'
    const semester = searchParams.get('semester') || 'all'

    let query = supabase
      .from('selected_courses')
      .select('*, course:courses(*), enrollment:enrollments(*, program:programs(*))')
      .eq('student_id', user.id)
      .eq('session', session)

    if (semester !== 'all') {
      query = query.eq('semester', semester)
    }

    const { data: selectedCourses, error } = await query.order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: selectedCourses || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { courseIds, enrollmentId, session, semester } = body

    if (!courseIds || !Array.isArray(courseIds) || courseIds.length === 0) {
      return NextResponse.json({ error: 'Course IDs are required' }, { status: 400 })
    }

    if (!session || !semester) {
      return NextResponse.json({ error: 'Session and semester are required' }, { status: 400 })
    }

    // Check if there are already approved courses for this session
    const { data: existingApproved } = await supabase
      .from('selected_courses')
      .select('id')
      .eq('student_id', user.id)
      .eq('session', session)
      .eq('status', 'approved')
      .limit(1)

    if (existingApproved && existingApproved.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot modify course selection. Courses have already been approved for this session.' 
      }, { status: 400 })
    }

    // Delete existing pending selections for this session/semester
    await supabase
      .from('selected_courses')
      .delete()
      .eq('student_id', user.id)
      .eq('session', session)
      .eq('semester', semester)
      .eq('status', 'pending')

    // Insert new selections
    const selections = courseIds.map((courseId: string) => ({
      student_id: user.id,
      course_id: courseId,
      enrollment_id: enrollmentId || null,
      session,
      semester,
      status: 'pending'
    }))

    const { data, error } = await supabase
      .from('selected_courses')
      .insert(selections)
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data, message: 'Course selection submitted successfully' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const selectionId = searchParams.get('id')

    if (!selectionId) {
      return NextResponse.json({ error: 'Selection ID is required' }, { status: 400 })
    }

    // Check if the selection belongs to the user and is pending
    const { data: selection } = await supabase
      .from('selected_courses')
      .select('status')
      .eq('id', selectionId)
      .eq('student_id', user.id)
      .single()

    if (!selection) {
      return NextResponse.json({ error: 'Selection not found' }, { status: 404 })
    }

    if (selection.status !== 'pending') {
      return NextResponse.json({ 
        error: 'Cannot delete selection. Only pending selections can be removed.' 
      }, { status: 400 })
    }

    const { error } = await supabase
      .from('selected_courses')
      .delete()
      .eq('id', selectionId)
      .eq('student_id', user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Selection removed successfully' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
