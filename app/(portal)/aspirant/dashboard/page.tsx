'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BadgeCheck, GraduationCap, UserRound, ArrowRight, ClipboardList, BookOpen, UploadCloud, Image as ImageIcon, FileUp, FileText, Sparkles } from 'lucide-react'
import { ROUTES } from '@/lib/constants'

const documentTypes = [
  { label: 'Passport photograph', value: 'passport_photo' },
  { label: 'Signature', value: 'signature' },
  { label: 'Birth certificate', value: 'birth_certificate' },
  { label: 'NIN slip', value: 'nin_slip' },
  { label: 'JAMB result', value: 'jamb_result' },
]

type UploadedDocument = {
  id: string
  document_type: string
  file_name: string
  mime_type?: string | null
  verification_status: string
  file_url?: string | null
}

type UploadedPhoto = {
  id: string
  file_name: string
  image_url?: string | null
}

type UploadedResult = {
  id: string
  exam_body: string
  exam_year: number | null
  is_combined: boolean
  result_type?: string | null
  sitting_number?: number | null
  qualification_title?: string | null
  institution_name?: string | null
  file_name?: string | null
  file_url?: string | null
}

export default function AspirantDashboard() {
  const [passportFile, setPassportFile] = useState<File | null>(null)
  const [passportStatus, setPassportStatus] = useState('')
  const [docType, setDocType] = useState('passport_photo')
  const [docFile, setDocFile] = useState<File | null>(null)
  const [docStatus, setDocStatus] = useState('')
  const [submittingPassport, setSubmittingPassport] = useState(false)
  const [submittingDoc, setSubmittingDoc] = useState(false)
  const [summary, setSummary] = useState<{ name: string; email: string; role: string; avatarUrl?: string }>({ name: 'Student', email: '', role: 'Aspirant' })
  const [documents, setDocuments] = useState<UploadedDocument[]>([])
  const [photos, setPhotos] = useState<UploadedPhoto[]>([])
  const [results, setResults] = useState<UploadedResult[]>([])
  const [resultForm, setResultForm] = useState({
    examBody: 'WAEC',
    examYear: '',
    resultType: 'secondary',
    sittingNumber: '1',
    isCombined: false,
    qualificationTitle: '',
    institutionName: '',
  })
  const [resultFile, setResultFile] = useState<File | null>(null)
  const [resultStatus, setResultStatus] = useState('')
  const [submittingResult, setSubmittingResult] = useState(false)

  useEffect(() => {
    const load = async () => {
      const [meRes, docsRes, photosRes, resultsRes] = await Promise.all([
        fetch('/api/v1/auth/me'),
        fetch('/api/v1/admissions/documents'),
        fetch('/api/v1/admissions/profile-photo'),
        fetch('/api/v1/admissions/results'),
      ])
      const me = await meRes.json().catch(() => null)
      const docs = await docsRes.json().catch(() => null)
      const pic = await photosRes.json().catch(() => null)
      const resPayload = await resultsRes.json().catch(() => null)
      const user = me?.user
      setSummary({
        name: user ? [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Student' : 'Student',
        email: user?.email || '',
        role: user?.role || 'Aspirant',
        avatarUrl: user?.avatarUrl,
      })
      setDocuments(docs?.data || [])
      setPhotos(pic?.data || [])
      setResults(resPayload?.data || [])
    }

    load()
  }, [])

  const uploadedDocumentTypes = useMemo(() => new Set(documents.map((doc) => doc.document_type)), [documents])
  const hasPassport = photos.length > 0 || uploadedDocumentTypes.has('passport_photo')
  const currentPassport = photos[0] || documents.find((doc) => doc.document_type === 'passport_photo') || null
  const imageExtensions = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif'])
  const isImageDocument = (name?: string, type?: string) => {
    const extension = name?.split('.').pop()?.toLowerCase() || ''
    return Boolean(type?.startsWith('image/') || imageExtensions.has(extension))
  }

  const uploadPassport = async () => {
    if (!passportFile) {
      setPassportStatus('Choose a passport photo first.')
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
      setPassportStatus('Passport photo uploaded successfully.')
      setPassportFile(null)
      setPhotos((prev) => [{ ...payload.data }, ...prev])
      window.dispatchEvent(new CustomEvent('portal-profile-updated'))
    } catch (error) {
      setPassportStatus(error instanceof Error ? error.message : 'Upload failed.')
    } finally {
      setSubmittingPassport(false)
    }
  }

  const uploadDocument = async () => {
    if (!docFile) {
      setDocStatus('Choose a document first.')
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
      setDocStatus('Document uploaded successfully.')
      setDocFile(null)
      setDocuments((prev) => [{ ...payload.data }, ...prev])
      window.dispatchEvent(new CustomEvent('portal-profile-updated'))
    } catch (error) {
      setDocStatus(error instanceof Error ? error.message : 'Upload failed.')
    } finally {
      setSubmittingDoc(false)
    }
  }

  const submitResult = async () => {
    if (!resultFile) {
      setResultStatus('Choose a result file first.')
      return
    }

    setSubmittingResult(true)
    setResultStatus('')
    try {
      const formData = new FormData()
      formData.append('file', resultFile)
      formData.append('examBody', resultForm.examBody)
      formData.append('examYear', resultForm.examYear)
      formData.append('resultType', resultForm.resultType)
      formData.append('sittingNumber', resultForm.sittingNumber)
      formData.append('isCombined', String(resultForm.isCombined))
      formData.append('qualificationTitle', resultForm.qualificationTitle)
      formData.append('institutionName', resultForm.institutionName)
      const response = await fetch('/api/v1/admissions/results', { method: 'POST', body: formData })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.error || 'Unable to save academic result')
      setResults((prev) => [{ ...payload.data }, ...prev])
      setResultFile(null)
      setResultStatus('Academic result saved successfully.')
      window.dispatchEvent(new CustomEvent('portal-profile-updated'))
    } catch (error) {
      setResultStatus(error instanceof Error ? error.message : 'Unable to save result')
    } finally {
      setSubmittingResult(false)
    }
  }

  const stats = [
    { label: 'Profile status', value: hasPassport ? 'In progress' : 'Not completed', icon: UserRound },
    { label: 'Application status', value: documents.length ? 'Documents uploaded' : 'Awaiting details', icon: ClipboardList },
    { label: 'Next step', value: hasPassport ? 'Complete profile' : 'Upload photo', icon: GraduationCap },
  ]

  return (
    <div className="space-y-8">
      <div className="rounded-[2rem] border border-border bg-[linear-gradient(160deg,hsl(var(--primary)/0.12),hsl(var(--secondary)/0.08),hsl(var(--card)))] p-6 md:p-8">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div className="flex items-center gap-4 motion-safe:animate-[fade-in_0.5s_ease-out]">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-border bg-background">
              {summary.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={summary.avatarUrl} alt={summary.name} className="h-full w-full object-cover" />
              ) : (
                <UserRound className="h-8 w-8 text-primary" />
              )}
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Aspirant portal</p>
              <h1 className="mt-2 text-3xl font-extrabold md:text-5xl">Your admission workspace</h1>
              <p className="mt-1 text-sm text-foreground/70">{summary.name} · {summary.email}</p>
            </div>
          </div>
          <Link href={ROUTES.admissions} className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-5 py-3 text-sm font-semibold transition hover:border-primary/40 hover:text-primary">
            View admissions
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((item) => {
          const Icon = item.icon
          return (
            <Card key={item.label} className="rounded-3xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <Icon className="h-5 w-5 text-primary" />
              <p className="mt-4 text-sm text-muted-foreground">{item.label}</p>
              <p className="mt-1 text-2xl font-bold">{item.value}</p>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Card id="passport-photo" className="rounded-[2rem] scroll-mt-24 p-6 transition-all duration-300 hover:-translate-y-1">
          <h2 className="text-2xl font-bold">Passport photo</h2>
          <p className="mt-1 text-sm text-muted-foreground">Upload a clear passport photograph for your student record.</p>
          <div className="mt-5 rounded-2xl border border-dashed border-border bg-background p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                <ImageIcon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">Choose passport photo</p>
                <p className="text-xs text-muted-foreground">
                  {passportFile ? passportFile.name : currentPassport?.file_name || 'PNG, JPG, or JPEG'}
                </p>
              </div>
            </div>
            <input type="file" accept="image/*" className="mt-4 w-full text-sm" onChange={(e) => setPassportFile(e.target.files?.[0] || null)} />
            <Button onClick={uploadPassport} disabled={submittingPassport} className="mt-4 rounded-2xl">
              <UploadCloud className="mr-2 h-4 w-4" />
              {submittingPassport ? 'Uploading...' : 'Upload passport photo'}
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

        <Card id="documents" className="rounded-[2rem] scroll-mt-24 p-6 transition-all duration-300 hover:-translate-y-1">
          <h2 className="text-2xl font-bold">Admission documents</h2>
          <p className="mt-1 text-sm text-muted-foreground">Upload certificates and identity documents one by one.</p>
          <div className="mt-5 space-y-4">
            {hasPassport && (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-700 dark:text-emerald-300">
                Passport photograph already uploaded and linked to your admission file.
              </div>
            )}
            <label className="block">
              <span className="mb-2 block text-sm font-medium">Document type</span>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm dark:bg-black"
              >
                {documentTypes.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.value === 'passport_photo' && hasPassport ? `${item.label} (uploaded)` : item.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium">Upload file</span>
              <input type="file" className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm" onChange={(e) => setDocFile(e.target.files?.[0] || null)} />
            </label>
            <Button onClick={uploadDocument} disabled={submittingDoc} className="w-full rounded-2xl">
              <FileUp className="mr-2 h-4 w-4" />
              {submittingDoc ? 'Uploading...' : 'Upload document'}
            </Button>
            {docStatus && <p className="text-sm text-foreground/75">{docStatus}</p>}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-[2rem] p-6 transition-all duration-300 hover:-translate-y-1">
          <h2 className="text-2xl font-bold">Uploaded documents</h2>
          <div className="mt-5 space-y-3">
            {documents.length === 0 && !currentPassport ? (
              <div className="rounded-2xl border border-dashed border-border bg-background p-4 text-sm text-muted-foreground">
                No documents uploaded yet.
              </div>
            ) : (
              [
                ...(currentPassport
                  ? [
                      {
                        id: currentPassport.id,
                        document_type: 'passport_photo',
                        file_name: currentPassport.file_name,
                        mime_type: 'image/jpeg',
                        verification_status: 'uploaded',
                        file_url: currentPassport.image_url,
                      },
                    ]
                  : []),
                ...documents,
              ].map((doc) => (
                <div key={doc.id} className="rounded-2xl border border-border bg-background p-4">
                  <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{doc.file_name}</p>
                    <p className="text-xs text-muted-foreground">{doc.document_type}</p>
                  </div>
                  <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    {doc.document_type === 'passport_photo' ? 'Uploaded' : doc.verification_status}
                  </span>
                </div>
                  {doc.file_url && isImageDocument(doc.file_name, doc.mime_type) && (
                    <div className="mt-3 overflow-hidden rounded-2xl border border-border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={doc.file_url} alt={doc.file_name} className="h-36 w-full object-cover" />
                    </div>
                  )}
                  {doc.file_url && (
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex text-xs font-semibold text-primary underline-offset-4 hover:underline"
                    >
                      Open file
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="rounded-[2rem] p-6 transition-all duration-300 hover:-translate-y-1">
          <h2 className="text-2xl font-bold">Academic results</h2>
          <p className="mt-1 text-sm text-muted-foreground">Add your school leaving result and any additional qualification.</p>
          <div className="mt-5 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="examBody">Result body</Label>
                <select id="examBody" value={resultForm.examBody} onChange={(e) => setResultForm((prev) => ({ ...prev, examBody: e.target.value }))} className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm dark:bg-black">
                  <option>WAEC</option>
                  <option>NECO</option>
                  <option>NABTEB</option>
                  <option>IJMB</option>
                  <option>JUPEB</option>
                  <option>Diploma</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="examYear">Exam year</Label>
                <Input id="examYear" type="number" value={resultForm.examYear} onChange={(e) => setResultForm((prev) => ({ ...prev, examYear: e.target.value }))} className="rounded-2xl" placeholder="2024" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="resultType">Result type</Label>
                <select id="resultType" value={resultForm.resultType} onChange={(e) => setResultForm((prev) => ({ ...prev, resultType: e.target.value }))} className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm dark:bg-black">
                  <option value="secondary">Secondary</option>
                  <option value="diploma">Diploma</option>
                  <option value="nce">NCE</option>
                  <option value="hnd">HND</option>
                  <option value="degree">Degree</option>
                  <option value="professional">Professional</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sittingNumber">Sitting</Label>
                <select id="sittingNumber" value={resultForm.sittingNumber} onChange={(e) => setResultForm((prev) => ({ ...prev, sittingNumber: e.target.value }))} className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm dark:bg-black">
                  <option value="1">First sitting</option>
                  <option value="2">Second sitting</option>
                </select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="qualificationTitle">Qualification title</Label>
                <Input id="qualificationTitle" value={resultForm.qualificationTitle} onChange={(e) => setResultForm((prev) => ({ ...prev, qualificationTitle: e.target.value }))} className="rounded-2xl" placeholder="e.g. Diploma in Health Information" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="institutionName">Institution name</Label>
                <Input id="institutionName" value={resultForm.institutionName} onChange={(e) => setResultForm((prev) => ({ ...prev, institutionName: e.target.value }))} className="rounded-2xl" placeholder="School or institution name" />
              </div>
              <label className="flex items-center gap-2 text-sm md:col-span-2">
                <input type="checkbox" checked={resultForm.isCombined} onChange={(e) => setResultForm((prev) => ({ ...prev, isCombined: e.target.checked }))} />
                Combined sitting result
              </label>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="resultFile">Attach result file</Label>
                <input id="resultFile" type="file" className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm" onChange={(e) => setResultFile(e.target.files?.[0] || null)} />
              </div>
            </div>
            <Button onClick={submitResult} disabled={submittingResult} className="w-full rounded-2xl">
              {submittingResult ? 'Saving...' : 'Save result'}
            </Button>
            {resultStatus && <p className="text-sm text-foreground/75">{resultStatus}</p>}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-[2rem] p-6 transition-all duration-300 hover:-translate-y-1">
          <h2 className="text-2xl font-bold">Uploaded results</h2>
          <div className="mt-5 space-y-3">
            {results.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-background p-4 text-sm text-muted-foreground">
                No academic results uploaded yet.
              </div>
            ) : (
              results.map((result) => (
                <div key={result.id} className="rounded-2xl border border-border bg-background p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{result.exam_body}</p>
                      <p className="text-xs text-muted-foreground">
                        {result.result_type || 'secondary'} {result.exam_year ? `· ${result.exam_year}` : ''} {result.is_combined ? '· combined sitting' : ''}
                      </p>
                    </div>
                    <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      {result.sitting_number === 2 ? 'Second sitting' : 'First sitting'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="rounded-[2rem] p-6 transition-all duration-300 hover:-translate-y-1">
          <h2 className="text-2xl font-bold">Quick links</h2>
          <div className="mt-4 space-y-3">
            <Button asChild variant="outline" className="w-full justify-start rounded-2xl">
              <Link href={ROUTES.programs}>
                <BookOpen className="mr-2 h-4 w-4" />
                View programs
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start rounded-2xl">
              <Link href="/aspirant/status">
                <BadgeCheck className="mr-2 h-4 w-4" />
                Check admission status
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start rounded-2xl">
              <Link href="/aspirant/application">
                <ArrowRight className="mr-2 h-4 w-4" />
                Continue application
              </Link>
            </Button>
            <div className="rounded-2xl border border-border bg-background p-4 text-sm text-muted-foreground">
              <Sparkles className="mb-2 h-5 w-5 text-primary" />
              Keep your details updated to improve screening and approval speed.
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
