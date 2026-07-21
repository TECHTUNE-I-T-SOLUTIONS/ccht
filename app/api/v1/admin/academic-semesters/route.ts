import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const createSemesterSchema = z.object({
  session_id: z.string().uuid('Invalid session ID'),
  semester_name: z.string().min(1, 'Semester name is required'),
  starts_on: z.string().optional().nullable(),
  ends_on: z.string().optional().nullable(),
  is_current: z.boolean().optional().default(false),
  is_active: z.boolean().optional().default(true),
})

const updateSemesterSchema = z.object({
  session_id: z.string().uuid('Invalid session ID').optional(),
  semester_name: z.string().min(1, 'Semester name is required').optional(),
  starts_on: z.string().optional().nullable(),
  ends_on: z.string().optional().nullable(),
  is_current: z.boolean().optional(),
  is_active: z.boolean().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('academic_semesters')
      .select('*, session:academic_sessions(name)')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ success: true, data: data || [] })
  } catch (error) {
    console.error('[API] Failed to fetch academic semesters:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch academic semesters' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validationResult = createSemesterSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: validationResult.error.flatten() },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // If setting as current, unset other current semesters in the same session
    if (validationResult.data.is_current) {
      await supabase
        .from('academic_semesters')
        .update({ is_current: false })
        .eq('session_id', validationResult.data.session_id)
    }

    const { data, error } = await supabase
      .from('academic_semesters')
      .insert(validationResult.data)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error) {
    console.error('[API] Failed to create academic semester:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create academic semester' },
      { status: 500 }
    )
  }
}
