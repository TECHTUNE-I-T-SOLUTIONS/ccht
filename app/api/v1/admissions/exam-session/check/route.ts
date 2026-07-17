import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has a submitted exam session
    const { data: examSession, error: sessionError } = await supabase
      .from('exam_sessions')
      .select('status')
      .eq('aspirant_id', user.id)
      .eq('status', 'submitted')
      .single()

    if (sessionError && sessionError.code !== 'PGRST116') {
      // PGRST116 is "not found", which is expected if no exam exists
      console.error('Error checking exam session:', sessionError)
      return NextResponse.json({ error: 'Failed to check exam status' }, { status: 500 })
    }

    const hasCompletedExam = !!examSession

    return NextResponse.json({ hasCompletedExam })
  } catch (error) {
    console.error('Error checking exam completion:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
