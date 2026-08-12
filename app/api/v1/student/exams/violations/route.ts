import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getNigerianTime } from '@/lib/timezone'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { examAttemptId, violationType, severity, details, screenshotUrl, deviceFingerprint } = body

    if (!examAttemptId || !violationType) {
      return NextResponse.json({ error: 'Exam attempt ID and violation type are required' }, { status: 400 })
    }

    const admin = createAdminClient()
    
    // Log the violation to student_exam_violations
    const { data: violation, error: violationError } = await admin
      .from('student_exam_violations')
      .insert({
        exam_attempt_id: examAttemptId,
        violation_type: violationType,
        severity: severity || 'warning',
        description: details || violationType,
        timestamp: getNigerianTime().toISOString(),
      })
      .select()
      .single()

    if (violationError) {
      console.error('Error logging violation:', violationError)
      return NextResponse.json(
        { error: violationError.message || 'Failed to log violation' },
        { status: 500 },
      )
    }

    // Also log to proctoring_logs table for broader tracking
    const { error: proctoringError } = await admin
      .from('proctoring_logs')
      .insert({
        aspirant_id: user.id,
        event_type: violationType,
        violation_details: details || violationType,
        screenshot_url: screenshotUrl || null,
        device_fingerprint: deviceFingerprint || null,
      })

    if (proctoringError) {
      console.error('Error logging to proctoring_logs:', proctoringError)
    }

    // Count violations for this attempt
    const { count: violationCount, error: countError } = await admin
      .from('student_exam_violations')
      .select('*', { count: 'exact', head: true })
      .eq('exam_attempt_id', examAttemptId)

    if (countError) {
      console.error('Error counting violations:', countError)
    }

    // Check if max violations reached (auto-submit if too many critical violations)
    const maxViolations = 5
    const maxViolationsReached = (violationCount || 0) >= maxViolations

    return NextResponse.json({ 
      success: true, 
      data: violation,
      violationCount: violationCount || 0,
      maxViolationsReached
    })
  } catch (error: any) {
    console.error('Error logging violation:', error)
    return NextResponse.json({ error: error?.message || 'Failed to log violation' }, { status: 500 })
  }
}
