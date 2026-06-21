'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BadgeCheck, GraduationCap, UserRound, ArrowRight, ClipboardList, BookOpen, UploadCloud, Image as ImageIcon, FileUp } from 'lucide-react'
import { ROUTES } from '@/lib/constants'

const documentTypes = [
  { label: 'Passport photograph', value: 'passport_photo' },
  { label: 'Signature', value: 'signature' },
  { label: 'Birth certificate', value: 'birth_certificate' },
  { label: 'NIN slip', value: 'nin_slip' },
  { label: 'JAMB result', value: 'jamb_result' },
]

export default function AspirantDashboard() {
  const [passportFile, setPassportFile] = useState<File | null>(null)
  const [passportStatus, setPassportStatus] = useState('')
  const [docType, setDocType] = useState('passport_photo')
  const [docFile, setDocFile] = useState<File | null>(null)
  const [docStatus, setDocStatus] = useState('')
  const [submittingPassport, setSubmittingPassport] = useState(false)
  const [submittingDoc, setSubmittingDoc] = useState(false)

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

      const response = await fetch('/api/v1/admissions/profile-photo', {
        method: 'POST',
        body: formData,
      })

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload?.error || 'Unable to upload passport photo')
      }

      setPassportStatus('Passport photo uploaded successfully.')
      setPassportFile(null)
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

      const response = await fetch('/api/v1/admissions/documents', {
        method: 'POST',
        body: formData,
      })

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload?.error || 'Unable to upload document')
      }

      setDocStatus('Document uploaded successfully.')
      setDocFile(null)
    } catch (error) {
      setDocStatus(error instanceof Error ? error.message : 'Upload failed.')
    } finally {
      setSubmittingDoc(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="rounded-[2rem] border border-border bg-[linear-gradient(160deg,hsl(var(--primary)/0.12),hsl(var(--secondary)/0.08),hsl(var(--card)))] p-6 md:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Aspirant portal</p>
        <div className="mt-4 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <h1 className="text-3xl font-extrabold md:text-5xl">Your admission workspace</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-foreground/70">
              Complete your profile, upload your passport photo and documents, and keep track of your admission progress here.
            </p>
          </div>
          <Link href={ROUTES.admissions} className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-5 py-3 text-sm font-semibold transition hover:border-primary/40 hover:text-primary">
            View admissions
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: 'Profile status', value: 'Not completed', icon: UserRound },
          { label: 'Application status', value: 'Awaiting details', icon: ClipboardList },
          { label: 'Next step', value: 'Upload photo', icon: GraduationCap },
        ].map((item) => {
          const Icon = item.icon
          return (
            <Card key={item.label} className="rounded-3xl p-5">
              <Icon className="h-5 w-5 text-primary" />
              <p className="mt-4 text-sm text-muted-foreground">{item.label}</p>
              <p className="mt-1 text-2xl font-bold">{item.value}</p>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className="rounded-[2rem] p-6">
          <h2 className="text-2xl font-bold">Passport photo</h2>
          <p className="mt-1 text-sm text-muted-foreground">Upload a clear passport photograph for your student record.</p>
          <div className="mt-5 rounded-2xl border border-dashed border-border bg-background p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                <ImageIcon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">Choose passport photo</p>
                <p className="text-xs text-muted-foreground">{passportFile ? passportFile.name : 'PNG, JPG, or JPEG'}</p>
              </div>
            </div>
            <input
              type="file"
              accept="image/*"
              className="mt-4 w-full text-sm"
              onChange={(e) => setPassportFile(e.target.files?.[0] || null)}
            />
            <Button onClick={uploadPassport} disabled={submittingPassport} className="mt-4 rounded-2xl">
              <UploadCloud className="mr-2 h-4 w-4" />
              {submittingPassport ? 'Uploading...' : 'Upload passport photo'}
            </Button>
            {passportStatus && <p className="mt-3 text-sm text-foreground/75">{passportStatus}</p>}
          </div>
        </Card>

        <Card className="rounded-[2rem] p-6">
          <h2 className="text-2xl font-bold">Admission documents</h2>
          <p className="mt-1 text-sm text-muted-foreground">Upload certificates and identity documents one by one.</p>
          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium">Document type</span>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm"
              >
                {documentTypes.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium">Upload file</span>
              <input
                type="file"
                className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm"
                onChange={(e) => setDocFile(e.target.files?.[0] || null)}
              />
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
        <Card className="rounded-[2rem] p-6">
          <h2 className="text-2xl font-bold">What to do next</h2>
          <div className="mt-6 space-y-3">
            {[
              'Complete your personal and academic profile',
              'Upload your passport photo and documents',
              'Check updates and screening feedback',
            ].map((item, index) => (
              <div key={item} className="flex gap-4 rounded-2xl border border-border bg-background p-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
                  {index + 1}
                </div>
                <p className="text-sm leading-7 text-foreground/75">{item}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="rounded-[2rem] p-6">
          <h2 className="text-2xl font-bold">Quick links</h2>
          <div className="mt-4 space-y-3">
            <Button variant="outline" className="w-full justify-start rounded-2xl">
              <BookOpen className="mr-2 h-4 w-4" />
              View programs
            </Button>
            <Button variant="outline" className="w-full justify-start rounded-2xl">
              <BadgeCheck className="mr-2 h-4 w-4" />
              Check admission status
            </Button>
            <Button variant="outline" className="w-full justify-start rounded-2xl">
              <ArrowRight className="mr-2 h-4 w-4" />
              Continue application
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
