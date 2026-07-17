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

export function buildCloudinaryPublicUrl(cloudName: string, publicIdOrUrl?: string | null, format?: string | null) {
  if (!publicIdOrUrl) return null
  if (/res\.cloudinary\.com|cloudinary\.com/i.test(publicIdOrUrl)) return publicIdOrUrl
  
  // Append format/extension if provided (e.g., 'pdf' for PDF files)
  const publicIdWithFormat = format ? `${publicIdOrUrl}.${format}` : publicIdOrUrl
  return `https://res.cloudinary.com/${cloudName}/image/upload/${publicIdWithFormat}`
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

  const maxRetries = 5
  let lastError: Error | null = null
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      // Create a new AbortController for each attempt with timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout per attempt
      
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${config.cloudName}/${options.resourceType || 'image'}/upload`,
        {
          method: 'POST',
          body: formData,
          signal: controller.signal,
        },
      )
      
      clearTimeout(timeoutId)

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
    } catch (error: any) {
      lastError = error
      
      // Check for network/DNS errors (EAI_AGAIN, ENOTFOUND, or AbortError for timeouts)
      const isNetworkError =
        error?.code === 'EAI_AGAIN' ||
        error?.code === 'ENOTFOUND' ||
        error?.name === 'AbortError' ||
        error?.cause?.code === 'EAI_AGAIN' ||
        error?.cause?.code === 'ENOTFOUND' ||
        error?.message?.includes('fetch failed') ||
        error?.message?.includes('network')
      
      if (isNetworkError) {
        const delay = Math.min(2000 * Math.pow(2, i), 15000) // Exponential backoff: 2s, 4s, 8s, 15s, 15s
        console.error(`Cloudinary upload attempt ${i + 1}/${maxRetries} failed (network error): ${error.message}. Retrying in ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      
      // For non-network errors, throw immediately
      console.error(`Cloudinary upload failed (non-network error):`, error.message)
      throw error
    }
  }
  
  throw new Error(lastError?.message || 'Cloudinary upload failed after all retries')
}
