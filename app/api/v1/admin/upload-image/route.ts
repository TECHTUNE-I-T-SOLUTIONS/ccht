import { NextRequest, NextResponse } from 'next/server'
import { uploadFileToCloudinary } from '@/lib/cloudinary'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = formData.get('folder') as string || 'uploads'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 })
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image must be less than 5MB' }, { status: 400 })
    }

    // Upload to Cloudinary
    const result = await uploadFileToCloudinary(file, {
      folder: folder,
      resourceType: 'image'
    })

    return NextResponse.json({
      success: true,
      data: {
        url: result.secure_url,
        publicId: result.public_id
      }
    })
  } catch (error: any) {
    console.error('[admin/upload-image] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to upload image' },
      { status: 500 }
    )
  }
}