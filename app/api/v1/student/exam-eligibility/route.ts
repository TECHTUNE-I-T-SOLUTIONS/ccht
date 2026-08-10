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
    const sessionId = searchParams.get('sessionId')
    const courseId = searchParams.get('courseId')

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
    }

    let eligibilityResult

    if (courseId) {
      // Check eligibility for specific course
      const { data, error } = await supabase
        .rpc('check_student_exam_eligibility', {
          p_student_id: user.id,
          p_course_id: courseId,
          p_session_id: sessionId
        })

      if (error) {
        console.error('Exam eligibility check error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      eligibilityResult = data?.[0] || null
    } else {
      // Check overall session eligibility
      const { data, error } = await supabase
        .rpc('check_student_session_eligibility', {
          p_student_id: user.id,
          p_session_id: sessionId
        })

      if (error) {
        console.error('Session eligibility check error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      eligibilityResult = data?.[0] || null
    }

    return NextResponse.json({ data: eligibilityResult })
  } catch (error: any) {
    console.error('Exam eligibility API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}