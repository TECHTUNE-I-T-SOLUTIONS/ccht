import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AdmissionService } from '@/lib/services/admission.service'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const candidates = await AdmissionService.listAspirantCandidates('approved')
    return NextResponse.json({ data: candidates }, { status: 200 })
  } catch (error) {
    console.error('[admin/admissions/migrate] fetch error:', error)
    return NextResponse.json({ error: 'Failed to load candidates' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json().catch(() => null)
    const profileIds = Array.isArray(body?.profileIds) ? body.profileIds.filter((id: unknown) => typeof id === 'string') : []
    if (profileIds.length === 0) {
      return NextResponse.json({ error: 'Select at least one aspirant' }, { status: 400 })
    }

    const result = await AdmissionService.bulkMigrateAspirantsToStudents(profileIds)
    return NextResponse.json({ success: true, ...result }, { status: 200 })
  } catch (error) {
    console.error('[admin/admissions/migrate] submit error:', error)
    return NextResponse.json({ error: 'Failed to migrate aspirants' }, { status: 500 })
  }
}
