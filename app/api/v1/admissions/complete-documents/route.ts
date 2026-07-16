import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// All required document types
const REQUIRED_DOCUMENT_TYPES = [
  'secondary_certificate',
  'birth_certificate',
  'indigene_certificate',
  'nin_slip',
  'medical_fitness',
  'passport_photo',
  'signature',
  'jamb_registration_form',
]

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
      if (
        err?.code === 'EAI_AGAIN' ||
        err?.code === 'ENOTFOUND' ||
        err?.cause?.code === 'EAI_AGAIN'
      ) {
        console.error(`[auth] getUser attempt ${i + 1} failed:`, err.message)
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

export async function POST() {
  try {
    const user = await getAuthenticatedUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use admin client to bypass RLS
    const supabase = createAdminClient()
    let retries = 3
    let uploadedDocs: any[] = []
    let lastError: any = null

    // Retry loop for fetching documents
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const { data, error } = await supabase
          .from('admission_documents')
          .select('document_type, uploaded_at')
          .eq('uploaded_by', user.id)

        if (error) throw new Error(error.message)
        uploadedDocs = data || []
        break
      } catch (err: any) {
        lastError = err
        const isNetworkError =
          err?.code === 'EAI_AGAIN' ||
          err?.code === 'ENOTFOUND' ||
          err?.cause?.code === 'EAI_AGAIN' ||
          err?.message?.includes('fetch failed')

        if (isNetworkError && attempt < retries - 1) {
          console.error(`[complete-documents] fetch attempt ${attempt + 1} failed:`, err.message)
          await new Promise((resolve) => setTimeout(resolve, 2000 * (attempt + 1)))
          continue
        }
        throw err
      }
    }

    if (lastError && uploadedDocs.length === 0) {
      throw lastError
    }

    // Check if all required document types are uploaded
    const uploadedTypes = new Set(uploadedDocs.map((doc: any) => doc.document_type))
    const missingTypes = REQUIRED_DOCUMENT_TYPES.filter((type) => !uploadedTypes.has(type))

    if (missingTypes.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not all required documents have been uploaded yet',
          missingTypes,
        },
        { status: 400 },
      )
    }

    // Update aspirant profile: set stage to 'exam', documents_uploaded = true
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const now = new Date().toISOString()
        const { error: updateError } = await supabase
          .from('aspirant_profiles')
          .update({
            current_stage: 'exam',
            documents_uploaded: true,
            documents_uploaded_at: now,
            updated_at: now,
          })
          .eq('profile_id', user.id)

        if (updateError) throw new Error(updateError.message)
        break
      } catch (err: any) {
        lastError = err
        const isNetworkError =
          err?.code === 'EAI_AGAIN' ||
          err?.code === 'ENOTFOUND' ||
          err?.cause?.code === 'EAI_AGAIN' ||
          err?.message?.includes('fetch failed')

        if (isNetworkError && attempt < retries - 1) {
          console.error(`[complete-documents] update attempt ${attempt + 1} failed:`, err.message)
          await new Promise((resolve) => setTimeout(resolve, 2000 * (attempt + 1)))
          continue
        }
        throw err
      }
    }

    // Create a notification for the aspirant
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const { error: notifError } = await supabase
          .from('aspirant_notifications')
          .insert({
            aspirant_id: user.id,
            title: 'Documents Upload Complete',
            message:
              'All required documents have been uploaded successfully. The entrance exam is now unlocked. Click "Start Exam" to begin your screening exam.',
            notification_type: 'general',
            category: 'document',
            priority: 'high',
            deep_link: '/aspirant/exam',
            created_by: user.id,
          })

        if (notifError) {
          console.error('Failed to create notification:', notifError.message)
        }
        break
      } catch (err: any) {
        console.error(`[complete-documents] notification attempt ${attempt + 1} failed:`, err.message)
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Documents stage completed. Entrance exam is now unlocked.',
      stage: 'exam',
    })
  } catch (error) {
    console.error('[admissions/complete-documents] error:', error)
    return NextResponse.json(
      { error: 'Failed to complete documents stage' },
      { status: 500 },
    )
  }
}