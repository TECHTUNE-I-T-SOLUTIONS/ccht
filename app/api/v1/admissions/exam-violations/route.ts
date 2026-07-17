import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { sessionId, violationType, severity, details, screenshotUrl } = body

    if (!sessionId || !violationType) {
      return NextResponse.json({ error: 'sessionId and violationType are required' }, { status: 400 })
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

    // Use admin client to bypass RLS for violation insertion
    const adminSupabase = createAdminClient()

    // Insert violation
    const { data: violation, error: violationError } = await adminSupabase
      .from('exam_violations')
      .insert({
        session_id: sessionId,
        violation_type: violationType,
        severity: severity || 'medium',
        details: details || null,
        screenshot_url: screenshotUrl || null,
      })
      .select()
      .single()

    if (violationError) {
      console.error('Failed to log violation:', violationError)
      return NextResponse.json({ error: 'Failed to log violation' }, { status: 500 })
    }

    // Check if max violations reached
    const { count } = await supabase
      .from('exam_violations')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId)

    const violationCount = count || 0

    return NextResponse.json({ 
      data: violation, 
      violationCount,
      maxViolationsReached: violationCount >= 5 // Default threshold
    }, { status: 201 })
  } catch (error) {
    console.error('Log violation error:', error)
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

    const { data: violations, error: violationsError } = await supabase
      .from('exam_violations')
      .select('*')
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: true })

    if (violationsError) {
      console.error('Failed to fetch violations:', violationsError)
      return NextResponse.json({ error: 'Failed to fetch violations' }, { status: 500 })
    }

    return NextResponse.json({ data: violations || [] })
  } catch (error) {
    console.error('Fetch violations error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}