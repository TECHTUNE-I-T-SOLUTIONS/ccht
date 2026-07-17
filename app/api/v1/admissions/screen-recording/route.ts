import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { uploadFileToCloudinary } from '@/lib/cloudinary'

async function getAuthenticatedUser() {
  const supabase = await createClient()
  let retries = 3
  let lastError: any = null

  for (let i = 0; i < retries; i++) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      return user
    } catch (err: any) {
      lastError = err
      if (
        err?.code === 'EAI_AGAIN' ||
        err?.code === 'ENOTFOUND' ||
        err?.cause?.code === 'EAI_AGAIN'
      ) {
        console.error(`[auth] getUser attempt ${i + 1} failed (network error):`, err.message)
        if (i < retries - 1) {
          await new Promise((resolve) => setTimeout(resolve, 2000 * (i + 1)))
          continue
        }
      }
      throw err
    }
  }
  throw lastError
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file')
    const sessionId = formData.get('sessionId')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Recording file is required' }, { status: 400 })
    }

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
    }

    // Verify the session belongs to the user
    const supabase = await createClient()
    const { data: session, error: sessionError } = await supabase
      .from('exam_sessions')
      .select('id, aspirant_id')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session || session.aspirant_id !== user.id) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 403 })
    }

    // Upload to Cloudinary
    const result = await uploadFileToCloudinary(file, {
      folder: `exam-recordings/${user.id}`,
      resourceType: 'auto',
    })

    // Save recording metadata
    const { data: recording, error: recordingError } = await supabase
      .from('exam_recordings')
      .insert({
        session_id: sessionId,
        recording_url: result.secure_url,
        recording_duration_seconds: 0, // Will be updated by client
        file_size_bytes: file.size,
        storage_provider: 'cloudinary',
        status: 'available',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      })
      .select()
      .single()

    if (recordingError) {
      console.error('Failed to save recording:', recordingError)
      return NextResponse.json({ error: 'Failed to save recording' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: recording }, { status: 201 })
  } catch (error) {
    console.error('[screen-recording] upload error:', error)
    return NextResponse.json({ error: 'Failed to upload recording' }, { status: 500 })
  }
}
