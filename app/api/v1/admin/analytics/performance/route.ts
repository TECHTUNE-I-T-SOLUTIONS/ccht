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
    
    const { data: assessments, error: assessmentsError } = await adminSupabase
      .from('assessments')
      .select('*')

    if (assessmentsError) {
      console.error('Failed to fetch assessments:', assessmentsError)
      return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
    }

    const { data: examAttempts, error: attemptsError } = await adminSupabase
      .from('student_exam_attempts')
      .select(`
        *,
        exam_session:student_exam_sessions(
          total_marks,
          passing_marks
        )
      `)

    if (attemptsError) {
      console.error('Failed to fetch exam attempts:', attemptsError)
    }

    // Calculate analytics
    const totalAssessments = assessments?.length || 0
    const totalSubmissions = examAttempts?.length || 0
    
    let totalScore = 0
    let scores: number[] = []
    
    examAttempts?.forEach((attempt: any) => {
      if (attempt.percentage_score !== null && attempt.percentage_score !== undefined) {
        totalScore += attempt.percentage_score
        scores.push(attempt.percentage_score)
      }
    })

    const averageScore = scores.length > 0 ? totalScore / scores.length : 0
    const highestScore = scores.length > 0 ? Math.max(...scores) : 0
    const lowestScore = scores.length > 0 ? Math.min(...scores) : 0
    
    // Calculate pass rate using the passed column or percentage_score
    const passedCount = examAttempts?.filter((attempt: any) => {
      return attempt.passed === true || (attempt.percentage_score >= 50)
    }).length || 0
    
    const passRate = totalSubmissions > 0 ? (passedCount / totalSubmissions) * 100 : 0

    return NextResponse.json({ 
      data: {
        averageScore,
        highestScore,
        lowestScore,
        passRate,
        totalAssessments,
        totalSubmissions
      }
    })
  } catch (error) {
    console.error('Fetch analytics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
