import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const admin = createAdminClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Get the active exam configuration
    const { data: activeConfig, error: configError } = await admin
      .from('entrance_exam_config')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (configError || !activeConfig) {
      return NextResponse.json({ error: 'No active exam configuration found' }, { status: 404 })
    }

    // Get questions for the active config
    const { data: questions, error: questionsError } = await admin
      .from('exam_questions')
      .select('*')
      .eq('exam_config_id', activeConfig.id)
      .eq('is_active', true)
      .order('question_order', { ascending: true })

    if (questionsError) {
      console.error('[aspirant/exams/questions] Error fetching questions:', questionsError)
      return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 })
    }

    // Return questions with config metadata
    return NextResponse.json({ 
      data: {
        config: activeConfig,
        questions: questions || []
      }
    })
  } catch (error) {
    console.error('[aspirant/exams/questions] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
