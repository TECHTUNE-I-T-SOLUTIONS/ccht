import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const examId = request.nextUrl.searchParams.get('examId')
    if (!examId) {
      return NextResponse.json({ data: [] }, { status: 200 })
    }

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('screening_candidates')
      .select('id, profile_id, exam_id, score, grade, status, submitted_at, profile:profiles(first_name,last_name,email)')
      .eq('exam_id', examId)
      .order('submitted_at', { ascending: false })

    if (error) {
      return NextResponse.json({ data: [] }, { status: 200 })
    }

    return NextResponse.json({ data: data || [] }, { status: 200 })
  } catch (error) {
    console.error('[Screening Candidates GET]', error)
    return NextResponse.json({ data: [] }, { status: 200 })
  }
}