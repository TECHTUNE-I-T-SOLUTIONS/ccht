import { NextRequest, NextResponse } from 'next/server'
import { AcademicSessionService } from '@/lib/services/academic-session.service'
import { z } from 'zod'

const updateSessionSchema = z.object({
  name: z.string().min(1, 'Session name is required').optional(),
  starts_on: z.string().optional().nullable(),
  ends_on: z.string().optional().nullable(),
  is_current: z.boolean().optional(),
  is_active: z.boolean().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await AcademicSessionService.getSessionById(id)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Academic session not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: session })
  } catch (error) {
    console.error('[API] Failed to fetch academic session:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch academic session' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    // Validate input
    const validationResult = updateSessionSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.flatten() },
        { status: 400 }
      )
    }

    const session = await AcademicSessionService.updateSession(id, validationResult.data)
    return NextResponse.json({ data: session })
  } catch (error) {
    console.error('[API] Failed to update academic session:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update academic session' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await AcademicSessionService.deleteSession(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API] Failed to delete academic session:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete academic session' },
      { status: 500 }
    )
  }
}