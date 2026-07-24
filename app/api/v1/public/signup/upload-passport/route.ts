import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { uploadFileToCloudinary } from '@/lib/cloudinary'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')
    const userId = String(formData.get('userId') || '').trim()

    if (!(file instanceof File) || !userId) {
      return NextResponse.json({ error: 'Missing file or userId' }, { status: 400 })
    }

    const admin = createAdminClient()
    const result = await uploadFileToCloudinary(file, {
      folder: `profile-photos/${userId}`,
      publicId: `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`,
      resourceType: 'image',
    })

    return NextResponse.json({
      success: true,
      path: result.public_id,
      bucket: 'cloudinary',
      mimeType: file.type,
      fileName: file.name,
      url: result.secure_url,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Upload failed' }, { status: 500 })
  }
}
