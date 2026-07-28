import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { examSessionId, enrollmentId } = body

    if (!examSessionId) {
      return NextResponse.json({ error: 'Exam session ID is required' }, { status: 400 })
    }

    const admin = createAdminClient()
    
    // Check if there's an existing in-progress attempt for this exam and student
    const { data: existingAttempt, error: findError } = await admin
      .from('student_exam_attempts')
      .select('*')
      .eq('exam_session_id', examSessionId)
      .eq('student_id', user.id)
      .in('status', ['not_started', 'in_progress'])
      .order('attempt_number', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (findError) {
      console.error('Error finding existing attempt:', findError)
      return NextResponse.json({ error: 'Failed to check existing attempts' }, { status: 500 })
    }

    // If there's an existing in-progress attempt, resume it
    if (existingAttempt) {
      return NextResponse.json({ 
        success: true, 
        data: existingAttempt,
        resumed: true
      })
    }

    // Find the highest attempt number for this exam and student
    const { data: lastAttempt, error: lastError } = await admin
      .from('student_exam_attempts')
      .select('attempt_number')
      .eq('exam_session_id', examSessionId)
      .eq('student_id', user.id)
      .order('attempt_number', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (lastError) {
      console.error('Error finding last attempt:', lastError)
    }

    const nextAttemptNumber = (lastAttempt?.attempt_number || 0) + 1

    // Check max attempts (max 5)
    const maxAttempts = 5
    if (nextAttemptNumber > maxAttempts) {
      return NextResponse.json({ 
        error: `Maximum number of attempts (${maxAttempts}) reached for this exam` 
      }, { status: 400 })
    }

    // Create a new exam attempt
    const attemptData: any = {
      exam_session_id: examSessionId,
      student_id: user.id,
      attempt_number: nextAttemptNumber,
      status: 'in_progress',
      started_at: new Date().toISOString(),
    }

    // Include enrollment_id if available
    if (enrollmentId) {
      attemptData.enrollment_id = enrollmentId
    }

    const { data: attempt, error: attemptError } = await admin
      .from('student_exam_attempts')
      .insert(attemptData)
      .select()
      .single()

    if (attemptError) {
      console.error('Error creating attempt:', attemptError)
      return NextResponse.json({ error: 'Failed to create exam attempt' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      data: attempt,
      resumed: false
    })
  } catch (error: any) {
    console.error('Error creating attempt:', error)
    return NextResponse.json({ error: error?.message || 'Failed to create attempt' }, { status: 500 })
  }
}