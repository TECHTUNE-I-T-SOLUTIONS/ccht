import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { examAttemptId, timeSpentSeconds } = body

    if (!examAttemptId) {
      return NextResponse.json({ error: 'Exam attempt ID is required' }, { status: 400 })
    }

    const admin = createAdminClient()
    
    const { data: attempt, error } = await admin
      .from('student_exam_attempts')
      .update({
        time_spent_seconds: timeSpentSeconds,
      })
      .eq('id', examAttemptId)
      .eq('student_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating time:', error)
      return NextResponse.json({ error: 'Failed to update time' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: attempt })
  } catch (error: any) {
    console.error('Error updating time:', error)
    return NextResponse.json({ error: error?.message || 'Failed to update time' }, { status: 500 })
  }
}