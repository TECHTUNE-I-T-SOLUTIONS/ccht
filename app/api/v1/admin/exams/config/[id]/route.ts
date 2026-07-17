import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const admin = createAdminClient()
    
    const { data: config, error } = await admin
      .from('entrance_exam_config')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !config) {
      return NextResponse.json({ error: 'Exam configuration not found' }, { status: 404 })
    }

    return NextResponse.json({ data: config })
  } catch (error) {
    console.error('[admin/exams/config] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const admin = createAdminClient()
    const body = await request.json()
    
    const { data: config, error } = await admin
      .from('entrance_exam_config')
      .update({
        exam_name: body.exam_name,
        exam_description: body.exam_description,
        duration_minutes: body.duration_minutes,
        total_questions: body.total_questions,
        passing_score: body.passing_score,
        instructions: body.instructions,
        is_active: body.is_active,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[admin/exams/config] Error updating config:', error)
      return NextResponse.json({ error: 'Failed to update exam configuration' }, { status: 500 })
    }

    return NextResponse.json({ data: config })
  } catch (error) {
    console.error('[admin/exams/config] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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
      .from('entrance_exam_config')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[admin/exams/config] Error deleting config:', error)
      return NextResponse.json({ error: 'Failed to delete exam configuration' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[admin/exams/config] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}