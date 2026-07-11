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

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

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

    const { data: profile } = await supabase
      .from('aspirant_profiles')
      .select('profile_id')
      .eq('profile_id', user.id)
      .maybeSingle()

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
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

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
