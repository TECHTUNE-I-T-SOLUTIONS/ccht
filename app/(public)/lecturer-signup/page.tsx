'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Loader2, ArrowRight, ArrowLeft, Upload } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Step = 1 | 2 | 3
const QUALIFICATIONS = ['SSCE','WAEC','NECO','NABTEB','OND','NCE','HND','BSc','BEng','BA','BEd','BPharm','MBBS','LLB','MSc','MA','MEng','MBA','MPhil','PhD','EdD','DSc']
const EMPLOYMENT_TYPES = ['full_time','part_time','adjunct','contract'] as const

export default function LecturerSignupPage() {
  const supabase = createClient()
  const [step, setStep] = useState<Step>(1)
  const [enabled, setEnabled] = useState(false)
  const [checking, setChecking] = useState(true)
  const [loading, setLoading] = useState(false)
  const [passportUrl, setPassportUrl] = useState('')
  const [departments, setDepartments] = useState<{id:string; name:string}[]>([])
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([])
  const [nextEmployeeNumber, setNextEmployeeNumber] = useState('001')
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    employeeNumber: '',
    qualification: '',
    specialization: '',
    employmentType: 'full_time',
    dateJoined: '',
    officeLocation: '',
    officeHours: '',
    canPublishResults: false,
    canEnterScores: true,
  })

  useEffect(() => {
    ;(async () => {
      try {
        const [{ data: setting }, { data: deptData }] = await Promise.all([
          supabase.from('signup_settings').select('is_enabled').eq('signup_type', 'lecturer').single(),
          supabase.from('departments').select('id, name').eq('is_active', true).order('name'),
        ])
        setEnabled(Boolean(setting?.is_enabled))
        setDepartments((deptData || []) as any)
        const nextRes = await fetch('/api/v1/public/signup/lecturer/next-employee-number')
        const nextData = await nextRes.json().catch(() => null)
        if (nextRes.ok && nextData?.nextEmployeeNumber) {
          setNextEmployeeNumber(nextData.nextEmployeeNumber)
          setForm((prev) => ({ ...prev, employeeNumber: nextData.nextEmployeeNumber }))
        }
      } catch {
        setEnabled(false)
      } finally {
        setChecking(false)
      }
    })()
  }, [supabase])

  const canNext = useMemo(() => {
    if (step === 1) return !!form.firstName && !!form.lastName && !!form.email && !!form.password && form.password === form.confirmPassword
    if (step === 2) return !!form.employeeNumber && !!form.qualification && !!form.specialization && !!form.dateJoined && selectedDepartments.length > 0
    return true
  }, [form, step, selectedDepartments.length])

  const uploadPassport = async (file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('userId', form.email || 'temp')
    const res = await fetch('/api/v1/public/signup/upload-passport', { method: 'POST', body: fd })
    const data = await res.json()
    if (!res.ok) throw new Error(data?.error || 'Passport upload failed')
    setPassportUrl(data.url)
  }

  const submit = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/public/signup/lecturer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          department: selectedDepartments[0] || '',
          departments: selectedDepartments,
          passportPhotoUrl: passportUrl || null,
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Signup failed')
      toast.success(data?.message || 'Lecturer account created')
      window.location.href = '/auth/login'
    } catch (error: any) {
      toast.error(error.message || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  if (checking) return <div className="min-h-screen grid place-items-center">Loading...</div>
  if (!enabled) return <div className="min-h-screen grid place-items-center">Lecturer signup is disabled.</div>

  return (
    <main className="flex min-h-screen flex-col lg:flex-row">
      <section className="relative hidden lg:block lg:w-1/2">
        <Image src="/images/hero-bg1.jpg" alt="Campus" fill className="object-cover" priority sizes="(min-width: 1024px) 50vw, 100vw" />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/75 via-blue-950/60 to-cyan-900/40" />
      </section>
      <section className="flex w-full items-center justify-center bg-slate-50 px-4 py-8 dark:bg-slate-950 lg:w-1/2">
        <Card className="w-full max-w-2xl p-6 md:p-8">
          <div className="mb-6">
            <p className="text-sm text-muted-foreground">Step {step} of 3</p>
            <h1 className="text-3xl font-bold">Lecturer Signup</h1>
          </div>

          {step === 1 && (
            <div className="grid gap-4 md:grid-cols-2">
              <div><Label>First Name</Label><Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></div>
              <div><Label>Last Name</Label><Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></div>
              <div><Label>Middle Name</Label><Input value={form.middleName} onChange={(e) => setForm({ ...form, middleName: e.target.value })} /></div>
              <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div><Label>Password</Label><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
              <div><Label>Confirm Password</Label><Input type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} /></div>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Employee Number</Label>
                <Input value={form.employeeNumber} onChange={(e) => setForm({ ...form, employeeNumber: e.target.value })} placeholder={`Next available: ${nextEmployeeNumber}`} />
                <p className="mt-1 text-xs text-muted-foreground">Suggested next number: {nextEmployeeNumber}</p>
              </div>
              <div>
                <Label>Employment Type</Label>
                <Select value={form.employmentType} onValueChange={(value) => setForm({ ...form, employmentType: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{EMPLOYMENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Qualification</Label>
                <Select value={form.qualification} onValueChange={(value) => setForm({ ...form, qualification: value })}>
                  <SelectTrigger><SelectValue placeholder="Select qualification" /></SelectTrigger>
                  <SelectContent>{QUALIFICATIONS.map((q) => <SelectItem key={q} value={q}>{q}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Specialization</Label><Input value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} /></div>
              <div><Label>Date Joined</Label><Input type="date" value={form.dateJoined} onChange={(e) => setForm({ ...form, dateJoined: e.target.value })} /></div>
              <div className="md:col-span-2 grid gap-3 rounded-xl border p-4">
                <div className="flex items-start gap-3">
                  <input
                    id="canPublishResults"
                    type="checkbox"
                    checked={form.canPublishResults}
                    onChange={(e) => setForm({ ...form, canPublishResults: e.target.checked })}
                    className="mt-1 h-4 w-4 rounded border-border"
                  />
                  <div>
                    <Label htmlFor="canPublishResults" className="text-sm font-medium">Can publish results</Label>
                    <p className="text-xs text-muted-foreground">Allow this lecturer to publish approved results.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <input
                    id="canEnterScores"
                    type="checkbox"
                    checked={form.canEnterScores}
                    onChange={(e) => setForm({ ...form, canEnterScores: e.target.checked })}
                    className="mt-1 h-4 w-4 rounded border-border"
                  />
                  <div>
                    <Label htmlFor="canEnterScores" className="text-sm font-medium">Can enter scores</Label>
                    <p className="text-xs text-muted-foreground">Allow this lecturer to enter and update scores.</p>
                  </div>
                </div>
              </div>
              <div className="md:col-span-2">
                <Label>Departments</Label>
                {selectedDepartments.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-2">
                    {selectedDepartments.map((deptId) => {
                      const dept = departments.find((d) => d.id === deptId)
                      return (
                        <button key={deptId} type="button" onClick={() => setSelectedDepartments((prev) => prev.filter((id) => id !== deptId))} className="rounded-full border px-3 py-1 text-xs">
                          {dept?.name || deptId} x
                        </button>
                      )
                    })}
                  </div>
                )}
                <Select onValueChange={(value) => setSelectedDepartments((prev) => prev.includes(value) ? prev : [...prev, value])}>
                  <SelectTrigger><SelectValue placeholder="Add a department" /></SelectTrigger>
                  <SelectContent>{departments.filter((d) => !selectedDepartments.includes(d.id)).map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2"><Label>Office Location</Label><Input value={form.officeLocation} onChange={(e) => setForm({ ...form, officeLocation: e.target.value })} /></div>
              <div className="md:col-span-2"><Label>Office Hours</Label><Textarea value={form.officeHours} onChange={(e) => setForm({ ...form, officeHours: e.target.value })} /></div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="rounded-xl border border-dashed p-6 text-center">
                <Upload className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                <p className="font-medium">Upload passport photo</p>
                <input type="file" accept="image/*" className="mt-4 block w-full text-sm" onChange={(e) => e.target.files?.[0] && uploadPassport(e.target.files[0])} />
                {passportUrl && <p className="mt-3 text-xs text-emerald-600">Uploaded successfully</p>}
              </div>
              <div className="rounded-xl bg-slate-100 p-4 text-sm dark:bg-slate-900">
                Review your details, then submit to create auth, profile, and lecturer records.
              </div>
            </div>
          )}

          <div className="mt-6 flex items-center justify-between gap-3">
            <Button type="button" variant="outline" disabled={step === 1 || loading} onClick={() => setStep((s) => (s - 1) as Step)}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            {step < 3 ? (
              <Button type="button" disabled={!canNext || loading} onClick={() => setStep((s) => (s + 1) as Step)}>
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button type="button" disabled={loading} onClick={submit}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : 'Create Lecturer Account'}
              </Button>
            )}
          </div>
        </Card>
      </section>
    </main>
  )
}
