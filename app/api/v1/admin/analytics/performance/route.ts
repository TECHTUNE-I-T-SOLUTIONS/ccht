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

    const { data: submissions, error: submissionsError } = await adminSupabase
      .from('assessment_submissions')
      .select('*')

    if (submissionsError) {
      console.error('Failed to fetch submissions:', submissionsError)
    }

    // Calculate analytics
    const totalAssessments = assessments?.length || 0
    const totalSubmissions = submissions?.length || 0
    
    let totalScore = 0
    let scores: number[] = []
    
    submissions?.forEach((sub: any) => {
      if (sub.score !== null && sub.score !== undefined) {
        totalScore += sub.score
        scores.push(sub.score)
      }
    })

    const averageScore = scores.length > 0 ? totalScore / scores.length : 0
    const highestScore = scores.length > 0 ? Math.max(...scores) : 0
    const lowestScore = scores.length > 0 ? Math.min(...scores) : 0
    
    // Calculate pass rate (assuming 50% is passing)
    const passedCount = submissions?.filter((sub: any) => {
      const assessment = assessments?.find((a: any) => a.id === sub.assessment_id)
      if (!assessment) return false
      const percentage = assessment.total_marks > 0 ? (sub.score / assessment.total_marks) * 100 : 0
      return percentage >= 50
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
