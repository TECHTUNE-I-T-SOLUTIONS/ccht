'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BadgeCheck, FileDown, FileUp, Image as ImageIcon, Lock, UploadCloud, AlertCircle, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

const documentTypes = [
  { label: "O'level Result", value: 'secondary_certificate' },
  { label: 'Birth Certificate', value: 'birth_certificate' },
  { label: 'State of Origin Certificate', value: 'indigene_certificate' },
  { label: 'National Identification Slip (NIN)', value: 'nin_slip' },
  { label: 'Medical Fitness Report/Certificate', value: 'medical_fitness' },
  { label: 'Passport Photograph', value: 'passport_photo' },
  { label: 'Signature Specimen', value: 'signature' },
  { label: 'JAMB Registration details (if any)', value: 'jamb_registration_form' },
]

const ACCEPTED_DOC_MIME_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
const ACCEPTED_DOC_EXTENSIONS = '.jpg,.jpeg,.png,.pdf'
const MAX_FILE_SIZE = 2 * 1024 * 1024

const ACCEPTED_PHOTO_MIME_TYPES = ['image/jpeg', 'image/png', 'image/jpg']
const ACCEPTED_PHOTO_EXTENSIONS = '.jpg,.jpeg,.png'
const MAX_PHOTO_SIZE = 2 * 1024 * 1024

function validateFile(file: File, allowedTypes: string[], maxSize: number, label: string): string | null {
  if (!allowedTypes.includes(file.type)) {
    return `${label} must be JPG, PNG, or PDF. Got: ${file.type || 'unknown type'}`
  }
  if (file.size > maxSize) {
    const maxMB = maxSize / (1024 * 1024)
    const actualMB = (file.size / (1024 * 1024)).toFixed(1)
    return `${label} must be ${maxMB}MB or smaller. Got: ${actualMB}MB`
  }
  return null
}

type UploadedDocument = {
  id: string
  document_type: string
  file_name: string
  verification_status: string
  file_url?: string | null
  uploaded_at?: string
}

type UploadedPhoto = {
  id: string
  file_name: string
  image_url?: string | null
}

