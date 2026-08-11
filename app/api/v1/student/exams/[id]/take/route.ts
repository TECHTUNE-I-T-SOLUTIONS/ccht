import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getNigerianTime } from '@/lib/timezone'

export const runtime = 'nodejs'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()
    
    // Get exam session details
    const { data: exam, error: examError } = await admin
      .from('student_exam_sessions')
      .select(`
        *,
        course:courses(code, title),
        session:academic_sessions(name),
        semester:academic_semesters(semester_name)
      `)
      .eq('id', id)
      .eq('is_published', true)
      .single()

    if (examError || !exam) {
      return NextResponse.json({ error: 'Exam not found or not published' }, { status: 404 })
    }

    // Check if exam is currently available (using Nigerian time)
    const now = getNigerianTime()
    const startDate = new Date(exam.start_date)
    const endDate = new Date(exam.end_date)

    if (now < startDate) {
      return NextResponse.json({ 
        error: 'Exam has not started yet',
        startDate: exam.start_date 
      }, { status: 403 })
    }

    if (now > endDate) {
      return NextResponse.json({ error: 'Exam has ended' }, { status: 403 })
    }

    // Check exam eligibility (fees paid and courses approved)
    if (exam.session_id && exam.course_id) {
      const { data: eligibilityResult } = await admin
        .rpc('check_student_exam_eligibility', {
          student_id: user.id,
          course_id: exam.course_id,
          session_id: exam.session_id
        })

      const eligibility = eligibilityResult && eligibilityResult.length > 0 ? eligibilityResult[0] : null
      
      if (eligibility && !eligibility.is_eligible) {
        return NextResponse.json({ 
          error: eligibility.message || 'You are not eligible to take this exam',
          eligibility: eligibility
        }, { status: 403 })
      }
    }

    // Check if student has an active attempt
    const { data: attempts } = await admin
      .from('student_exam_attempts')
      .select('*')
      .eq('exam_session_id', id)
      .eq('student_id', user.id)
      .in('status', ['not_started', 'in_progress'])

    if (attempts && attempts.length > 0) {
      // Student has an active attempt, allow them to continue
      return NextResponse.json({ 
        success: true, 
        data: exam,
        attempt: attempts[0]
      })
    }

    // Check if student has already completed this exam
    const { data: completedAttempts } = await admin
      .from('student_exam_attempts')
      .select('*')
      .eq('exam_session_id', id)
      .eq('student_id', user.id)
      .in('status', ['submitted', 'graded'])

    if (completedAttempts && completedAttempts.length > 0) {
      return NextResponse.json({ 
        error: 'You have already completed this exam',
        attempt: completedAttempts[0]
      }, { status: 403 })
    }

    return NextResponse.json({ success: true, data: exam })
  } catch (error: any) {
    console.error('Error fetching exam:', error)
    return NextResponse.json({ error: error?.message || 'Failed to load exam' }, { status: 500 })
  }
}