import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const admin = createAdminClient()
    
    const { data: configs, error } = await admin
      .from('entrance_exam_config')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[admin/exams/config] Error fetching configs:', error)
      return NextResponse.json({ error: 'Failed to fetch exam configurations' }, { status: 500 })
    }

    return NextResponse.json({ data: configs || [] })
  } catch (error) {
    console.error('[admin/exams/config] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = createAdminClient()
    const body = await request.json()
    
    const { data: config, error } = await admin
      .from('entrance_exam_config')
      .insert({
        exam_name: body.exam_name,
        exam_description: body.exam_description,
        duration_minutes: body.duration_minutes,
        total_questions: body.total_questions,
        passing_score: body.passing_score,
        instructions: body.instructions,
        is_active: body.is_active ?? true,
      })
      .select()
      .single()

    if (error) {
      console.error('[admin/exams/config] Error creating config:', error)
      return NextResponse.json({ error: 'Failed to create exam configuration' }, { status: 500 })
    }

    return NextResponse.json({ data: config }, { status: 201 })
  } catch (error) {
    console.error('[admin/exams/config] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}