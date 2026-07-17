import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('screening_exams')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[Screening Exams GET]', error)
      return NextResponse.json({ data: [] }, { status: 200 })
    }

    return NextResponse.json({ data: data || [] })
  } catch (error) {
    console.error('[Screening Exams GET]', error)
    return NextResponse.json({ data: [] }, { status: 200 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const admin = createAdminClient()

    const { data, error } = await admin
      .from('screening_exams')
      .insert({
        exam_name: body.exam_name,
        exam_description: body.exam_description,
        exam_date: body.exam_date || null,
        duration_minutes: body.duration_minutes,
        total_questions: body.total_questions,
        passing_score: body.passing_score,
        instructions: body.instructions || null,
        is_active: body.is_active ?? true,
      })
      .select()
      .single()

    if (error) {
      console.error('[Screening Exams POST]', error)
      return NextResponse.json(
        { error: 'Failed to create screening exam' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('[Screening Exams POST]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
