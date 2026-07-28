import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

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
    
    // Get questions for this exam
    const { data: questions, error: questionsError } = await admin
      .from('student_exam_questions')
      .select('*')
      .eq('exam_session_id', id)
      .eq('is_active', true)
      .order('question_number', { ascending: true })

    if (questionsError) {
      console.error('Error fetching questions:', questionsError)
      return NextResponse.json({ error: 'Failed to load questions' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      data: questions || []
    })
  } catch (error: any) {
    console.error('Error fetching questions:', error)
    return NextResponse.json({ error: error?.message || 'Failed to load questions' }, { status: 500 })
  }
}