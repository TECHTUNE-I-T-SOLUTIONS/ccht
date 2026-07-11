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
    console.error('[exams] fetch error:', error)
    return NextResponse.json({ error: 'Failed to load exams' }, { status: 500 })
  }
}
