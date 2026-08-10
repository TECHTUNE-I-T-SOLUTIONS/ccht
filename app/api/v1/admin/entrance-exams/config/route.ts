import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const admin = createAdminClient()
    
    const { data: configs, error } = await admin
      .from('entrance_exam_config')
      .select(`
        *,
        creator:profiles(first_name, last_name),
        questions:exam_questions(id)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[admin/entrance-exams/config] Error fetching configs:', error)
      return NextResponse.json({ error: 'Failed to fetch entrance exam configurations' }, { status: 500 })
    }

    // Format data to include question count
    const formattedData = (configs || []).map(config => ({
      ...config,
      question_count: config.questions?.length || 0
    }))

    return NextResponse.json({ success: true, data: formattedData })
  } catch (error) {
    console.error('[admin/entrance-exams/config] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()
    const body = await request.json()
    
    const { data: config, error } = await admin
      .from('entrance_exam_config')
      .insert({
        exam_name: body.exam_name,
        exam_description: body.exam_description,
        duration_minutes: body.duration_minutes || 10,
        total_questions: body.total_questions || 4,
        passing_score: body.passing_score || 50,
        instructions: body.instructions,
        is_active: body.is_active ?? true,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('[admin/entrance-exams/config] Error creating config:', error)
      return NextResponse.json({ error: 'Failed to create entrance exam configuration' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: config }, { status: 201 })
  } catch (error) {
    console.error('[admin/entrance-exams/config] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
