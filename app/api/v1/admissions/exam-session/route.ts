import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AdmissionService } from '@/lib/services/admission.service'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { examType, academicYear, examConfigId } = body

    // Create exam session
    const insertData: any = {
      aspirant_id: user.id,
      exam_type: examType || 'Entrance Examination',
      academic_year: academicYear || String(new Date().getFullYear()),
      status: 'in_progress',
    }
    
    if (examConfigId) {
      insertData.exam_config_id = examConfigId
    }

    const { data: session, error: sessionError } = await supabase
      .from('exam_sessions')
      .insert(insertData)
      .select()
      .single()

    if (sessionError) {
      console.error('Failed to create exam session:', sessionError)
      return NextResponse.json({ error: 'Failed to create exam session' }, { status: 500 })
    }

    return NextResponse.json({ data: session }, { status: 201 })
  } catch (error) {
    console.error('Exam session creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { sessionId, score, totalQuestions, percentage, status, submittedAt, timeSpentSeconds, examType, academicYear } = body

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 })
    }

    // Verify the session belongs to the user
    const { data: session, error: sessionError } = await supabase
      .from('exam_sessions')
      .select('id, aspirant_id')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session || session.aspirant_id !== user.id) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 403 })
    }

    // Update session
    const updateData: any = {}
    if (score !== undefined) updateData.score = score
    if (totalQuestions !== undefined) updateData.total_questions = totalQuestions
    if (percentage !== undefined) updateData.percentage = percentage
    if (status !== undefined) updateData.status = status
    if (submittedAt !== undefined) updateData.submitted_at = submittedAt
    if (timeSpentSeconds !== undefined) updateData.time_spent_seconds = timeSpentSeconds
    if (examType !== undefined) updateData.exam_type = examType
    if (academicYear !== undefined) updateData.academic_year = academicYear

    const { data: updatedSession, error: updateError } = await supabase
      .from('exam_sessions')
      .update(updateData)
      .eq('id', sessionId)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to update exam session:', updateError)
      return NextResponse.json({ error: 'Failed to update exam session' }, { status: 500 })
    }

    // Update aspirant profile progress when exam is submitted
    if (status === 'submitted') {
      try {
        await AdmissionService.updateProfileProgress(session.aspirant_id, session.aspirant_id)
      } catch (progressError) {
        console.error('Failed to update profile progress after exam:', progressError)
      }
    }

    return NextResponse.json({ data: updatedSession })
  } catch (error) {
    console.error('Update exam session error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: sessions, error: sessionsError } = await supabase
      .from('exam_sessions')
      .select('*')
      .eq('aspirant_id', user.id)
      .order('started_at', { ascending: false })

    if (sessionsError) {
      console.error('Failed to fetch exam sessions:', sessionsError)
      return NextResponse.json({ error: 'Failed to fetch exam sessions' }, { status: 500 })
    }

    return NextResponse.json({ data: sessions || [] })
  } catch (error) {
    console.error('Fetch exam sessions error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
