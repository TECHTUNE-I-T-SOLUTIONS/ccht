import { NextRequest, NextResponse } from 'next/server'
import { AcademicSessionService } from '@/lib/services/academic-session.service'
import { z } from 'zod'

const createSessionSchema = z.object({
  name: z.string().min(1, 'Session name is required'),
  starts_on: z.string().optional().nullable(),
  ends_on: z.string().optional().nullable(),
  is_current: z.boolean().optional().default(false),
  is_active: z.boolean().optional().default(true),
})

const updateSessionSchema = z.object({
  name: z.string().min(1, 'Session name is required').optional(),
  starts_on: z.string().optional().nullable(),
  ends_on: z.string().optional().nullable(),
  is_current: z.boolean().optional(),
  is_active: z.boolean().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const sessions = await AcademicSessionService.getAllSessions()
    return NextResponse.json({ data: sessions })
  } catch (error) {
    console.error('[API] Failed to fetch academic sessions:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch academic sessions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validationResult = createSessionSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.flatten() },
        { status: 400 }
      )
    }

    const session = await AcademicSessionService.createSession(validationResult.data)
    return NextResponse.json({ data: session }, { status: 201 })
  } catch (error) {
    console.error('[API] Failed to create academic session:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create academic session' },
      { status: 500 }
    )
  }
}