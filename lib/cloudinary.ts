import crypto from 'crypto'

export type CloudinaryConfig = {
  cloudName: string
  apiKey: string
  apiSecret: string
  uploadPreset?: string
  folderPrefix: string
}

export function getCloudinaryConfig(): CloudinaryConfig {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in .env.local.',
    )
  }

  return {
    cloudName,
    apiKey,
    apiSecret,
    uploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET || undefined,
    folderPrefix: process.env.CLOUDINARY_FOLDER_PREFIX || 'ccht',
  }
}

export function signCloudinaryParams(params: Record<string, string | number | boolean | undefined>, apiSecret: string) {
  const filtered = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('&')

  return crypto.createHash('sha1').update(`${filtered}${apiSecret}`).digest('hex')
}

export function buildCloudinaryPublicUrl(cloudName: string, publicIdOrUrl?: string | null) {
  if (!publicIdOrUrl) return null
  if (/res\.cloudinary\.com|cloudinary\.com/i.test(publicIdOrUrl)) return publicIdOrUrl
  return `https://res.cloudinary.com/${cloudName}/image/upload/${publicIdOrUrl}`
}

export async function uploadFileToCloudinary(file: File, options: { folder: string; publicId?: string; resourceType?: 'image' | 'auto' } ) {
  const config = getCloudinaryConfig()
  const timestamp = Math.floor(Date.now() / 1000)
  const folder = `${config.folderPrefix}/${options.folder}`.replace(/\/+/g, '/')

  const params: Record<string, string | number | boolean> = {
    timestamp,
    folder,
  }

  if (options.publicId) params.public_id = options.publicId
  const signature = signCloudinaryParams(params, config.apiSecret)

  const formData = new FormData()
  formData.append('file', file)
  formData.append('api_key', config.apiKey)
  formData.append('timestamp', String(timestamp))
  formData.append('folder', folder)
  formData.append('signature', signature)
  if (options.publicId) formData.append('public_id', options.publicId)
  if (config.uploadPreset) formData.append('upload_preset', config.uploadPreset)

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${config.cloudName}/${options.resourceType || 'image'}/upload`,
    {
      method: 'POST',
      body: formData,
    },
  )

  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    throw new Error(payload?.error?.message || 'Cloudinary upload failed')
  }

  return response.json() as Promise<{
    secure_url: string
    public_id: string
    bytes?: number
    format?: string
    original_filename?: string
  }>
}
