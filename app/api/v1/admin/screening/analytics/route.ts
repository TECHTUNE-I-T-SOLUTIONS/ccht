import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Use admin client to get analytics data
    const adminSupabase = createAdminClient()
    
    const { data: sessions, error: sessionsError } = await adminSupabase
      .from('exam_sessions')
      .select('*')

    if (sessionsError) {
      console.error('Failed to fetch exam sessions:', sessionsError)
      return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
    }

    const { data: violations, error: violationsError } = await adminSupabase
      .from('exam_violations')
      .select('*')

    if (violationsError) {
      console.error('Failed to fetch violations:', violationsError)
    }

    // Calculate analytics
    const totalSessions = sessions?.length || 0
    const averageScore = sessions?.reduce((sum, s) => sum + (s.percentage || 0), 0) / (totalSessions || 1)
    const passRate = sessions?.filter(s => (s.percentage || 0) >= 50).length / (totalSessions || 1) * 100
    const averageDuration = sessions?.reduce((sum, s) => sum + (s.time_spent_seconds || 0), 0) / (totalSessions || 1)
    const totalViolations = violations?.length || 0
    const disqualified = sessions?.filter(s => s.status === 'disqualified').length || 0

    return NextResponse.json({ 
      data: {
        totalSessions,
        averageScore,
        passRate,
        averageDuration,
        violations: totalViolations,
        disqualified
      }
    })
  } catch (error) {
    console.error('Fetch analytics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
