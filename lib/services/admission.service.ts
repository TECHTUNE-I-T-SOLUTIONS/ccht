import crypto from 'crypto'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createPublicClient } from '@/lib/supabase/public'
import { buildCloudinaryPublicUrl, getCloudinaryConfig, uploadFileToCloudinary } from '@/lib/cloudinary'

export type AspirantProfile = {
  profile_id: string
  admission_number: string | null
  jamb_reg_no: string | null
  preferred_program_id: string | null
  application_type: string
  application_status: string
  current_stage: string
  profile_completion: number
  admission_session: string | null
  submission_notes: string | null
  submitted_at: string | null
  reviewed_at: string | null
  reviewed_by: string | null
  review_feedback: string | null
  created_at: string
  updated_at: string
}

export type AdmissionDocument = {
  id: string
  application_id: string
  uploaded_by: string
  document_type: string
  storage_bucket: string
  storage_path: string
  file_name: string
  mime_type: string | null
  file_size: number | null
  verification_status: string
  verification_note: string | null
  uploaded_at: string
  verified_by: string | null
  verified_at: string | null
  created_at: string
  updated_at: string
  file_url?: string | null
}

export type ProfilePhoto = {
  id: string
  application_id: string
  uploaded_by: string
  storage_bucket: string
  storage_path: string
  file_name: string
  mime_type: string | null
  file_size: number | null
  is_primary: boolean
  created_at: string
  updated_at: string
  image_url?: string | null
}

export type AdmissionCandidate = {
  profile_id: string
  admission_number: string | null
  application_status: string
  current_stage: string
  profile_completion: number
  preferred_program_id: string | null
  created_at: string
  updated_at: string
}

function buildCloudinaryUrl(publicIdOrUrl?: string | null) {
  const { cloudName } = getCloudinaryConfig()
  return buildCloudinaryPublicUrl(cloudName, publicIdOrUrl)
}

function getFormatFromMimeType(mimeType?: string | null): string | null {
  if (!mimeType) return null
  const map: Record<string, string> = {
    'application/pdf': 'pdf',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
  }
  return map[mimeType] || null
}

function getFormatFromFileName(fileName?: string | null): string | null {
  if (!fileName) return null
  const match = fileName.match(/\.([^.]+)$/)
  if (!match) return null
  const ext = match[1].toLowerCase()
  const validFormats = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp']
  return validFormats.includes(ext) ? ext : null
}

export class AdmissionService {
  static async createSignedUrl(_: string, path: string) {
    return buildCloudinaryUrl(path)
  }

  static async getAspirantProfile(profileId: string): Promise<AspirantProfile | null> {
    const supabase = createPublicClient()
    const { data, error } = await supabase
      .from('aspirant_profiles')
      .select('*')
      .eq('profile_id', profileId)
      .maybeSingle()

    if (error) throw new Error('Failed to load aspirant profile')
    return data || null
  }

