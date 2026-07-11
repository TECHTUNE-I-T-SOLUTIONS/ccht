import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ExamService } from '@/lib/services/exam.service'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const data = await ExamService.getEntranceExamResults(user.id)
    return NextResponse.json({ data }, { status: 200 })
  } catch (error) {
    console.error('[admissions/results] fetch error:', error)
    return NextResponse.json({ error: 'Failed to load exam results' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const score = Number(body.score)
    const totalQuestions = Number(body.totalQuestions || body.total_questions || 0)

    if (!Number.isFinite(score) || !Number.isFinite(totalQuestions) || totalQuestions <= 0) {
      return NextResponse.json({ error: 'Invalid exam payload' }, { status: 400 })
    }

    const result = await ExamService.saveEntranceExam({
      aspirantId: user.id,
      score,
      totalQuestions,
      examType: body.examType || body.exam_body || 'Entrance Examination',
      answers: body.answers || {},
      proctoring: body.proctoring || null,
    })

    return NextResponse.json({ success: true, data: result }, { status: 201 })
  } catch (error) {
    console.error('[admissions/results] submit error:', error)
    return NextResponse.json({ error: 'Failed to save exam result' }, { status: 500 })
  }
}
