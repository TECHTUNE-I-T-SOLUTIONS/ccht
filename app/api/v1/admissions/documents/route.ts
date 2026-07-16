import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AdmissionService } from '@/lib/services/admission.service'
import { UploadAdmissionDocumentSchema } from '@/lib/validation'

const allowedTypes = new Set([
  'passport_photo',
  'signature',
  'birth_certificate',
  'medical_fitness',
  'age_declaration',
  'primary_certificate',
  'secondary_certificate',
  'indigene_certificate',
  'nin_slip',
  'jamb_result',
  'jamb_registration_form',
  'other',
])

async function getAuthenticatedUser() {
  const supabase = await createClient()
  let retries = 3
  let lastError: any = null

  for (let i = 0; i < retries; i++) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      return user
    } catch (err: any) {
      lastError = err
      // Only retry on network/DNS errors
      if (
        err?.code === 'EAI_AGAIN' ||
        err?.code === 'ENOTFOUND' ||
        err?.cause?.code === 'EAI_AGAIN'
      ) {
        console.error(`[auth] getUser attempt ${i + 1} failed (network error):`, err.message)
        if (i < retries - 1) {
          await new Promise((resolve) => setTimeout(resolve, 2000 * (i + 1)))
          continue
        }
      }
      throw err
    }
  }
  throw lastError
}

async function getAspirantProfile(userId: string) {
  const supabase = await createClient()
  let retries = 3
  let lastError: any = null

  for (let i = 0; i < retries; i++) {
    try {
      const { data } = await supabase
        .from('aspirant_profiles')
        .select('profile_id')
        .eq('profile_id', userId)
        .maybeSingle()
      return data
    } catch (err: any) {
      lastError = err
      if (
        err?.code === 'EAI_AGAIN' ||
        err?.code === 'ENOTFOUND' ||
        err?.cause?.code === 'EAI_AGAIN'
      ) {
        console.error(`[db] profile lookup attempt ${i + 1} failed (network error):`, err.message)
        if (i < retries - 1) {
          await new Promise((resolve) => setTimeout(resolve, 2000 * (i + 1)))
          continue
        }
      }
      throw err
    }
  }
  throw lastError
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file')
    const documentType = String(formData.get('documentType') || '')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Document file is required' }, { status: 400 })
    }

    const parsed = UploadAdmissionDocumentSchema.safeParse({ documentType })
    if (!parsed.success || !allowedTypes.has(documentType)) {
      return NextResponse.json({ error: 'Invalid document type' }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Document must be 10MB or smaller' }, { status: 400 })
    }

    const profile = await getAspirantProfile(user.id)

    if (!profile) {
      return NextResponse.json({ error: 'Aspirant profile not found' }, { status: 404 })
    }

    const uploaded = await AdmissionService.uploadAdmissionDocument(user.id, user.id, file, documentType)

    return NextResponse.json({ success: true, data: uploaded }, { status: 201 })
  } catch (error) {
    console.error('[admissions/documents] upload error:', error)
    return NextResponse.json({ error: 'Failed to upload document' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const user = await getAuthenticatedUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await AdmissionService.getAdmissionDocuments(user.id)
    return NextResponse.json({ data }, { status: 200 })
  } catch (error) {
    console.error('[admissions/documents] fetch error:', error)
    return NextResponse.json({ error: 'Failed to load documents' }, { status: 500 })
  }
}