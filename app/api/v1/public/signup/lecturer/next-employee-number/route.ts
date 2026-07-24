import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('teacher_profiles')
      .select('employee_number')
      .not('employee_number', 'is', null)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    let max = 0
    for (const row of data || []) {
      const digits = String(row.employee_number || '').replace(/\D/g, '')
      const parsed = Number.parseInt(digits, 10)
      if (!Number.isNaN(parsed)) max = Math.max(max, parsed)
    }

    const nextNumber = String(max + 1).padStart(3, '0')
    return NextResponse.json({ success: true, nextEmployeeNumber: nextNumber })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch next employee number' }, { status: 500 })
  }
}