export default function AspirantDocumentsPage() {
  const [appFeePaid, setAppFeePaid] = useState(false)
  const [loading, setLoading] = useState(true)
  const [documents, setDocuments] = useState<UploadedDocument[]>([])
  const [photos, setPhotos] = useState<UploadedPhoto[]>([])
  const [passportFile, setPassportFile] = useState<File | null>(null)
  const [docType, setDocType] = useState('secondary_certificate')
  const [docFile, setDocFile] = useState<File | null>(null)
  const [passportStatus, setPassportStatus] = useState('')
  const [docStatus, setDocStatus] = useState('')
  const [submittingPassport, setSubmittingPassport] = useState(false)
  const [submittingDoc, setSubmittingDoc] = useState(false)

  const loadData = async () => {
    setLoading(true)
    const fetchWithRetry = async (url: string, retries = 3): Promise<Response> => {
      for (let i = 0; i < retries; i++) {
        try {
          const res = await fetch(url)
          return res
        } catch (err: any) {
          const isNetworkError = err?.cause?.code === 'EAI_AGAIN' || err?.code === 'EAI_AGAIN' || err?.message?.includes('fetch failed')
          if (isNetworkError && i < retries - 1) {
            console.warn(`[documents page] fetch ${url} attempt ${i + 1} failed, retrying...`)
            await new Promise(r => setTimeout(r, 2000 * (i + 1)))
            continue
          }
          throw err
        }
      }
      throw new Error(`Failed to fetch after ${retries} attempts`)
    }

    try {
      const [paymentRes, docsRes, photosRes] = await Promise.all([
        fetchWithRetry('/api/v1/aspirant/payments/status').catch(() => null),
        fetchWithRetry('/api/v1/admissions/documents').catch(() => null),
        fetchWithRetry('/api/v1/admissions/profile-photo').catch(() => null),
      ])

      const paymentData = paymentRes ? await paymentRes.json().catch(() => null) : null
      const docs = docsRes ? await docsRes.json().catch(() => null) : null
      const pic = photosRes ? await photosRes.json().catch(() => null) : null

      setAppFeePaid(paymentData?.data?.profile?.application_fee_paid || false)
      setDocuments(docs?.data || [])
      setPhotos(pic?.data || [])

      // Reset docType to first available if current selection is no longer valid
      if (docs?.data) {
        const uploaded = new Set(docs.data.map((d: any) => d.document_type))
        const available = documentTypes.filter((item) => !uploaded.has(item.value))
        if (available.length > 0 && !available.find((a) => a.value === docType)) {
          setDocType(available[0].value)
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handlePassportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    if (file) {
      const error = validateFile(file, ACCEPTED_PHOTO_MIME_TYPES, MAX_PHOTO_SIZE, 'Passport photo')
      if (error) {
        setPassportStatus('')
        toast.error(error)
        e.target.value = ''
        return
      }
    }
    setPassportFile(file)
    setPassportStatus('')
  }

  const handleDocFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    if (file) {
      const error = validateFile(file, ACCEPTED_DOC_MIME_TYPES, MAX_FILE_SIZE, 'Document')
      if (error) {
        setDocStatus('')
        toast.error(error)
        e.target.value = ''
        return
      }
    }
    setDocFile(file)
    setDocStatus('')
  }

  const uploadPassport = async () => {
    if (!passportFile) return setPassportStatus('Choose a passport photo first.')
    const validationError = validateFile(passportFile, ACCEPTED_PHOTO_MIME_TYPES, MAX_PHOTO_SIZE, 'Passport photo')
    if (validationError) {
      setPassportStatus(validationError)
      toast.error(validationError)
      return
    }
    setSubmittingPassport(true)
    setPassportStatus('')
    try {
      const formData = new FormData()
      formData.append('file', passportFile)
      const response = await fetch('/api/v1/admissions/profile-photo', { method: 'POST', body: formData })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.error || 'Unable to upload passport photo')
      toast.success('Passport photo uploaded successfully.')
      setPassportFile(null)
      await loadData()
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Upload failed.'
      setPassportStatus(msg)
      toast.error(msg)
    } finally {
      setSubmittingPassport(false)
    }
  }

  const uploadDocument = async () => {
    if (!docFile) return setDocStatus('Choose a document first.')
    const validationError = validateFile(docFile, ACCEPTED_DOC_MIME_TYPES, MAX_FILE_SIZE, 'Document')
    if (validationError) {
      setDocStatus(validationError)
      toast.error(validationError)
      return
    }
    setSubmittingDoc(true)
    setDocStatus('')
    try {
      const formData = new FormData()
      formData.append('file', docFile)
      formData.append('documentType', docType)
      const response = await fetch('/api/v1/admissions/documents', { method: 'POST', body: formData })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.error || 'Unable to upload document')
      toast.success('Document uploaded successfully.')
      setDocStatus('Document uploaded successfully.')
      setDocFile(null)
      await loadData()
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Upload failed.'
      setDocStatus(msg)
      toast.error(msg)
    } finally {
      setSubmittingDoc(false)
    }
  }

  const uploadedDocumentTypes = useMemo(() => new Set(documents.map((doc) => doc.document_type)), [documents])
  const currentPassport = photos[0] || documents.find((doc) => doc.document_type === 'passport_photo') || null
  const allDocumentsUploaded = documentTypes.every((d) => uploadedDocumentTypes.has(d.value))

  const getStatusBadge = (status: string) => {
    const normalized = status.toLowerCase()
    if (normalized === 'verified' || normalized === 'uploaded') {
      return <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600">Verified</span>
    }
    if (normalized === 'rejected') {
      return <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-600">Rejected</span>
    }
    if (normalized === 'needs_correction') {
      return <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-600">Needs Correction</span>
    }
    return <span className="rounded-full bg-gray-500/10 px-3 py-1 text-xs font-semibold text-gray-600">Pending</span>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!appFeePaid) {
    return (
      <div className="space-y-6">
        <div className="rounded-[2rem] border border-border bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.12),transparent_30%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--accent-soft)))] p-6 md:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Documents</p>
          <h1 className="mt-3 text-3xl font-extrabold">Upload and manage your admission files</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-foreground/70">
            Add the required documents for your application. Passport photos and files are now Cloudinary-backed and validated before upload.
          </p>
        </div>
        <Card className="rounded-[2rem] border border-dashed border-gray-300 bg-gray-50 p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900/50">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-gray-200 p-3 text-gray-400 dark:bg-gray-800"><Lock className="h-5 w-5" /></div>
            <div>
              <h2 className="text-xl font-bold text-gray-400">Documents Locked</h2>
              <p className="text-sm text-gray-500">Complete application fee payment to unlock document upload.</p>
            </div>
          </div>
          <Button asChild className="mt-4 rounded-xl">
            <Link href="/aspirant/dashboard">Go to Dashboard</Link>
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-border bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.12),transparent_30%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--accent-soft)))] p-6 md:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Documents</p>
        <h1 className="mt-3 text-3xl font-extrabold">Upload and manage your admission files</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-foreground/70">
          Add the required documents for your application. Passport photos and files are now Cloudinary-backed and validated before upload.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Passport Photo */}
        <Card className="rounded-[2rem] border bg-white p-6 shadow-sm dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-primary/10 p-3 text-primary"><ImageIcon className="h-5 w-5" /></div>
            <div>
              <h2 className="text-xl font-bold">Passport photo</h2>
              <p className="text-sm text-muted-foreground">Upload a clear passport photograph.</p>
            </div>
          </div>
          {currentPassport?.image_url ? (
            <div className="mt-4 rounded-2xl border border-border bg-slate-50 p-4 dark:bg-slate-800/50">
              <div className="flex items-center gap-2 mb-3">
                <BadgeCheck className="h-5 w-5 text-emerald-600" />
                <p className="text-sm font-semibold text-emerald-600">Passport photo uploaded</p>
              </div>
              <div className="overflow-hidden rounded-2xl border border-border">
                <img src={currentPassport.image_url} alt="Passport" className="h-48 w-full object-cover" />
              </div>
              <a href={currentPassport.image_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-xs font-semibold text-primary underline-offset-4 hover:underline">
                View / Download File
              </a>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              <input type="file" accept={ACCEPTED_PHOTO_EXTENSIONS} className="w-full rounded-2xl border border-border bg-white dark:bg-slate-800 px-4 py-3 text-sm" onChange={handlePassportFileChange} />
              <Button onClick={uploadPassport} disabled={submittingPassport || !passportFile} className="w-full rounded-2xl">
                <UploadCloud className="mr-2 h-4 w-4" />
                {submittingPassport ? 'Uploading...' : 'Upload Passport'}
              </Button>
              {passportStatus && <p className={`text-sm ${passportStatus.includes('successfully') ? 'text-emerald-600' : 'text-red-500'}`}>{passportStatus}</p>}
            </div>
          )}
        </Card>

        {/* Other Documents */}
        <Card className="rounded-[2rem] border bg-white p-6 shadow-sm dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-primary/10 p-3 text-primary"><FileUp className="h-5 w-5" /></div>
            <div>
              <h2 className="text-xl font-bold">Other documents</h2>
              <p className="text-sm text-muted-foreground">Upload certificates and identity documents.</p>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            <label className="block">
              <span className="mb-2 block text-sm font-medium">Document type</span>
              <select value={docType} onChange={(e) => setDocType(e.target.value)} className="w-full rounded-2xl border border-border bg-white dark:bg-slate-800 px-4 py-3 text-sm">
                {documentTypes.filter((item) => !uploadedDocumentTypes.has(item.value) && item.value !== 'passport_photo').map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
                {documentTypes.filter((item) => !uploadedDocumentTypes.has(item.value) && item.value !== 'passport_photo').length === 0 && (
                  <option value="" disabled>All documents uploaded</option>
                )}
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium">Upload file (JPG, PNG, or PDF · max 2MB)</span>
              <input type="file" accept={ACCEPTED_DOC_EXTENSIONS} className="w-full rounded-2xl border border-border bg-white dark:bg-slate-800 px-4 py-3 text-sm" onChange={handleDocFileChange} />
            </label>
            <Button onClick={uploadDocument} disabled={submittingDoc || !docFile} className="w-full rounded-2xl">
              <FileUp className="mr-2 h-4 w-4" />
              {submittingDoc ? 'Uploading...' : 'Upload document'}
            </Button>
            {docStatus && <p className={`text-sm ${docStatus.includes('successfully') ? 'text-emerald-600' : 'text-red-500'}`}>{docStatus}</p>}
          </div>
        </Card>
      </div>

      {/* Uploaded Documents List */}
      <Card className="rounded-[2rem] border bg-white p-6 shadow-sm dark:bg-slate-900">
        <h2 className="text-2xl font-bold">Uploaded documents</h2>
        <div className="mt-5 space-y-3">
          {documents.length === 0 && !currentPassport ? (
            <div className="rounded-2xl border border-dashed border-border bg-slate-50 p-4 text-center text-sm text-muted-foreground dark:bg-slate-800/50">No documents uploaded yet.</div>
          ) : (
            [
              ...(currentPassport
                ? [{ id: currentPassport.id, document_type: 'passport_photo', file_name: currentPassport.file_name, verification_status: 'uploaded', file_url: currentPassport.image_url, uploaded_at: new Date().toISOString() }]
                : []),
              ...documents,
            ].map((doc) => (
              <div key={doc.id} className="rounded-2xl border border-border bg-slate-50 p-4 dark:bg-slate-800/50">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{doc.file_name}</p>
                    <p className="text-[10px] font-technical uppercase font-bold text-muted-foreground">{doc.document_type.replace('_', ' ')}</p>
                  </div>
                  {getStatusBadge(doc.verification_status)}
                </div>
                <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                  {doc.file_url && (
                    <a href={doc.file_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline">
                      <FileDown className="h-3 w-3" /> View / Download
                    </a>
                  )}
                  {doc.uploaded_at && <span>Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}</span>}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  )
}