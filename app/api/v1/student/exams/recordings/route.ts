import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()
    const body = await request.json()

    // Validate recording_type against schema: ['video', 'audio', 'screen', 'webcam']
    const validTypes = ['video', 'audio', 'screen', 'webcam']
    const recordingType = body.recordingType || 'video'
    
    if (!validTypes.includes(recordingType)) {
      return NextResponse.json({ error: `Invalid recording type. Must be one of: ${validTypes.join(', ')}` }, { status: 400 })
    }

    // Validate status against schema: ['processing', 'completed', 'failed', 'deleted']
    const validStatuses = ['processing', 'completed', 'failed', 'deleted']
    const status = body.status || 'completed'
    
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }, { status: 400 })
    }

    const { data: recording, error } = await admin
      .from('student_exam_recordings')
      .insert({
        exam_attempt_id: body.examAttemptId,
        recording_type: recordingType,
        storage_url: body.storageUrl,
        duration_seconds: body.durationSeconds || 0,
        file_size_bytes: body.fileSizeBytes,
        mime_type: body.mimeType || 'video/webm',
        started_at: body.startedAt || new Date().toISOString(),
        ended_at: new Date().toISOString(),
        status: status,
        metadata: body.metadata || {},
      })
      .select()
      .single()

    if (error) {
      console.error('[student/exams/recordings] Error creating recording:', error)
      return NextResponse.json({ error: 'Failed to save recording' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: recording }, { status: 201 })
  } catch (error) {
    console.error('[student/exams/recordings] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const admin = createAdminClient()
    const examAttemptId = request.nextUrl.searchParams.get('examAttemptId')

    if (!examAttemptId) {
      return NextResponse.json({ error: 'examAttemptId is required' }, { status: 400 })
    }

    const { data: recordings, error } = await admin
      .from('student_exam_recordings')
      .select('*')
      .eq('exam_attempt_id', examAttemptId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[student/exams/recordings] Error fetching recordings:', error)
      return NextResponse.json({ error: 'Failed to fetch recordings' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: recordings || [] })
  } catch (error) {
    console.error('[student/exams/recordings] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}