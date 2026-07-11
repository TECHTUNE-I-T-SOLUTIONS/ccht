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

  const loadData = async () => {
    const [meRes, docsRes, photosRes, resultsRes, paymentsRes] = await Promise.all([
      fetch('/api/v1/auth/me'),
      fetch('/api/v1/admissions/documents'),
      fetch('/api/v1/admissions/profile-photo'),
      fetch('/api/v1/admissions/results'),
      fetch('/api/v1/payments'),
    ])

    const me = await meRes.json().catch(() => null)
    const docs = await docsRes.json().catch(() => null)
    const pic = await photosRes.json().catch(() => null)
    const resPayload = await resultsRes.json().catch(() => null)
    const paymentsPayload = await paymentsRes.json().catch(() => null)

    const user = me?.user
    setSummary({
      id: user?.id || '',
      name: user ? [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Student' : 'Student',
      email: user?.email || '',
      avatarUrl: user?.avatarUrl || '',
    })
    setDocuments(docs?.data || [])
    setPhotos(pic?.data || [])
    setExamResults(resPayload?.data || [])
    setLatestExamResult(resPayload?.data?.[0] || null)
    setAppFeePaid((paymentsPayload?.data || []).some((p: any) => p.amount === 6500 && p.status === 'success'))
    setAdminFeePaid((paymentsPayload?.data || []).some((p: any) => p.amount === 30000 && p.status === 'success'))
    setStage(user?.stage || 'signup')
    setMatricNumber(user?.matricNumber || null)
  }

  useEffect(() => {
    loadData().catch((error) => console.error(error))
  }, [])

  const uploadPassport = async () => {
    if (!passportFile) return setPassportStatus('Choose a passport photo first.')
    setSubmittingPassport(true)
    setPassportStatus('')
    try {
      const formData = new FormData()
      formData.append('file', passportFile)
      const response = await fetch('/api/v1/admissions/profile-photo', { method: 'POST', body: formData })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.error || 'Unable to upload passport photo')
      setPhotos((prev) => [{ ...payload.data }, ...prev])
      setPassportStatus('Passport photo uploaded successfully.')
      await loadData()
    } catch (error) {
      setPassportStatus(error instanceof Error ? error.message : 'Upload failed.')
    } finally {
      setSubmittingPassport(false)
    }
  }

  const uploadDocument = async () => {
    if (!docFile) return setDocStatus('Choose a document first.')
    setSubmittingDoc(true)
    setDocStatus('')
    try {
      const formData = new FormData()
      formData.append('file', docFile)
      formData.append('documentType', docType)
      const response = await fetch('/api/v1/admissions/documents', { method: 'POST', body: formData })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.error || 'Unable to upload document')
      setDocuments((prev) => [{ ...payload.data }, ...prev])
      setDocStatus('Document uploaded successfully.')
      await loadData()
    } catch (error) {
      setDocStatus(error instanceof Error ? error.message : 'Upload failed.')
    } finally {
      setSubmittingDoc(false)
    }
  }

  const initiatePayment = async (amount: number, desc: string) => {
    setInitiatingPayment(true)
    try {
      const response = await fetch('/api/v1/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, email: summary.email, studentId: summary.id, description: desc }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Failed to initiate payment')
      window.location.href = payload.authorizationUrl
    } catch (err: any) {
      toast.error(err.message)
    } finally {
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
  const hasUploadedDocuments = documents.length > 0

  // Progressive steps configuration
  const steps = [
    {
      id: 'payment',
      title: 'Application Fee',
      description: 'Pay ₦6,500 to unlock the admission application',
      icon: CreditCard,
      completed: appFeePaid,
      locked: !appFeePaid,
      action: () => initiatePayment(6500, 'Application Fee Payment'),
      actionLabel: 'Pay ₦6,500',
      detail: appFeePaid ? 'Payment completed' : 'Required to proceed',
    },
    {
      id: 'documents',
      title: 'Upload Documents',
      description: 'Add personal, academic, and medical documents for review',
      icon: FileUp,
      completed: hasUploadedDocuments,
      locked: !appFeePaid,
      action: null,
      actionLabel: null,
      detail: `Uploaded: ${documents.length} documents`,
    },
    {
      id: 'exam',
      title: 'Entrance Exam',
      description: 'Take the secure online screening exam',
      icon: Award,
      completed: examResults.length > 0,
      locked: !appFeePaid || !hasUploadedDocuments,
      action: null,
      actionLabel: 'Start Exam',
      link: '/aspirant/exam',
      detail: examResults.length > 0 ? 'Exam completed' : 'Requires documents upload',
    },
    {
      id: 'admission_fee',
      title: 'Admission Charges',
      description: 'Pay ₦30,000 admission and administrative charges',
      icon: CreditCard,
      completed: adminFeePaid,
      locked: !appFeePaid || !hasUploadedDocuments || examResults.length === 0,
      action: () => initiatePayment(30000, 'Admission Administrative Charges'),
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
                className="mt-4 rounded-xl"
              >
                {currentStep.actionLabel}
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            )}
            {!currentStep.completed && !currentStep.locked && currentStep.link && (
              <Button asChild className="mt-4 rounded-xl">
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

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Passport Photo Upload */}
        <Card className="rounded-[2rem] border bg-white dark:bg-slate-900 p-6 shadow-sm">
          <h2 className="text-2xl font-bold">Passport photo</h2>
          <p className="mt-1 text-sm text-muted-foreground">Upload a clean passport photo for your record and ID card.</p>
          <div className="mt-5 rounded-2xl border border-dashed border-border bg-slate-50 dark:bg-slate-800/50 p-5">
            <p className="text-sm font-semibold">Choose passport photo</p>
            <p className="text-xs text-muted-foreground">{passportFile ? passportFile.name : currentPassport?.file_name || 'PNG, JPG, or JPEG'}</p>
            <input type="file" accept="image/*" className="mt-4 w-full text-sm" onChange={(e) => setPassportFile(e.target.files?.[0] || null)} />
            <Button onClick={uploadPassport} disabled={submittingPassport || !appFeePaid} className="mt-4 rounded-2xl">
              <UploadCloud className="mr-2 h-4 w-4" />
              {submittingPassport ? 'Uploading...' : 'Upload Passport'}
            </Button>
            {currentPassport?.image_url && (
              <div className="mt-4 overflow-hidden rounded-2xl border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={currentPassport.image_url} alt="Uploaded passport" className="h-48 w-full object-cover" />
              </div>
            )}
            {passportStatus && <p className="mt-3 text-sm text-foreground/75">{passportStatus}</p>}
          </div>
        </Card>

        {/* Document Upload */}
        <Card className="rounded-[2rem] border bg-white dark:bg-slate-900 p-6 shadow-sm">
          <h2 className="text-2xl font-bold">Admission documents</h2>
          <p className="mt-1 text-sm text-muted-foreground">Upload the required records for admission review and verification.</p>
          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium">Document type</span>
              <select value={docType} onChange={(e) => setDocType(e.target.value)} className="w-full rounded-2xl border border-border bg-white dark:bg-slate-800 px-4 py-3 text-sm">
                {documentTypes.map((item) => (
                  <option key={item.value} value={item.value}>
                    {uploadedDocumentTypes.has(item.value) ? `${item.label} (uploaded)` : item.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium">Upload file</span>
              <input type="file" className="w-full rounded-2xl border border-border bg-white dark:bg-slate-800 px-4 py-3 text-sm" onChange={(e) => setDocFile(e.target.files?.[0] || null)} />
            </label>
            <Button onClick={uploadDocument} disabled={submittingDoc || !appFeePaid} className="w-full rounded-2xl">
              <FileUp className="mr-2 h-4 w-4" />
              {submittingDoc ? 'Uploading...' : 'Upload document'}
            </Button>
            {docStatus && <p className="text-sm text-foreground/75">{docStatus}</p>}
          </div>
        </Card>
      </div>

      {/* Uploaded Documents List */}
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