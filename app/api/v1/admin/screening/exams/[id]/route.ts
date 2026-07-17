import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const admin = createAdminClient()

    const { data, error } = await admin
      .from('screening_exams')
      .update({
        exam_name: body.exam_name,
        exam_description: body.exam_description,
        exam_date: body.exam_date || null,
        duration_minutes: body.duration_minutes,
        total_questions: body.total_questions,
        passing_score: body.passing_score,
        instructions: body.instructions || null,
        is_active: body.is_active ?? true,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[Screening Exams PUT]', error)
      return NextResponse.json(
        { error: 'Failed to update screening exam' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('[Screening Exams PUT]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const admin = createAdminClient()

    const { error } = await admin
      .from('screening_exams')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[Screening Exams DELETE]', error)
      return NextResponse.json(
        { error: 'Failed to delete screening exam' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Screening Exams DELETE]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
