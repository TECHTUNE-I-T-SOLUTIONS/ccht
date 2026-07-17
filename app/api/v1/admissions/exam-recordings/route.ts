import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { sessionId, recordingUrl, recordingDurationSeconds, fileSizeBytes, storageProvider } = body

    if (!sessionId || !recordingUrl) {
      return NextResponse.json({ error: 'sessionId and recordingUrl are required' }, { status: 400 })
    }

    // Verify the session belongs to the user
    const { data: session, error: sessionError } = await supabase
      .from('exam_sessions')
      .select('id, aspirant_id')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session || session.aspirant_id !== user.id) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 403 })
    }

    // Insert recording
    const { data: recording, error: recordingError } = await supabase
      .from('exam_recordings')
      .insert({
        session_id: sessionId,
        recording_url: recordingUrl,
        recording_duration_seconds: recordingDurationSeconds || 0,
        file_size_bytes: fileSizeBytes || 0,
        storage_provider: storageProvider || 'cloudinary',
        status: 'available',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      })
      .select()
      .single()

    if (recordingError) {
      console.error('Failed to save recording:', recordingError)
      return NextResponse.json({ error: 'Failed to save recording' }, { status: 500 })
    }

    return NextResponse.json({ data: recording }, { status: 201 })
  } catch (error) {
    console.error('Save recording error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 })
    }

    // Verify the session belongs to the user
    const { data: session, error: sessionError } = await supabase
      .from('exam_sessions')
      .select('id, aspirant_id')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session || session.aspirant_id !== user.id) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 403 })
    }

    const { data: recordings, error: recordingsError } = await supabase
      .from('exam_recordings')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })

    if (recordingsError) {
      console.error('Failed to fetch recordings:', recordingsError)
      return NextResponse.json({ error: 'Failed to fetch recordings' }, { status: 500 })
    }

    return NextResponse.json({ data: recordings || [] })
  } catch (error) {
    console.error('Fetch recordings error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}