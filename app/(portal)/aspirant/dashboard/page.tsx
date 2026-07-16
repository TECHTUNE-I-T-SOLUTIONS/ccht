'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BadgeCheck, CreditCard, FileDown, FileUp, HelpCircle, Sparkles, UploadCloud, UserRound, Award, Clock3, CheckCircle2, Lock, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'

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

// Accepted file types for document upload
const ACCEPTED_DOC_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/jpg',
  'application/pdf',
]
const ACCEPTED_DOC_EXTENSIONS = '.jpg,.jpeg,.png,.pdf'
const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB

// Accepted file types for passport photo
const ACCEPTED_PHOTO_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/jpg',
]
const ACCEPTED_PHOTO_EXTENSIONS = '.jpg,.jpeg,.png'
const MAX_PHOTO_SIZE = 2 * 1024 * 1024 // 2MB

function validateFile(file: File, allowedTypes: string[], maxSize: number, label: string): string | null {
  if (!allowedTypes.includes(file.type)) {
    const allowedExts = allowedTypes
      .map((t) => t.replace('image/', '.').replace('application/', '.'))
      .join(', ')
    return `${label} must be a ${allowedExts} file. Got: ${file.type || 'unknown type'}`
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
}

type UploadedPhoto = {
  id: string
  file_name: string
  image_url?: string | null
}

type ExamResult = {
  id: string
  score?: number | null
  grade?: string | null
  percentage?: number | null
  status?: string | null
  exam_type?: string | null
  submitted_at?: string | null
}

export default function AspirantDashboard() {
  const router = useRouter()
  const [passportFile, setPassportFile] = useState<File | null>(null)
  const [docType, setDocType] = useState('secondary_certificate')
  const [docFile, setDocFile] = useState<File | null>(null)
  const [summary, setSummary] = useState({ id: '', name: 'Student', email: '', avatarUrl: '' })
  const [documents, setDocuments] = useState<UploadedDocument[]>([])
  const [photos, setPhotos] = useState<UploadedPhoto[]>([])
  const [examResults, setExamResults] = useState<ExamResult[]>([])
  const [latestExamResult, setLatestExamResult] = useState<ExamResult | null>(null)
  const [appFeePaid, setAppFeePaid] = useState(false)
  const [adminFeePaid, setAdminFeePaid] = useState(false)
  const [matricNumber, setMatricNumber] = useState<string | null>(null)
  const [stage, setStage] = useState('signup')
  const [passportStatus, setPassportStatus] = useState('')
  const [docStatus, setDocStatus] = useState('')
  const [submittingPassport, setSubmittingPassport] = useState(false)
  const [submittingDoc, setSubmittingDoc] = useState(false)
  const [initiatingPayment, setInitiatingPayment] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const loadData = async () => {
    // Use a ref-style pattern to avoid blocking re-calls
    setIsLoading(true)
    
    // Helper to fetch with retry
    const fetchWithRetry = async (url: string, options?: RequestInit, retries = 3): Promise<Response> => {
      for (let i = 0; i < retries; i++) {
        try {
          const res = await fetch(url, options)
          return res
        } catch (err: any) {
          const isNetworkError = err?.cause?.code === 'EAI_AGAIN' || err?.code === 'EAI_AGAIN' || err?.message?.includes('fetch failed')
          if (isNetworkError && i < retries - 1) {
            console.warn(`[loadData] fetch ${url} attempt ${i + 1} failed, retrying...`)
            await new Promise(r => setTimeout(r, 2000 * (i + 1)))
            continue
          }
          throw err
        }
      }
      throw new Error(`Failed to fetch ${url} after ${retries} attempts`)
    }

    const [meRes, docsRes, photosRes, resultsRes, paymentStatusRes] = await Promise.all([
      fetchWithRetry('/api/v1/auth/me').catch(() => null),
      fetchWithRetry('/api/v1/admissions/documents').catch(() => null),
      fetchWithRetry('/api/v1/admissions/profile-photo').catch(() => null),
      fetchWithRetry('/api/v1/admissions/results').catch(() => null),
      fetchWithRetry('/api/v1/aspirant/payments/status').catch(() => null),
    ])

    const me = meRes ? await meRes.json().catch(() => null) : null
    const docs = docsRes ? await docsRes.json().catch(() => null) : null
    const pic = photosRes ? await photosRes.json().catch(() => null) : null
    const resPayload = resultsRes ? await resultsRes.json().catch(() => null) : null
    const paymentStatus = paymentStatusRes ? await paymentStatusRes.json().catch(() => null) : null

    const user = me?.user
    const profile = paymentStatus?.data?.profile
    const appPayment = paymentStatus?.data?.applicationFee
    const admissionPayment = paymentStatus?.data?.admissionFee
    
    setSummary({
      id: user?.id || '',
      name: user ? [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Student' : 'Student',
      email: user?.email || '',
      avatarUrl: user?.avatarUrl || '',
    })
    
    // Always update even if empty - this ensures UI refreshes properly
    setDocuments(docs?.data || [])
    
    // Reset docType to the first available option if current selection is no longer valid
    if (docs?.data) {
      const uploaded = new Set(docs.data.map((d: any) => d.document_type))
      const available = documentTypes.filter((item) => !uploaded.has(item.value))
      if (available.length > 0 && !available.find((a) => a.value === docType)) {
        setDocType(available[0].value)
      }
    }
    setPhotos(pic?.data || [])
    setExamResults(resPayload?.data || [])
    setLatestExamResult(resPayload?.data?.[0] || null)
    
    // Check payment status from both profile and payment records
    const appPaymentSuccess = profile?.application_fee_paid || appPayment?.status === 'success' || false
    const admissionPaymentSuccess = profile?.admission_fee_paid || admissionPayment?.status === 'success' || false
    
    setAppFeePaid(appPaymentSuccess)
    setAdminFeePaid(admissionPaymentSuccess)
    setStage(profile?.current_stage || 'signup')
    setMatricNumber(profile?.matric_number || null)
    
    setIsLoading(false)
    
    // If payment is successful but profile isn't updated, trigger profile update
    if (appPaymentSuccess && !profile?.application_fee_paid) {
      await fetch('/api/v1/aspirant/payments/sync-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentType: 'application' })
      }).catch(() => {})
      // Reload data after sync to get updated profile
      await loadData()
      return
    }
    
    if (admissionPaymentSuccess && !profile?.admission_fee_paid) {
      await fetch('/api/v1/aspirant/payments/sync-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentType: 'admission' })
      }).catch(() => {})
      // Reload data after sync to get updated profile
      await loadData()
      return
    }
  }

  useEffect(() => {
    loadData().catch((error) => console.error(error))
  }, [])

  const handlePassportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    if (file) {
      const error = validateFile(file, ACCEPTED_PHOTO_MIME_TYPES, MAX_PHOTO_SIZE, 'Passport photo')
      if (error) {
        setPassportStatus('')
        toast.error(error)
        e.target.value = '' // Clear the input
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
        e.target.value = '' // Clear the input
        return
      }
    }
    setDocFile(file)
    setDocStatus('')
  }

  const uploadPassport = async () => {
    if (!passportFile) return setPassportStatus('Choose a passport photo first.')
    
    // Double-check validation before upload
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
      
      // Add the uploaded photo to the photos array with image_url
      const uploadedPhoto = { ...payload.data, image_url: payload.data.image_url || payload.data.storage_path }
      setPhotos((prev) => [uploadedPhoto, ...prev])
      
      const docTypeUploaded = 'passport_photo'
      let documentRecord = payload.data.document
      
      // Compute if all docs uploaded USING CURRENT STATE + this upload (not waiting for setDocuments)
      const oldDocTypes = new Set(documents.map((d) => d.document_type))
      oldDocTypes.add(docTypeUploaded)
      const allTypes = documentTypes.map((d) => d.value)
      const nowAllUploaded = allTypes.every((type) => oldDocTypes.has(type))
      
      // Update documents state with the new upload
      if (documentRecord) {
        setDocuments((prev) => [
          {
            id: documentRecord.id,
            document_type: docTypeUploaded,
            file_name: documentRecord.file_name || passportFile.name,
            verification_status: documentRecord.verification_status || 'pending',
            file_url: documentRecord.file_url || uploadedPhoto.image_url,
            uploaded_at: documentRecord.uploaded_at || new Date().toISOString(),
          },
          ...prev,
        ])
      } else {
        // Fallback: create a local document entry
        setDocuments((prev) => [
          {
            id: uploadedPhoto.id,
            document_type: docTypeUploaded,
            file_name: uploadedPhoto.file_name || passportFile.name,
            verification_status: 'pending',
            file_url: uploadedPhoto.image_url,
            uploaded_at: new Date().toISOString(),
          },
          ...prev,
        ])
      }
      
      if (nowAllUploaded) {
        // Call the API to update profile stage to 'exam' and create notification
        fetch('/api/v1/admissions/complete-documents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
          .then(async (res) => {
            const data = await res.json()
            if (data.success) {
              toast.success('🎉 All documents uploaded! Entrance exam is now unlocked.')
              await loadData()
            } else {
              setTimeout(() => {
                setIsLoading(false)
                loadData()
              }, 1000)
            }
          })
          .catch(() => {
            setTimeout(() => {
              setIsLoading(false)
              loadData()
            }, 1000)
          })
      } else if (!documentRecord) {
        // Only reload if we didn't get a document record back from API
        setTimeout(() => {
          setIsLoading(false)
          loadData()
        }, 1200)
      }
      
      setPassportStatus('Passport photo uploaded successfully.')
      toast.success('Passport photo uploaded successfully.')
      setPassportFile(null)
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
    
    // Double-check validation before upload
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
      
      // Always reload data from API to ensure everything is in sync
      // This will update documents, uploadedDocumentTypes, and docType dropdown
      await loadData()
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Upload failed.'
      setDocStatus(msg)
      toast.error(msg)
    } finally {
      setSubmittingDoc(false)
    }
  }

  const initiateApplicationPayment = async () => {
    setInitiatingPayment(true)
    try {
      const response = await fetch('/api/v1/aspirant/payments/application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: summary.email }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Failed to initiate payment')
      
      // Load Paystack inline script
      const script = document.createElement('script')
      script.src = 'https://js.paystack.co/v1/inline.js'
      script.async = true
      script.onload = () => {
        const paystack = (window as any).PaystackPop
        paystack.setup({
          key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
          email: summary.email,
          amount: 6500 * 100, // in kobo
          ref: payload.data.reference,
          onClose: function() {
            toast.info('Payment closed')
            setInitiatingPayment(false)
          },
          callback: function(response: any) {
            // Verify payment with backend
            fetch('/api/v1/aspirant/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ reference: response.reference }),
            }).then(async (verifyRes) => {
              const verifyData = await verifyRes.json()
              if (verifyRes.ok && verifyData.success) {
                toast.success('Payment successful!')
                await loadData()
              } else {
                toast.error('Payment verification failed')
              }
              setInitiatingPayment(false)
            }).catch(() => {
              toast.error('Payment verification error')
              setInitiatingPayment(false)
            })
          },
        }).openIframe()
      }
      script.onerror = () => {
        toast.error('Failed to load payment gateway')
        setInitiatingPayment(false)
      }
      document.body.appendChild(script)
    } catch (err: any) {
      toast.error(err.message)
      setInitiatingPayment(false)
    }
  }

  const initiateAdmissionPayment = async () => {
    setInitiatingPayment(true)
    try {
      const response = await fetch('/api/v1/aspirant/payments/admission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: summary.email }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Failed to initiate payment')
      
      // Load Paystack inline script
      const script = document.createElement('script')
      script.src = 'https://js.paystack.co/v1/inline.js'
      script.async = true
      script.onload = () => {
        const paystack = (window as any).PaystackPop
        paystack.setup({
          key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
          email: summary.email,
          amount: 30000 * 100, // in kobo
          ref: payload.data.reference,
          onClose: function() {
            toast.info('Payment closed')
            setInitiatingPayment(false)
          },
          callback: function(response: any) {
            // Verify payment with backend
            fetch('/api/v1/aspirant/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ reference: response.reference }),
            }).then(async (verifyRes) => {
              const verifyData = await verifyRes.json()
              if (verifyRes.ok && verifyData.success) {
                toast.success('Payment successful!')
                await loadData()
              } else {
                toast.error('Payment verification failed')
              }
              setInitiatingPayment(false)
            }).catch(() => {
              toast.error('Payment verification error')
              setInitiatingPayment(false)
            })
          },
        }).openIframe()
      }
      script.onerror = () => {
        toast.error('Failed to load payment gateway')
        setInitiatingPayment(false)
      }
      document.body.appendChild(script)
    } catch (err: any) {
      toast.error(err.message)
      setInitiatingPayment(false)
    }
  }

  const acceptAdmissionAndMigrate = async () => {
    try {
      const res = await fetch('/api/v1/admissions/accept', { method: 'POST', headers: { 'Content-Type': 'application/json' } })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to accept admission')
      toast.success(data.message)
      setMatricNumber(data.matricNumber)
      await loadData()
      router.push('/student/dashboard')
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const uploadedDocumentTypes = useMemo(() => new Set(documents.map((doc) => doc.document_type)), [documents])
  const currentPassport = photos[0] || documents.find((doc) => doc.document_type === 'passport_photo') || null
  
  // All document types that must be uploaded before exam can be taken
  const allRequiredDocTypes = documentTypes.map((d) => d.value)
  const allDocumentsUploaded = allRequiredDocTypes.every((type) => uploadedDocumentTypes.has(type))
  const hasUploadedDocuments = documents.length > 0

  // Progressive steps configuration
  const steps = [
    {
      id: 'payment',
      title: 'Application Fee',
      description: 'Pay ₦6,500 to unlock the admission application',
      icon: CreditCard,
      completed: appFeePaid,
      locked: false,
      action: initiateApplicationPayment,
      actionLabel: 'Pay ₦6,500',
      detail: appFeePaid ? 'Payment completed' : 'Required to proceed',
    },
    {
      id: 'documents',
      title: 'Upload Documents',
      description: 'Upload all 8 required documents for review',
      icon: FileUp,
      completed: allDocumentsUploaded,
      locked: !appFeePaid,
      action: null,
      actionLabel: null,
      detail: allDocumentsUploaded
        ? 'All documents uploaded ✓'
        : `Uploaded: ${uploadedDocumentTypes.size} of ${allRequiredDocTypes.length}`,
    },
    {
      id: 'exam',
      title: 'Entrance Exam',
      description: 'Take the secure online screening exam',
      icon: Award,
      completed: examResults.length > 0,
      locked: !appFeePaid || !allDocumentsUploaded,
      action: null,
      actionLabel: 'Start Exam',
      link: '/aspirant/exam',
      detail: examResults.length > 0
        ? 'Exam completed'
        : allDocumentsUploaded
        ? 'Ready to start!'
        : 'Upload all documents first',
    },
    {
      id: 'admission_fee',
      title: 'Admission Charges',
      description: 'Pay ₦30,000 admission and administrative charges',
      icon: CreditCard,
      completed: adminFeePaid,
      locked: !appFeePaid || !hasUploadedDocuments || examResults.length === 0,
      action: initiateAdmissionPayment,
      actionLabel: 'Pay ₦30,000',
      detail: adminFeePaid ? 'Payment completed' : 'Requires exam completion',
    },
    {
      id: 'migration',
      title: 'Student Migration',
      description: 'Receive your matric number and move to the student portal',
      icon: UserRound,
      completed: !!matricNumber,
      locked: !adminFeePaid,
      action: acceptAdmissionAndMigrate,
      actionLabel: 'Accept & Move',
      detail: matricNumber ? `Active - ${matricNumber}` : 'Requires admission fee payment',
    },
  ]

  const currentStepIndex = steps.findIndex((step) => !step.completed && !step.locked)
  const currentStep = currentStepIndex >= 0 ? steps[currentStepIndex] : steps[steps.length - 1]

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="rounded-[2.5rem] border border-border bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.12),transparent_30%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--accent-soft)))] p-8 md:p-10">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-border bg-white dark:bg-slate-900">
              {summary.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={summary.avatarUrl} alt={summary.name} className="h-full w-full object-cover" />
              ) : (
                <UserRound className="h-8 w-8 text-primary" />
              )}
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Aspirant Workspace</p>
              <h1 className="mt-2 text-3xl font-extrabold md:text-5xl">Admission Dashboard</h1>
              <p className="mt-1 text-sm text-foreground/75">{summary.name} · {summary.email}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-primary/20 bg-white/90 dark:bg-slate-900/90 p-4 text-xs space-y-1 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="font-bold text-foreground">Current stage:</span>
              <span className="rounded-full bg-primary/10 px-3 py-1 font-extrabold uppercase tracking-wider text-primary">{stage}</span>
            </div>
            {matricNumber && <div className="font-bold text-emerald-600">Matric Number: {matricNumber}</div>}
          </div>
        </div>
      </div>

      {/* Progress Overview - Desktop */}
      <Card className="rounded-[2rem] border bg-white dark:bg-slate-900 p-6 shadow-sm hidden md:block">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Admission Progress</h2>
          <span className="text-sm text-muted-foreground">
            {steps.filter((s) => s.completed).length} of {steps.length} completed
          </span>
        </div>
        <div className="flex items-center gap-2">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <div key={step.id} className="flex-1">
                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                      step.completed
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600'
                        : step.locked
                        ? 'border-gray-300 bg-gray-100 text-gray-400 dark:border-gray-700 dark:bg-gray-800'
                        : 'border-primary bg-primary/10 text-primary'
                    }`}
                  >
                    {step.completed ? <CheckCircle2 className="h-5 w-5" /> : step.locked ? <Lock className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`h-0.5 flex-1 ${step.completed ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-700'}`} />
                  )}
                </div>
                <p className="mt-2 text-xs font-medium text-center truncate">{step.title}</p>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Progress Overview - Mobile */}
      <Card className="rounded-[2rem] border bg-white dark:bg-slate-900 p-6 shadow-sm md:hidden">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Admission Progress</h2>
          <span className="text-sm text-muted-foreground">
            {steps.filter((s) => s.completed).length} of {steps.length} completed
          </span>
        </div>
        <div className="space-y-3">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <div key={step.id} className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 ${
                    step.completed
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600'
                      : step.locked
                      ? 'border-gray-300 bg-gray-100 text-gray-400 dark:border-gray-700 dark:bg-gray-800'
                      : 'border-primary bg-primary/10 text-primary'
                  }`}
                >
                  {step.completed ? <CheckCircle2 className="h-5 w-5" /> : step.locked ? <Lock className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{step.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{step.detail}</p>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Current Step Detail */}
      <Card className="rounded-[2.5rem] border bg-white dark:bg-slate-900 p-8 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-primary/10 p-4 text-primary">
            {currentStep.completed ? (
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            ) : currentStep.locked ? (
              <Lock className="h-8 w-8 text-gray-400" />
            ) : (
              <currentStep.icon className="h-8 w-8" />
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold">{currentStep.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{currentStep.description}</p>
            <div className="mt-4 rounded-2xl border border-border bg-slate-50 dark:bg-slate-800/50 p-4">
              <p className="text-sm font-medium">Status: {currentStep.detail}</p>
            </div>
            {!currentStep.completed && !currentStep.locked && currentStep.action && (
              <Button
                onClick={currentStep.action}
                disabled={initiatingPayment}
                className="mt-4 rounded-xl border border-black dark:border-white bg-white dark:bg-slate-900 hover:bg-gray-300 dark:hover:bg-gray-500"
              >
                {currentStep.actionLabel}
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            )}
            {!currentStep.completed && !currentStep.locked && currentStep.link && (
              <Button asChild className="mt-4 rounded-xl border border-black dark:border-white bg-white dark:bg-slate-900 hover:bg-gray-300 dark:hover:bg-gray-500">
                <Link href={currentStep.link}>
                  {currentStep.actionLabel}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Exam Result Card */}
      {appFeePaid ? (
        <Card className="rounded-[2rem] border bg-white dark:bg-slate-900 p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-primary/10 p-3 text-primary">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Entrance exam</p>
              <h2 className="text-xl font-bold">Latest result</h2>
            </div>
          </div>
          {latestExamResult ? (
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-border bg-slate-50 dark:bg-slate-800/50 p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Score</p>
                <p className="mt-1 text-3xl font-black text-primary">{latestExamResult.percentage ?? latestExamResult.score ?? 0}%</p>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-border bg-slate-50 dark:bg-slate-800/50 p-4">
                <span className="text-sm text-muted-foreground">Grade</span>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">{latestExamResult.grade || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-border bg-slate-50 dark:bg-slate-800/50 p-4">
                <span className="text-sm text-muted-foreground">Status</span>
                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-600">
                  {latestExamResult.status || 'submitted'}
                </span>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-border bg-slate-50 dark:bg-slate-800/50 p-5 text-sm text-muted-foreground">
              No entrance exam result yet. Once the exam is submitted, your score will appear here in real time.
            </div>
          )}
        </Card>
      ) : (
        <Card className="rounded-[2rem] border border-dashed border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/50 p-6 shadow-sm opacity-60">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-gray-200 p-3 text-gray-400 dark:bg-gray-800">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">Entrance exam</p>
              <h2 className="text-xl font-bold text-gray-400">Locked</h2>
            </div>
          </div>
          <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900">
            Complete the application fee payment to unlock this section.
          </div>
        </Card>
      )}

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Passport Photo Upload */}
        {appFeePaid ? (
          <Card className="rounded-[2rem] border bg-white dark:bg-slate-900 p-6 shadow-sm">
            <h2 className="text-2xl font-bold">Passport photo</h2>
            <p className="mt-1 text-sm text-muted-foreground">Upload a clean passport photo for your record and ID card.</p>
            {currentPassport?.image_url ? (
              <div className="mt-5 rounded-2xl border border-border bg-slate-50 dark:bg-slate-800/50 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <p className="text-sm font-semibold text-emerald-600">Passport photo uploaded</p>
                </div>
                <div className="overflow-hidden rounded-2xl border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={currentPassport.image_url} alt="Uploaded passport" className="h-48 w-full object-cover" />
                </div>
                <a href={currentPassport.image_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-xs font-semibold text-primary underline-offset-4 hover:underline">
                  View / Download File
                </a>
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-dashed border-border bg-slate-50 dark:bg-slate-800/50 p-5">
                <p className="text-sm font-semibold">Choose passport photo</p>
                <p className="text-xs text-muted-foreground">
                  {passportFile ? passportFile.name : 'JPG or PNG · max 2MB'}
                </p>
                <input
                  type="file"
                  accept={ACCEPTED_PHOTO_EXTENSIONS}
                  className="mt-4 w-full text-sm"
                  onChange={handlePassportFileChange}
                />
                <Button onClick={uploadPassport} disabled={submittingPassport || !passportFile} className="mt-4 rounded-2xl">
                  <UploadCloud className="mr-2 h-4 w-4" />
                  {submittingPassport ? 'Uploading...' : 'Upload Passport'}
                </Button>
                {passportStatus && (
                  <p className={`mt-3 text-sm ${passportStatus.includes('successfully') ? 'text-emerald-600' : 'text-red-500'}`}>
                    {passportStatus}
                  </p>
                )}
              </div>
            )}
          </Card>
        ) : (
          <Card className="rounded-[2rem] border border-dashed border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/50 p-6 shadow-sm opacity-60">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-2xl bg-gray-200 p-3 text-gray-400 dark:bg-gray-800">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-400">Passport photo</h2>
                <p className="text-sm text-gray-500">Locked</p>
              </div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900">
              Complete the application fee payment to unlock this section.
            </div>
          </Card>
        )}

        {/* Document Upload */}
        {appFeePaid ? (
          <Card className="rounded-[2rem] border bg-white dark:bg-slate-900 p-6 shadow-sm">
            <h2 className="text-2xl font-bold">Admission documents</h2>
            <p className="mt-1 text-sm text-muted-foreground">Upload the required records for admission review and verification.</p>
            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium">Document type</span>
                <select value={docType} onChange={(e) => setDocType(e.target.value)} className="w-full rounded-2xl border border-border bg-white dark:bg-slate-800 px-4 py-3 text-sm">
                  {documentTypes.filter((item) => !uploadedDocumentTypes.has(item.value)).map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                  {documentTypes.filter((item) => uploadedDocumentTypes.has(item.value)).length === documentTypes.length && (
                    <option value="" disabled>All documents uploaded</option>
                  )}
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium">Upload file (JPG, PNG, or PDF · max 2MB)</span>
                <input
                  type="file"
                  accept={ACCEPTED_DOC_EXTENSIONS}
                  className="w-full rounded-2xl border border-border bg-white dark:bg-slate-800 px-4 py-3 text-sm"
                  onChange={handleDocFileChange}
                />
              </label>
              <Button onClick={uploadDocument} disabled={submittingDoc || !docFile} className="w-full rounded-2xl">
                <FileUp className="mr-2 h-4 w-4" />
                {submittingDoc ? 'Uploading...' : 'Upload document'}
              </Button>
              {docStatus && (
                <p className={`text-sm ${docStatus.includes('successfully') ? 'text-emerald-600' : 'text-red-500'}`}>
                  {docStatus}
                </p>
              )}
            </div>
          </Card>
        ) : (
          <Card className="rounded-[2rem] border border-dashed border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/50 p-6 shadow-sm opacity-60">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-2xl bg-gray-200 p-3 text-gray-400 dark:bg-gray-800">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-400">Admission documents</h2>
                <p className="text-sm text-gray-500">Locked</p>
              </div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900">
              Complete the application fee payment to unlock this section.
            </div>
          </Card>
        )}
      </div>

      {/* Uploaded Documents List */}
      {appFeePaid ? (
        <Card className="rounded-[2rem] border bg-white dark:bg-slate-900 p-6 shadow-sm">
          <h2 className="text-2xl font-bold">Uploaded documents</h2>
          <div className="mt-5 space-y-3">
            {documents.length === 0 && !currentPassport ? (
              <div className="rounded-2xl border border-dashed border-border bg-slate-50 dark:bg-slate-800/50 p-4 text-center text-sm text-muted-foreground">No documents uploaded yet.</div>
            ) : (
              [
                ...(currentPassport
                  ? [{ id: currentPassport.id, document_type: 'passport_photo', file_name: currentPassport.file_name, verification_status: 'uploaded', file_url: currentPassport.image_url }]
                  : []),
                ...documents,
              ].map((doc) => (
                <div key={doc.id} className="rounded-2xl border border-border bg-slate-50 dark:bg-slate-800/50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{doc.file_name}</p>
                      <p className="text-[10px] font-technical uppercase font-bold text-muted-foreground">{doc.document_type.replace('_', ' ')}</p>
                    </div>
                    <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{doc.verification_status}</span>
                  </div>
                  {doc.file_url && (
                    <a href={doc.file_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-xs font-semibold text-primary underline-offset-4 hover:underline">
                      View / Download File
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>
      ) : (
        <Card className="rounded-[2rem] border border-dashed border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/50 p-6 shadow-sm opacity-60">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-2xl bg-gray-200 p-3 text-gray-400 dark:bg-gray-800">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-400">Uploaded documents</h2>
              <p className="text-sm text-gray-500">Locked</p>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900">
            Complete the application fee payment to unlock this section.
          </div>
        </Card>
      )}

      {/* Admission Status */}
      <Card className="rounded-[2rem] border bg-white dark:bg-slate-900 p-6 shadow-sm">
        <h2 className="text-2xl font-bold">Admission status</h2>
        {matricNumber ? (
          <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/10 p-5">
            <div className="flex items-center gap-3">
              <BadgeCheck className="h-8 w-8 text-emerald-600" />
              <div>
                <h4 className="font-bold">Admission accepted</h4>
                <p className="text-xs text-muted-foreground">You can now continue in the student portal.</p>
              </div>
            </div>
            <div className="mt-4 rounded-xl border bg-white dark:bg-slate-800 p-4 text-xs font-technical">
              <div><strong>Student ID:</strong> {matricNumber}</div>
              <div><strong>Portal State:</strong> Migrated to Student Portal</div>
            </div>
            <div className="mt-4 space-y-2">
              <Button variant="outline" className="w-full justify-start rounded-xl text-xs" asChild>
                <Link href="#">
                  <FileDown className="mr-2 h-4 w-4 text-emerald-600" />
                  Download Admission Letter
                </Link>
              </Button>
              <Button asChild className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700">
                <Link href="/student/dashboard">Go to Student Portal</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-4 flex gap-3 rounded-2xl border border-border bg-slate-50 dark:bg-slate-800/50 p-4 text-sm text-muted-foreground">
            <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <p>Complete the steps in order. After documents are verified and the entrance exam is done, you can pay the admission fee and accept your offer.</p>
          </div>
        )}
      </Card>
    </div>
  )
}