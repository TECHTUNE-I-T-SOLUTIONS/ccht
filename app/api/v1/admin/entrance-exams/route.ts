import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const admin = createAdminClient()
    
    const { data, error } = await admin
      .from('entrance_exam_config')
      .select(`
        *,
        creator:profiles(first_name, last_name),
        questions:exam_questions(id)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Format the data to include question count
    const formattedData = (data || []).map(exam => ({
      id: exam.id,
      title: exam.exam_name,
      description: exam.exam_description,
      duration_minutes: exam.duration_minutes,
      passing_score: exam.passing_score,
      instructions: exam.instructions,
      is_active: exam.is_active,
      created_at: exam.created_at,
      question_count: exam.questions?.length || 0,
      creator: exam.creator,
      creator_role: 'admin'
    }))

    return NextResponse.json({ success: true, data: formattedData })
  } catch (error: any) {
    console.error('Error fetching entrance exams:', error)
    return NextResponse.json({ error: error?.message || 'Failed to load entrance exams' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()
    const body = await request.json()

    if (!body.exam_name) {
      return NextResponse.json({ error: 'exam_name is required' }, { status: 400 })
    }

    const { data, error } = await admin
      .from('entrance_exam_config')
      .insert({
        exam_name: body.exam_name,
        exam_description: body.exam_description,
        duration_minutes: body.duration_minutes || 10,
        total_questions: body.total_questions || 4,
        passing_score: body.passing_score || 50,
        is_active: body.is_active ?? true,
        instructions: body.instructions,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data, message: 'Entrance exam created successfully' })
  } catch (error: any) {
    console.error('Entrance exam creation error:', error)
    return NextResponse.json({ error: error?.message || 'Failed to create entrance exam' }, { status: 500 })
  }
}