  static async getAdmissionDocuments(profileId: string): Promise<AdmissionDocument[]> {
    const supabase = createAdminClient()
    let retries = 3
    let lastError: any = null

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const { data, error } = await supabase
          .from('admission_documents')
          .select('*')
          .eq('uploaded_by', profileId)
          .order('uploaded_at', { ascending: false })

        if (error) throw new Error(error.message)

        return (data || []).map((doc) => {
          const format = getFormatFromMimeType(doc.mime_type) || getFormatFromFileName(doc.file_name)
          return {
            ...doc,
            file_url: buildCloudinaryPublicUrl(getCloudinaryConfig().cloudName, doc.storage_path, format),
          }
        })
      } catch (err: any) {
        lastError = err
        const isNetworkError =
          err?.code === 'EAI_AGAIN' ||
          err?.code === 'ENOTFOUND' ||
          err?.cause?.code === 'EAI_AGAIN' ||
          err?.message?.includes('fetch failed')
        
        if (isNetworkError && attempt < retries - 1) {
          console.error(`[getAdmissionDocuments] attempt ${attempt + 1} failed:`, err.message)
          await new Promise((resolve) => setTimeout(resolve, 2000 * (attempt + 1)))
          continue
        }
        throw err
      }
    }
    throw new Error(lastError?.message || 'Failed to load admission documents')
  }

  static async getProfilePhotos(profileId: string): Promise<ProfilePhoto[]> {
    const supabase = createAdminClient()
    let retries = 3
    let lastError: any = null

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const { data, error } = await supabase
          .from('aspirant_profile_photos')
          .select('*')
          .eq('uploaded_by', profileId)
          .order('created_at', { ascending: false })

        if (error) throw new Error(error.message)

        return (data || []).map((photo) => {
          const format = getFormatFromMimeType(photo.mime_type) || getFormatFromFileName(photo.file_name)
          return {
            ...photo,
            image_url: buildCloudinaryPublicUrl(getCloudinaryConfig().cloudName, photo.storage_path, format),
          }
        })
      } catch (err: any) {
        lastError = err
        const isNetworkError =
          err?.code === 'EAI_AGAIN' ||
          err?.code === 'ENOTFOUND' ||
          err?.cause?.code === 'EAI_AGAIN' ||
          err?.message?.includes('fetch failed')
        
        if (isNetworkError && attempt < retries - 1) {
          console.error(`[getProfilePhotos] attempt ${attempt + 1} failed:`, err.message)
          await new Promise((resolve) => setTimeout(resolve, 2000 * (attempt + 1)))
          continue
        }
        throw err
      }
    }
    throw new Error(lastError?.message || 'Failed to load profile photos')
  }

  static async listAspirantCandidates(status = 'approved'): Promise<AdmissionCandidate[]> {
    const supabase = createPublicClient()
    const { data, error } = await supabase
      .from('aspirant_profiles')
      .select('profile_id, admission_number, application_status, current_stage, profile_completion, preferred_program_id, created_at, updated_at')
      .eq('application_status', status)
      .order('updated_at', { ascending: false })

    if (error) throw new Error('Failed to load aspirant candidates')
    return data || []
  }

  static async bulkMigrateAspirantsToStudents(profileIds: string[]) {
    const supabase = await createServerClient()
    const migrated: string[] = []
    const errors: Array<{ profileId: string; error: string }> = []

    for (const profileId of profileIds) {
      try {
        const { data: aspirant, error: aspirantError } = await supabase
          .from('aspirant_profiles')
          .select('profile_id, preferred_program_id, application_status, current_stage')
          .eq('profile_id', profileId)
          .maybeSingle()

        if (aspirantError || !aspirant) {
          errors.push({ profileId, error: 'Aspirant profile not found' })
          continue
        }

        // Only migrate if status is 'completed' or 'admitted' with stage 'completed'
        if (aspirant.application_status !== 'completed' && !(aspirant.application_status === 'admitted' && aspirant.current_stage === 'completed')) {
          errors.push({ profileId, error: 'Aspirant status must be completed to migrate' })
          continue
        }

        const currentYear = new Date().getFullYear().toString()
        let deptCode = 'CHT'
        if (typeof aspirant.preferred_program_id === 'string') {
          const { data: program } = await supabase
            .from('programs')
            .select('title')
            .eq('id', aspirant.preferred_program_id)
            .maybeSingle()
          const title = program?.title?.toLowerCase() || ''
          if (title.includes('laboratory') || title.includes('mlt')) deptCode = 'MLT'
          else if (title.includes('public') || title.includes('pbh')) deptCode = 'PBH'
          else if (title.includes('pharmacy') || title.includes('pht')) deptCode = 'PHT'
        }

        const pattern = `CCHT/${deptCode}/${currentYear}/%`
        const { data: students } = await supabase
          .from('student_profiles')
          .select('matric_number')
          .like('matric_number', pattern)

        let nextId = 1
        const numbers = (students || [])
          .map((s) => {
            const parts = s.matric_number?.split('/') || []
            return parseInt(parts[parts.length - 1], 10)
          })
          .filter((value) => !Number.isNaN(value))
        if (numbers.length > 0) nextId = Math.max(...numbers) + 1

        const matricNumber = `CCHT/${deptCode}/${currentYear}/${String(nextId).padStart(3, '0')}`

        // Update profile role to student
        const { error: profileUpdateError } = await supabase
          .from('profiles')
          .update({ role: 'student' })
          .eq('id', profileId)
        if (profileUpdateError) throw profileUpdateError

        // Create student profile record with all required fields
        const { error: studentError } = await supabase
          .from('student_profiles')
          .upsert({
            profile_id: profileId,
            student_number: matricNumber,
            matric_number: matricNumber,
            admission_session: `${currentYear}/${parseInt(currentYear) + 1}`,
            admission_date: new Date().toISOString().split('T')[0],
            current_level: '100',
            admission_status: 'active', // Must match the check constraint
            nationality: 'Nigerian', // Default value
          })
        if (studentError) throw studentError

        // Update aspirant profile to mark as migrated
        const { error: aspirantUpdateError } = await supabase
          .from('aspirant_profiles')
          .update({
            application_status: 'migrated',
            current_stage: 'completed',
            admission_number: matricNumber,
            migration_completed: true,
            migration_completed_at: new Date().toISOString(),
          })
          .eq('profile_id', profileId)
        if (aspirantUpdateError) throw aspirantUpdateError

        migrated.push(profileId)
      } catch (error: any) {
        errors.push({ profileId, error: error?.message || 'Migration failed' })
      }
    }

    return { migrated, errors }
  }

  static async uploadProfilePhoto(profileId: string, file: File, userId: string) {
    return this.uploadProfilePhotoForUser(profileId, userId, file)
  }

  static async uploadProfilePhotoForUser(profileId: string, uploadedBy: string, file: File) {
    const supabase = createAdminClient()
    const result = await uploadFileToCloudinary(file, {
      folder: `profile-photos/${uploadedBy}`,
      publicId: `passport_${crypto.randomUUID()}`,
    })

    const { data: inserted, error: insertError } = await supabase
      .from('aspirant_profile_photos')
      .insert({
        application_id: profileId,
        uploaded_by: uploadedBy,
        storage_bucket: 'cloudinary',
        storage_path: result.public_id,
        file_name: file.name,
        mime_type: file.type || null,
        file_size: file.size,
        media_provider: 'cloudinary',
      })
      .select()
      .single()

    if (insertError) throw new Error(insertError.message)

    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({
        profile_photo_bucket: 'cloudinary',
        profile_photo_path: result.public_id,
        profile_photo_mime_type: file.type || null,
        profile_photo_uploaded_by: uploadedBy,
        profile_photo_uploaded_at: new Date().toISOString(),
        avatar_url: buildCloudinaryPublicUrl(getCloudinaryConfig().cloudName, result.public_id, result.format),
        media_provider: 'cloudinary',
        updated_at: new Date().toISOString(),
      })
      .eq('id', profileId)

    if (profileUpdateError) {
      console.error('Failed to update profile photo fields:', profileUpdateError.message)
    }

    let documentRecord: Record<string, any> | null = null
    let documentError: { message: string } | null = null
    
    try {
      const docResult = await supabase
        .from('admission_documents')
        .insert({
          application_id: profileId,
          uploaded_by: uploadedBy,
          document_type: 'passport_photo',
          storage_bucket: 'cloudinary',
          storage_path: result.public_id,
          file_name: file.name,
          mime_type: file.type || null,
          file_size: file.size,
          media_provider: 'cloudinary',
        })
        .select()
        .single()
      
      documentRecord = docResult.data
      documentError = docResult.error
    } catch (docInsertErr) {
      documentError = { message: String(docInsertErr) }
    }
    
    if (documentError) {
      console.error('Failed to save passport to admission_documents:', documentError.message)
      try {
        const retryResult = await supabase
          .from('admission_documents')
          .insert({
            application_id: profileId,
            uploaded_by: uploadedBy,
            document_type: 'passport_photo',
            storage_bucket: 'cloudinary',
            storage_path: `${result.public_id}_${Date.now()}`,
            file_name: file.name,
            mime_type: file.type || null,
            file_size: file.size,
            media_provider: 'cloudinary',
          })
          .select()
          .single()
        documentRecord = retryResult.data
        if (!retryResult.error) {
          console.log('Document insert succeeded on retry with modified path')
        }
      } catch (retryErr) {
        console.error('Retry also failed for admission_documents insert:', String(retryErr))
      }
    }

    return {
      ...inserted,
      image_url: buildCloudinaryPublicUrl(getCloudinaryConfig().cloudName, result.public_id, result.format),
      document: documentRecord
        ? {
            ...documentRecord,
            file_url: buildCloudinaryPublicUrl(getCloudinaryConfig().cloudName, result.public_id, result.format),
          }
        : null,
    }
  }

  static async uploadAdmissionDocument(
    profileId: string,
    userId: string,
    file: File,
    documentType: string,
  ) {
    const supabase = createAdminClient()
    const result = await uploadFileToCloudinary(file, {
      folder: `admission-documents/${userId}/${documentType}`,
      publicId: `${documentType}_${crypto.randomUUID()}`,
    })

    const { data, error } = await supabase
      .from('admission_documents')
      .insert({
        application_id: profileId,
        uploaded_by: userId,
        document_type: documentType,
        storage_bucket: 'cloudinary',
        storage_path: result.public_id,
        file_name: file.name,
        mime_type: file.type || null,
        file_size: file.size,
        media_provider: 'cloudinary',
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to insert admission document:', error)
      throw new Error(error.message || 'Failed to save document to database')
    }

    if (!data) {
      console.error('No data returned from admission_documents insert')
      throw new Error('Failed to save document - no data returned')
    }
    
    await this.updateProfileProgress(profileId, userId)
    
    const format = getFormatFromMimeType(file.type) || getFormatFromFileName(file.name)
    
    return {
      ...data,
      file_url: buildCloudinaryPublicUrl(getCloudinaryConfig().cloudName, result.public_id, format),
    }
  }

  static async updateProfileProgress(profileId: string, userId: string) {
    const supabase = createAdminClient()
    
    const { data: profile, error: profileError } = await supabase
      .from('aspirant_profiles')
      .select('*')
      .eq('profile_id', profileId)
      .single()
    
    if (profileError || !profile) {
      console.error('Failed to fetch profile for progress update:', profileError)
      return
    }
    
    const { count: docCount } = await supabase
      .from('admission_documents')
      .select('*', { count: 'exact', head: true })
      .eq('uploaded_by', userId)
    
    const documentsUploaded = (docCount || 0) > 0
    
    const { count: photoCount } = await supabase
      .from('aspirant_profile_photos')
      .select('*', { count: 'exact', head: true })
      .eq('uploaded_by', userId)
    
    const passportUploaded = (photoCount || 0) > 0
    
    const { data: paymentStatus } = await supabase
      .from('aspirant_payment_status')
      .select('application_fee_paid')
      .eq('profile_id', profileId)
      .single()
    
    const appFeePaid = paymentStatus?.application_fee_paid || false
    
    const { count: examCount } = await supabase
      .from('exam_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('aspirant_id', userId)
      .eq('status', 'submitted')
    
    const examCompleted = (examCount || 0) > 0
    
    let completion = 0
    if (passportUploaded) completion += 10
    if (appFeePaid) completion += 20
    if (documentsUploaded) completion += 40
    if (examCompleted) completion += 30
    
    let currentStage = profile.current_stage || 'signup'
    if (examCompleted) {
      currentStage = 'exam'
    } else if (documentsUploaded && appFeePaid) {
      currentStage = 'exam'
    } else if (documentsUploaded) {
      currentStage = 'documents'
    } else if (appFeePaid) {
      currentStage = 'payment'
    }
    
    const updateData: any = {
      profile_completion: completion,
      current_stage: currentStage,
      documents_uploaded: documentsUploaded,
      updated_at: new Date().toISOString(),
    }
    
    if (documentsUploaded && !profile.documents_uploaded) {
      updateData.documents_uploaded_at = new Date().toISOString()
    }
    
    if (examCompleted) {
      updateData.exam_completed = true
      updateData.exam_completed_at = new Date().toISOString()
    }
    
    const { error: updateError } = await supabase
      .from('aspirant_profiles')
      .update(updateData)
      .eq('profile_id', profileId)
    
    if (updateError) {
      console.error('Failed to update profile progress:', updateError)
    } else {
      console.log(`Profile progress updated: stage=${currentStage}, completion=${completion}%`)
    }
  }
}