'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BadgeCheck, CreditCard, FileDown, FileUp, HelpCircle, Sparkles, UploadCloud, UserRound, Award, Clock3, CheckCircle2, Lock, ChevronRight, X, AlertTriangle, Trash2, Phone, Calendar, MapPin, User } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { checkProfileCompletionAction, updateAspirantProfileAction, checkOfferStatusAction, respondToOfferAction } from '@/app/actions/aspirant/profile-actions'

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
  uploaded_at?: string | null
  mime_type?: string | null
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

type AspirantProfile = {
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
  application_fee_paid?: boolean
  admission_fee_paid?: boolean
  exam_completed?: boolean
  exam_score?: number
  exam_grade?: string
  matric_number?: string | null
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
  const [profile, setProfile] = useState<AspirantProfile | null>(null)
  const [stage, setStage] = useState('signup')
  const [passportStatus, setPassportStatus] = useState('')
  const [docStatus, setDocStatus] = useState('')
  const [submittingPassport, setSubmittingPassport] = useState(false)
  const [submittingDoc, setSubmittingDoc] = useState(false)
  const [initiatingPayment, setInitiatingPayment] = useState(false)
  const [reverifyingPayment, setReverifyingPayment] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  // Modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [previewDocument, setPreviewDocument] = useState<UploadedDocument | null>(null)
  const [completingDocuments, setCompletingDocuments] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [documentToDelete, setDocumentToDelete] = useState<{ id: string; type: string; name: string } | null>(null)
  
  // Profile completion modal states
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [profileData, setProfileData] = useState({
    phone: '',
    gender: '',
    nationality: 'Nigerian',
    dateOfBirth: '',
    stateOfOrigin: ''
  })
  const [submittingProfile, setSubmittingProfile] = useState(false)
  const [profileChecked, setProfileChecked] = useState(false)

  // Offer modal states
  const [showOfferModal, setShowOfferModal] = useState(false)
  const [offerDetails, setOfferDetails] = useState<any>(null)
  const [respondingToOffer, setRespondingToOffer] = useState(false)
  const [offerChecked, setOfferChecked] = useState(false)

  // Migration success modal state
  const [showMigrationSuccessModal, setShowMigrationSuccessModal] = useState(false)
  const [migrationDismissed, setMigrationDismissed] = useState(false)

  const loadData = async () => {
    setIsLoading(true)
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
    
    setDocuments(docs?.data || [])
    
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
    
    const appPaymentSuccess = profile?.application_fee_paid || appPayment?.status === 'success' || false
    const admissionPaymentSuccess = profile?.admission_fee_paid || admissionPayment?.status === 'success' || false
    
    setAppFeePaid(appPaymentSuccess)
    setAdminFeePaid(admissionPaymentSuccess)
    setStage(profile?.current_stage || 'signup')
    setProfile(profile)
    
    // Show migration success modal if status is migrated and not yet dismissed
    if (profile?.application_status === 'migrated' && !migrationDismissed) {
      setShowMigrationSuccessModal(true)
    }
    
    setIsLoading(false)
    
    if (appPaymentSuccess && !profile?.application_fee_paid) {
      await fetch('/api/v1/aspirant/payments/sync-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentType: 'application' })
      }).catch(() => {})
      await loadData()
      return
    }
    
    if (admissionPaymentSuccess && !profile?.admission_fee_paid) {
      await fetch('/api/v1/aspirant/payments/sync-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentType: 'admission' })
      }).catch(() => {})
      await loadData()
      return
    }
  }

  useEffect(() => {
    loadData().catch((error) => console.error(error))
  }, [])

  useEffect(() => {
    const checkProfileCompletion = async () => {
      if (summary.id && !profileChecked) {
        try {
          const res = await checkProfileCompletionAction(summary.id)
          if (res.success && res.data && !res.data.isComplete) {
            setShowProfileModal(true)
          }
          setProfileChecked(true)
        } catch (error) {
          console.error('Error checking profile completion:', error)
        }
      }
    }
    checkProfileCompletion()
  }, [summary.id, profileChecked])

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmittingProfile(true)
    try {
      const res = await updateAspirantProfileAction(summary.id, profileData)
      if (res.success) {
        toast.success('Profile details updated successfully')
        setShowProfileModal(false)
        setProfileChecked(true)
      } else {
        toast.error(res.error || 'Failed to update profile details')
      }
    } catch (error) {
      toast.error('An error occurred while updating profile')
    } finally {
      setSubmittingProfile(false)
    }
  }

  useEffect(() => {
    const checkOfferStatus = async () => {
      if (summary.id && !offerChecked) {
        try {
          const res = await checkOfferStatusAction(summary.id)
          if (res.success && res.data && res.data.hasOffer) {
            setOfferDetails(res.data.offerDetails)
            setShowOfferModal(true)
          }
          setOfferChecked(true)
        } catch (error) {
          console.error('Error checking offer status:', error)
        }
      }
    }
    checkOfferStatus()
  }, [summary.id, offerChecked])

  const handleOfferResponse = async (accept: boolean) => {
    setRespondingToOffer(true)
    try {
      const res = await respondToOfferAction(summary.id, accept)
      if (res.success) {
        if (accept) {
          toast.success('Congratulations! You have accepted the admission offer.')
          setShowOfferModal(false)
          // Reload to show updated status
          await loadData()
        } else {
          toast.success('You have declined the admission offer.')
          setShowOfferModal(false)
          await loadData()
        }
      } else {
        toast.error(res.error || 'Failed to respond to offer')
      }
    } catch (error) {
      toast.error('An error occurred while responding to offer')
    } finally {
      setRespondingToOffer(false)
    }
  }

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
      
      const uploadedPhoto = { ...payload.data, image_url: payload.data.image_url || payload.data.storage_path }
      setPhotos((prev) => [uploadedPhoto, ...prev])
      
      const docTypeUploaded = 'passport_photo'
      let documentRecord = payload.data.document
      
      const oldDocTypes = new Set(documents.map((d) => d.document_type))
      oldDocTypes.add(docTypeUploaded)
      const allTypes = documentTypes.map((d) => d.value)
      const nowAllUploaded = allTypes.every((type) => oldDocTypes.has(type))
      
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
      
      const script = document.createElement('script')
      script.src = 'https://js.paystack.co/v1/inline.js'
      script.async = true
      script.onload = () => {
        const paystack = (window as any).PaystackPop
        paystack.setup({
          key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
          email: summary.email,
          amount: 6500 * 100,
          ref: payload.data.reference,
          onClose: function() {
            toast.info('Payment closed')
            setInitiatingPayment(false)
          },
          callback: function(response: any) {
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
      
      const script = document.createElement('script')
      script.src = 'https://js.paystack.co/v1/inline.js'
      script.async = true
      script.onload = () => {
        const paystack = (window as any).PaystackPop
        paystack.setup({
          key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
          email: summary.email,
          amount: 30000 * 100,
          ref: payload.data.reference,
          onClose: function() {
            toast.info('Payment closed')
            setInitiatingPayment(false)
          },
          callback: function(response: any) {
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
      await loadData()
      router.push('/student/dashboard')
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const reverifyAdmissionPayment = async () => {
    setReverifyingPayment(true)
    try {
      // Get the latest admission payment
      const response = await fetch('/api/v1/aspirant/payments/status')
      const data = await response.json()
      
      if (!response.ok || !data.success) {
        throw new Error('Failed to fetch payment status')
      }

      const admissionPayment = data.data?.admissionFee
      if (!admissionPayment || !admissionPayment.paystack_reference) {
        throw new Error('No pending payment found to verify')
      }

      // Verify the payment
      const verifyRes = await fetch('/api/v1/aspirant/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: admissionPayment.paystack_reference }),
      })
      
      const verifyData = await verifyRes.json()
      
      if (verifyRes.ok && verifyData.success) {
        toast.success('Payment verified successfully!')
        await loadData()
      } else {
        toast.error(verifyData.error || 'Payment verification failed')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to reverify payment')
    } finally {
      setReverifyingPayment(false)
    }
  }

  const handleCompleteDocuments = async () => {
    setCompletingDocuments(true)
    try {
      const response = await fetch('/api/v1/admissions/complete-documents', {
        method: 'POST',
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.error || 'Unable to complete documents')
      
      toast.success(payload.message || 'Documents completed successfully!')
      setShowConfirmModal(false)
      
      await loadData()
      
      setTimeout(() => {
        window.location.href = '/aspirant/exam'
      }, 1500)
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to complete documents'
      toast.error(msg)
    } finally {
      setCompletingDocuments(false)
    }
  }
  
  const canAccessExam = stage === 'exam' || stage === 'admission_fee' || stage === 'migration'

  const openPreview = (doc: UploadedDocument) => {
    setPreviewDocument(doc)
    setShowPreviewModal(true)
  }

  const getPreviewUrl = (doc: UploadedDocument): string => {
    if (!doc.file_url) return ''
    return doc.file_url
  }

  const deleteDocument = async (docId: string, docType: string, docName: string) => {
    setDocumentToDelete({ id: docId, type: docType, name: docName })
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!documentToDelete) return

    try {
      const response = await fetch(`/api/v1/admissions/documents/${documentToDelete.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete document')
      }

      toast.success('Document deleted successfully. You can reupload it now.')
      setShowDeleteModal(false)
      setDocumentToDelete(null)
      
      await loadData()
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to delete document'
      toast.error(msg)
    }
  }

  const uploadedDocumentTypes = useMemo(() => new Set(documents.map((doc) => doc.document_type)), [documents])
  const currentPassport = photos[0] || documents.find((doc) => doc.document_type === 'passport_photo') || null
  
  // Required documents (excluding optional JAMB registration form)
  const requiredDocumentTypes = documentTypes.filter((d) => d.value !== 'jamb_registration_form')
  const allRequiredDocTypes = requiredDocumentTypes.map((d) => d.value)
  const allRequiredDocumentsUploaded = allRequiredDocTypes.every((type) => uploadedDocumentTypes.has(type))
  const allDocumentsUploaded = documentTypes.map((d) => d.value).every((type) => uploadedDocumentTypes.has(type))
  const hasUploadedDocuments = documents.length > 0
  const hasJamb = uploadedDocumentTypes.has('jamb_registration_form')
  
  // Check if stage is documents or later for proceed button
  // Check if stage is exam or later for read-only documents (hide upload forms)
  const stageOrder = ['signup', 'payment', 'documents', 'exam', 'admission_fee', 'migration']
  const currentStageIndex = stageOrder.indexOf(stage)
  const isDocumentsOrLater = currentStageIndex >= stageOrder.indexOf('documents')
  const isExamOrLater = currentStageIndex >= stageOrder.indexOf('exam')
  const isAdmissionFeeOrLater = currentStageIndex >= stageOrder.indexOf('admission_fee')

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
      description: 'Upload all required documents for review',
      icon: FileUp,
      completed: allRequiredDocumentsUploaded,
      locked: !appFeePaid,
      action: null,
      actionLabel: null,
      detail: allRequiredDocumentsUploaded
        ? 'All required documents uploaded ✓'
        : `Uploaded: ${uploadedDocumentTypes.size} of ${allRequiredDocTypes.length}`,
    },
    ...(isAdmissionFeeOrLater ? [] : [{
      id: 'exam',
      title: 'Entrance Exam',
      description: 'Take the secure online screening exam',
      icon: Award,
      completed: examResults.length > 0,
      locked: !appFeePaid || !allRequiredDocumentsUploaded,
      action: null,
      actionLabel: examResults.length > 0 ? null : 'Start Exam',
      link: examResults.length > 0 ? null : '/aspirant/exam',
      detail: examResults.length > 0
        ? 'Exam completed ✓'
        : allRequiredDocumentsUploaded
        ? 'Ready to start!'
        : 'Complete required documents first',
    }]),
    {
      id: 'admission_fee',
      title: 'Admission Charges',
      description: 'Pay ₦30,000 admission and administrative charges',
      icon: CreditCard,
      completed: adminFeePaid,
      locked: stage !== 'admission_fee' && stage !== 'migration' && !['pending_payment', 'admitted'].includes(profile?.application_status || ''),
      action: initiateAdmissionPayment,
      actionLabel: 'Pay ₦30,000',
      detail: adminFeePaid 
        ? 'Payment completed' 
        : profile?.application_status === 'pending_payment'
        ? 'Pay to accept admission'
        : profile?.application_status === 'admitted'
        ? 'Payment required'
        : 'Awaiting admission decision',
    },
    {
      id: 'migration',
      title: 'Student Migration',
      description: 'Receive your matric number and move to the student portal',
      icon: UserRound,
      completed: profile?.application_status === 'migrated',
      locked: !adminFeePaid,
      action: null,
      actionLabel: null,
      detail: profile?.application_status === 'migrated'
        ? `Migrated - Matric: ${profile.matric_number || 'Pending'}`
        : profile?.application_status === 'admitted'
        ? 'Awaiting migration by admin'
        : 'Requires admission fee payment',
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
            <div className="font-bold text-emerald-600">Matric Number: {profile?.matric_number || 'Not assigned'}</div>
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
              <div className="mt-4 flex gap-3">
                <Button
                  onClick={currentStep.action}
                  disabled={initiatingPayment}
                  className="rounded-xl border border-black dark:border-white bg-white dark:bg-slate-900 hover:bg-gray-300 dark:hover:bg-gray-500"
                >
                  {currentStep.actionLabel}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
                {currentStep.id === 'admission_fee' && (
                  <Button
                    onClick={reverifyAdmissionPayment}
                    disabled={reverifyingPayment}
                    variant="outline"
                    className="rounded-xl"
                  >
                    {reverifyingPayment ? 'Reverifying...' : 'Reverify Payment'}
                  </Button>
                )}
              </div>
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

      {/* Admission Review Card - Show when stage is admission_fee */}
      {stage === 'admission_fee' && (
        <Card className="rounded-[2rem] border border-blue-500/20 bg-blue-500/5 dark:bg-blue-500/10 p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-blue-500/10 p-3">
              <Clock3 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Admission Review</p>
              <h2 className="text-xl font-bold">Under Review</h2>
            </div>
          </div>
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-blue-500/20 bg-white dark:bg-slate-800/50 p-5">
              <div className="flex items-start gap-3">
                <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-semibold text-foreground">Your application is being reviewed</p>
                  <p className="mt-1">The admissions committee is reviewing your application, documents, and entrance exam results. You will be notified once a decision has been made.</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 dark:bg-amber-500/10">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-semibold text-foreground">Next Steps</p>
                  <p className="mt-1">Once your admission is approved, you will be able to pay the admission fee to secure your place and proceed to student registration.</p>
                </div>
              </div>
            </div>
            {profile?.application_status && (
              <div className="flex items-center justify-between rounded-2xl border border-border bg-slate-50 dark:bg-slate-800/50 p-4">
                <span className="text-sm text-muted-foreground">Application Status</span>
                <span className="rounded-full bg-blue-500/10 px-3 py-1 text-sm font-semibold text-blue-600 capitalize">
                  {profile.application_status.replace('_', ' ')}
                </span>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Exam Result Card - Show only when stage is before admission_fee */}
      {appFeePaid && stage !== 'admission_fee' && stage !== 'migration' ? (
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
        {appFeePaid && !isAdmissionFeeOrLater ? (
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
        ) : isExamOrLater && !isAdmissionFeeOrLater && currentPassport ? (
          <Card className="rounded-[2rem] border bg-white dark:bg-slate-900 p-6 shadow-sm">
            <h2 className="text-2xl font-bold">Passport photo</h2>
            <p className="mt-1 text-sm text-muted-foreground">Your passport photo has been submitted for review.</p>
            <div className="mt-5 rounded-2xl border border-border bg-slate-50 dark:bg-slate-800/50 p-5">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <p className="text-sm font-semibold text-emerald-600">Passport photo uploaded</p>
              </div>
              <div className="overflow-hidden rounded-2xl border border-border">
                <img src={currentPassport.image_url || ''} alt="Uploaded passport" className="h-48 w-full object-cover" />
              </div>
              <a href={currentPassport.image_url || ''} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-xs font-semibold text-primary underline-offset-4 hover:underline">
                View / Download File
              </a>
            </div>
          </Card>
        ) : !isAdmissionFeeOrLater ? (
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
        ) : null}

        {/* Document Upload */}
        {appFeePaid && !isAdmissionFeeOrLater ? (
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
        ) : isExamOrLater && !isAdmissionFeeOrLater ? (
          <Card className="rounded-[2rem] border bg-white dark:bg-slate-900 p-6 shadow-sm">
            <h2 className="text-2xl font-bold">Admission documents</h2>
            <p className="mt-1 text-sm text-muted-foreground">Your documents have been submitted for review.</p>
            <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 dark:bg-emerald-500/10">
              <div className="flex items-center gap-2">
                <BadgeCheck className="h-5 w-5 text-emerald-600" />
                <p className="text-sm font-semibold text-emerald-600">Documents submitted for review</p>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Your documents are now being reviewed by the admissions team. You cannot modify them at this stage.</p>
            </div>
          </Card>
        ) : !isAdmissionFeeOrLater ? (
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
        ) : null}
      </div>

      {/* Uploaded Documents List */}
      {appFeePaid && !isAdmissionFeeOrLater ? (
        <Card className="rounded-[2.5rem] border bg-white dark:bg-slate-900 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Uploaded documents</h2>
            {isExamOrLater ? (
              <BadgeCheck className="h-6 w-6 text-emerald-600" />
            ) : isDocumentsOrLater && allRequiredDocumentsUploaded && (
              <Button
                onClick={() => setShowConfirmModal(true)}
                className="rounded-2xl bg-emerald-600 hover:bg-emerald-700"
              >
                <ChevronRight className="mr-2 h-4 w-4" />
                Proceed to Entrance Exam
              </Button>
            )}
          </div>
          {isExamOrLater && (
            <div className="mt-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-muted-foreground dark:bg-emerald-500/10">
              <p className="font-semibold text-foreground">Documents submitted for review</p>
              <p>Your documents have been submitted and are now being reviewed. You cannot modify them at this stage.</p>
            </div>
          )}
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
                  <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                    {doc.file_url && (
                      <button
                        onClick={() => openPreview(doc)}
                        className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
                      >
                        <FileDown className="h-3 w-3" /> View Document
                      </button>
                    )}
                    {!isExamOrLater && (
                      <button
                        onClick={() => deleteDocument(doc.id, doc.document_type, doc.file_name)}
                        className="inline-flex items-center gap-1 text-red-600 underline-offset-4 hover:underline"
                      >
                        <Trash2 className="h-3 w-3" /> Delete
                      </button>
                    )}
                    {doc.uploaded_at && <span>Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      ) : (
        <Card className="rounded-[2.5rem] border border-dashed border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/50 p-6 shadow-sm opacity-60">
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

      {/* Confirmation Modal - Responsive */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 sm:p-6">
          <Card className="w-full max-w-md rounded-[2rem] border bg-white p-6 sm:p-8 shadow-xl dark:bg-slate-900">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10">
                <AlertTriangle className="h-8 w-8 text-amber-600" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-foreground">Proceed to Entrance Exam?</h3>
              <p className="mt-3 text-xs sm:text-sm text-muted-foreground">
                Are you ready to proceed? Once you confirm, your documents will be submitted for review and you will be redirected to the entrance exam.
              </p>
              {!hasJamb && (
                <div className="mt-3 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-3 text-left text-xs text-muted-foreground dark:bg-blue-500/10">
                  <p className="font-semibold text-foreground">Note:</p>
                  <p>You have not uploaded your JAMB registration form. This is optional, and you can still proceed to the exam.</p>
                </div>
              )}
              <div className="mt-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-3 text-left text-xs text-muted-foreground dark:bg-red-500/10">
                <p className="font-semibold text-foreground">Important:</p>
                <p>Once you confirm, you won't be able to alter or delete your uploaded documents. Please review all documents carefully before proceeding.</p>
              </div>
            </div>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={() => setShowConfirmModal(false)}
                disabled={completingDocuments}
                className="h-12 rounded-2xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCompleteDocuments}
                disabled={completingDocuments}
                className="h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700"
              >
                {completingDocuments ? 'Processing...' : 'Yes, Proceed to Exam'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Document Preview Modal - Responsive */}
      {showPreviewModal && previewDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-6" onClick={() => setShowPreviewModal(false)}>
          <Card className="w-full max-w-5xl max-h-[95vh] sm:max-h-[90vh] rounded-[2.5rem] border bg-white p-4 sm:p-6 shadow-xl dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg sm:text-xl font-bold text-foreground truncate">Document Preview</h3>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">{previewDocument.file_name}</p>
              </div>
              <Button
                variant="ghost"
                onClick={() => setShowPreviewModal(false)}
                className="h-8 w-8 sm:h-10 sm:w-10 rounded-full p-0 flex-shrink-0 ml-2"
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </div>
            <div className="mt-3 sm:mt-4 flex max-h-[60vh] sm:max-h-[70vh] items-center justify-center overflow-auto rounded-2xl border border-border bg-slate-50 dark:bg-slate-800/50">
              {previewDocument.file_url?.match(/\.(jpg|jpeg|png|gif|webp)$/i) || previewDocument.mime_type?.startsWith('image/') ? (
                <img src={getPreviewUrl(previewDocument)} alt={previewDocument.file_name} className="max-w-full max-h-[60vh] sm:max-h-[70vh] object-contain" />
              ) : previewDocument.file_url?.match(/\.pdf$/i) || previewDocument.mime_type === 'application/pdf' ? (
                <div className="flex flex-col items-center justify-center gap-4 p-8">
                  <FileDown className="h-16 w-16 text-muted-foreground" />
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground mb-2">PDF Document</p>
                    <p className="text-xs text-muted-foreground mb-4">Click the button below to view or download</p>
                    <a 
                      href={getPreviewUrl(previewDocument)} 
                      target="_blank" 
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary/90"
                    >
                      <FileDown className="h-4 w-4" />
                      Open PDF Document
                    </a>
                  </div>
                </div>
              ) : (
                <div className="p-4 sm:p-8 text-center text-muted-foreground">
                  <FileDown className="mx-auto mb-4 h-10 w-10 sm:h-12 sm:w-12" />
                  <p className="text-sm sm:text-base">Preview not available for this file type</p>
                  <a href={getPreviewUrl(previewDocument)} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-primary underline">
                    Download to view
                  </a>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal - Responsive */}
      {showDeleteModal && documentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 sm:p-6" onClick={() => setShowDeleteModal(false)}>
          <Card className="w-full max-w-md rounded-[2rem] border bg-white p-6 sm:p-8 shadow-xl dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-foreground">Delete Document?</h3>
              <p className="mt-3 text-xs sm:text-sm text-muted-foreground">
                Are you sure you want to delete <strong>{documentToDelete.name}</strong>? You can reupload this document later if needed.
              </p>
              <div className="mt-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3 text-left text-xs text-muted-foreground dark:bg-amber-500/10">
                <p className="font-semibold text-foreground">Note:</p>
                <p>This action can be undone by reuploading the document. The document will be removed from your uploaded list and will appear in the document type dropdown again.</p>
              </div>
            </div>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false)
                  setDocumentToDelete(null)
                }}
                className="h-12 rounded-2xl"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDelete}
                className="h-12 rounded-2xl bg-red-600 hover:bg-red-700"
              >
                Yes, Delete
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Profile Completion Modal - Compulsory */}
      {showProfileModal && (
        <Dialog open={showProfileModal} onOpenChange={(open) => {
          // Prevent closing unless form is submitted successfully
          if (!open && !profileChecked) return
          setShowProfileModal(open)
        }}>
          <DialogContent 
            className="bg-white dark:bg-black sm:max-w-[500px] z-[100]"
            onPointerDownOutside={(e) => e.preventDefault()}
            onEscapeKeyDown={(e) => e.preventDefault()}
          >
            <DialogHeader>
              <DialogTitle>Complete Your Profile</DialogTitle>
              <DialogDescription>
                Please provide the following required information to continue with your application. This is required before you can proceed.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <Input
                  type="tel"
                  placeholder="e.g., 08012345678"
                  required
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Gender <span className="text-red-500">*</span>
                </label>
                <Select value={profileData.gender} onValueChange={(val) => setProfileData({ ...profileData, gender: val })} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent className="z-[200]">
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                    <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Nationality <span className="text-red-500">*</span>
                </label>
                <Select value={profileData.nationality} onValueChange={(val) => setProfileData({ ...profileData, nationality: val })} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select nationality" />
                  </SelectTrigger>
                  <SelectContent className="z-[200]">
                    <SelectItem value="Nigerian">Nigerian</SelectItem>
                    <SelectItem value="Ghanaian">Ghanaian</SelectItem>
                    <SelectItem value="Beninese">Beninese</SelectItem>
                    <SelectItem value="Cameroonian">Cameroonian</SelectItem>
                    <SelectItem value="Chadian">Chadian</SelectItem>
                    <SelectItem value="Nigerien">Nigerien</SelectItem>
                    <SelectItem value="Togolese">Togolese</SelectItem>
                    <SelectItem value="American">American</SelectItem>
                    <SelectItem value="British">British</SelectItem>
                    <SelectItem value="Canadian">Canadian</SelectItem>
                    <SelectItem value="French">French</SelectItem>
                    <SelectItem value="German">German</SelectItem>
                    <SelectItem value="Chinese">Chinese</SelectItem>
                    <SelectItem value="Indian">Indian</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  required
                  value={profileData.dateOfBirth}
                  onChange={(e) => setProfileData({ ...profileData, dateOfBirth: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  State of Origin <span className="text-red-500">*</span>
                </label>
                <Select value={profileData.stateOfOrigin} onValueChange={(val) => setProfileData({ ...profileData, stateOfOrigin: val })} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select state of origin" />
                  </SelectTrigger>
                  <SelectContent className="z-[200]">
                    <SelectItem value="Abia">Abia</SelectItem>
                    <SelectItem value="Adamawa">Adamawa</SelectItem>
                    <SelectItem value="Akwa Ibom">Akwa Ibom</SelectItem>
                    <SelectItem value="Anambra">Anambra</SelectItem>
                    <SelectItem value="Bauchi">Bauchi</SelectItem>
                    <SelectItem value="Bayelsa">Bayelsa</SelectItem>
                    <SelectItem value="Benue">Benue</SelectItem>
                    <SelectItem value="Borno">Borno</SelectItem>
                    <SelectItem value="Cross River">Cross River</SelectItem>
                    <SelectItem value="Delta">Delta</SelectItem>
                    <SelectItem value="Ebonyi">Ebonyi</SelectItem>
                    <SelectItem value="Edo">Edo</SelectItem>
                    <SelectItem value="Ekiti">Ekiti</SelectItem>
                    <SelectItem value="Enugu">Enugu</SelectItem>
                    <SelectItem value="Gombe">Gombe</SelectItem>
                    <SelectItem value="Imo">Imo</SelectItem>
                    <SelectItem value="Jigawa">Jigawa</SelectItem>
                    <SelectItem value="Kaduna">Kaduna</SelectItem>
                    <SelectItem value="Kano">Kano</SelectItem>
                    <SelectItem value="Katsina">Katsina</SelectItem>
                    <SelectItem value="Kebbi">Kebbi</SelectItem>
                    <SelectItem value="Kogi">Kogi</SelectItem>
                    <SelectItem value="Kwara">Kwara</SelectItem>
                    <SelectItem value="Lagos">Lagos</SelectItem>
                    <SelectItem value="Nasarawa">Nasarawa</SelectItem>
                    <SelectItem value="Niger">Niger</SelectItem>
                    <SelectItem value="Ogun">Ogun</SelectItem>
                    <SelectItem value="Ondo">Ondo</SelectItem>
                    <SelectItem value="Osun">Osun</SelectItem>
                    <SelectItem value="Oyo">Oyo</SelectItem>
                    <SelectItem value="Plateau">Plateau</SelectItem>
                    <SelectItem value="Rivers">Rivers</SelectItem>
                    <SelectItem value="Sokoto">Sokoto</SelectItem>
                    <SelectItem value="Taraba">Taraba</SelectItem>
                    <SelectItem value="Yobe">Yobe</SelectItem>
                    <SelectItem value="Zamfara">Zamfara</SelectItem>
                    <SelectItem value="FCT">Federal Capital Territory</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={submittingProfile} className="w-full">
                  {submittingProfile ? 'Saving...' : 'Save Profile Details & Continue'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Offer Acceptance/Rejection Modal - Compulsory */}
      {showOfferModal && offerDetails && (
        <Dialog open={showOfferModal} onOpenChange={(open) => {
          // Prevent closing unless offer is responded to
          if (!open) return
          setShowOfferModal(open)
        }}>
          <DialogContent 
            className="bg-white dark:bg-black sm:max-w-[500px] z-[100]"
            onPointerDownOutside={(e) => e.preventDefault()}
            onEscapeKeyDown={(e) => e.preventDefault()}
          >
            <DialogHeader>
              <DialogTitle className="text-2xl">Admission Offer</DialogTitle>
              <DialogDescription>
                Congratulations! You have been offered admission. Please review the details below and respond.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/10">
                <div className="flex items-center gap-3 mb-3">
                  <Award className="h-6 w-6 text-emerald-600" />
                  <h3 className="font-bold text-lg">Program Offered</h3>
                </div>
                <p className="font-semibold text-xl">{offerDetails.program?.title}</p>
              </div>

              {offerDetails.review_feedback && (
                <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 dark:bg-blue-500/10">
                  <p className="text-sm font-semibold mb-1">Admin Note:</p>
                  <p className="text-sm text-muted-foreground">{offerDetails.review_feedback}</p>
                </div>
              )}

              <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 dark:bg-amber-500/10">
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                  ⚠️ Important: By accepting this offer, you will be converted to a student profile and assigned a matriculation number. This action cannot be undone.
                </p>
              </div>

              <div className="flex flex-col gap-3 pt-4">
                <Button 
                  onClick={() => handleOfferResponse(true)} 
                  disabled={respondingToOffer}
                  className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 h-12"
                >
                  {respondingToOffer ? 'Processing...' : 'Accept Offer & Become Student'}
                </Button>
                <Button 
                  onClick={() => handleOfferResponse(false)} 
                  disabled={respondingToOffer}
                  variant="outline"
                  className="w-full rounded-xl h-12 border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  {respondingToOffer ? 'Processing...' : 'Decline Offer'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Migration Success Modal */}
      {showMigrationSuccessModal && profile && (
        <Dialog open={showMigrationSuccessModal} onOpenChange={setShowMigrationSuccessModal}>
          <DialogContent className="bg-white dark:bg-black sm:max-w-[500px] z-[100]">
            <DialogHeader>
              <DialogTitle className="text-2xl">Congratulations! 🎉</DialogTitle>
              <DialogDescription>
                You have been successfully migrated to the student portal.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/10">
                <div className="flex items-center gap-3 mb-3">
                  <BadgeCheck className="h-6 w-6 text-emerald-600" />
                  <h3 className="font-bold text-lg">Migration Complete</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Your account has been converted from aspirant to student. You now have full access to the student portal.
                </p>
              </div>
              
              <div className="rounded-xl border bg-slate-50 dark:bg-slate-800 p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Matric Number:</span>
                  <span className="font-semibold">{profile.matric_number || 'Pending Assignment'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="font-semibold text-emerald-600">Active Student</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={() => {
                    setShowMigrationSuccessModal(false)
                    setMigrationDismissed(true)
                  }}
                  variant="outline"
                  className="flex-1 rounded-xl"
                >
                  Stay Here
                </Button>
                <Button 
                  onClick={() => {
                    setShowMigrationSuccessModal(false)
                    setMigrationDismissed(true)
                    window.location.href = '/student/dashboard'
                  }}
                  className="flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700"
                >
                  Go to Student Portal
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Admission Status */}
      <Card className="rounded-[2rem] border bg-white dark:bg-slate-900 p-6 shadow-sm">
        <h2 className="text-2xl font-bold">Admission status</h2>
        {profile?.application_status === 'migrated' ? (
          <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/10 p-5">
            <div className="flex items-center gap-3">
              <BadgeCheck className="h-8 w-8 text-emerald-600" />
              <div>
                <h4 className="font-bold">Successfully Migrated</h4>
                <p className="text-xs text-muted-foreground">You are now a student with full access to the student portal.</p>
              </div>
            </div>
            <div className="mt-4 rounded-xl border bg-white dark:bg-slate-800 p-4 text-xs font-technical">
              <div><strong>Matric Number:</strong> {profile.matric_number || 'Pending Assignment'}</div>
              <div><strong>Application Status:</strong> Migrated</div>
              <div><strong>Portal State:</strong> Student Portal Active</div>
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
        ) : profile?.matric_number ? (
          <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/10 p-5">
            <div className="flex items-center gap-3">
              <BadgeCheck className="h-8 w-8 text-emerald-600" />
              <div>
                <h4 className="font-bold">Admission accepted</h4>
                <p className="text-xs text-muted-foreground">You can now continue in the student portal.</p>
              </div>
            </div>
            <div className="mt-4 rounded-xl border bg-white dark:bg-slate-800 p-4 text-xs font-technical">
              <div><strong>Student ID:</strong> {profile.matric_number}</div>
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