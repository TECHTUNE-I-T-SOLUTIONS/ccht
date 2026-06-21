import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AdmissionService } from '@/lib/services/admission.service'

const allowedTypes = new Set([
  'passport_photo',
  'signature',
  'birth_certificate',
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

    if (!allowedTypes.has(documentType)) {
      return NextResponse.json({ error: 'Invalid document type' }, { status: 400 })
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
