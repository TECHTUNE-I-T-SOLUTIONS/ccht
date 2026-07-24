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

const GENDERS = ['male', 'female', 'other', 'prefer_not_to_say']
const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue',
  'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT (Abuja)',
  'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara',
  'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers',
  'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
]

export default function StudentSignupPage() {
  const supabase = createClient()
  const [step, setStep] = useState<Step>(1)
  const [checking, setChecking] = useState(true)
  const [enabled, setEnabled] = useState(false)
  const [loading, setLoading] = useState(false)
  const [passportUrl, setPassportUrl] = useState('')
  const [programs, setPrograms] = useState<{ id: string; title: string }[]>([])
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([])
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    dateOfBirth: '',
    gender: '',
    studentNumber: '',
    matricNumber: '',
    nationality: 'Nigerian',
    stateOfOrigin: '',
    lga: '',
    address: '',
    city: '',
    state: '',
    guardianName: '',
    guardianPhone: '',
    guardianEmail: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    bloodGroup: '',
    genotype: '',
  })

  useEffect(() => {
    ;(async () => {
      try {
        const [{ data: setting }, { data: deptData }] = await Promise.all([
          supabase.from('signup_settings').select('is_enabled').eq('signup_type', 'student').single(),
          supabase.from('departments').select('id, name').eq('is_active', true).order('name'),
        ])
        setEnabled(Boolean(setting?.is_enabled))
        setDepartments((deptData || []) as any)
      } catch (error) {
        console.error(error)
        setEnabled(false)
      } finally {
        setChecking(false)
      }
    })()
  }, [supabase])

  const canNext = useMemo(() => {
    if (step === 1) return !!form.firstName && !!form.lastName && !!form.email && !!form.password && form.password === form.confirmPassword
    if (step === 2) return !!form.dateOfBirth && !!form.gender && !!form.studentNumber && !!form.matricNumber
    return true
  }, [form, step])

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
      const res = await fetch('/api/v1/public/signup/student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          passportPhotoUrl: passportUrl || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Signup failed')
      toast.success(data.message || 'Student account created')
      window.location.href = '/auth/login'
    } catch (error: any) {
      toast.error(error.message || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  if (checking) return <div className="min-h-screen grid place-items-center">Loading...</div>
  if (!enabled) return <div className="min-h-screen grid place-items-center">Student signup is disabled.</div>

  return (
    <main className="flex min-h-screen flex-col lg:flex-row">
      <section className="relative hidden lg:block lg:w-1/2">
        <Image src="/images/students.jpg" alt="Students" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/70 via-indigo-950/60 to-cyan-900/40" />
        <div className="absolute inset-0 flex items-end p-12 text-white">
          <div className="max-w-lg space-y-4">
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-200">Student Portal</p>
            <h1 className="text-5xl font-semibold leading-tight">Start your journey with a clean, guided signup.</h1>
            <p className="text-white/80">We’ll create your auth account, profile, and student record together.</p>
          </div>
        </div>
      </section>
      <section className="flex w-full items-center justify-center bg-slate-50 px-4 py-8 dark:bg-slate-950 lg:w-1/2">
        <Card className="w-full max-w-2xl p-6 md:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Step {step} of 3</p>
              <h2 className="text-2xl font-bold">Student Signup</h2>
            </div>
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
              <div><Label>Date of Birth</Label><Input type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} /></div>
              <div>
                <Label>Gender</Label>
                <Select value={form.gender} onValueChange={(value) => setForm({ ...form, gender: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{GENDERS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Student Number</Label><Input value={form.studentNumber} onChange={(e) => setForm({ ...form, studentNumber: e.target.value })} /></div>
              <div><Label>Matric Number</Label><Input value={form.matricNumber} onChange={(e) => setForm({ ...form, matricNumber: e.target.value })} /></div>
              <div><Label>Nationality</Label><Input value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })} /></div>
              <div>
                <Label>State of Origin</Label>
                <Select value={form.stateOfOrigin} onValueChange={(value) => setForm({ ...form, stateOfOrigin: value })}>
                  <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                  <SelectContent>{NIGERIAN_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>LGA</Label><Input value={form.lga} onChange={(e) => setForm({ ...form, lga: e.target.value })} /></div>
              <div><Label>City</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
              <div>
                <Label>State</Label>
                <Select value={form.state} onValueChange={(value) => setForm({ ...form, state: value })}>
                  <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                  <SelectContent>{NIGERIAN_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2"><Label>Address</Label><Textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div><Label>Guardian Name</Label><Input value={form.guardianName} onChange={(e) => setForm({ ...form, guardianName: e.target.value })} /></div>
                <div><Label>Guardian Phone</Label><Input value={form.guardianPhone} onChange={(e) => setForm({ ...form, guardianPhone: e.target.value })} /></div>
                <div><Label>Guardian Email</Label><Input type="email" value={form.guardianEmail} onChange={(e) => setForm({ ...form, guardianEmail: e.target.value })} /></div>
                <div><Label>Emergency Contact</Label><Input value={form.emergencyContactName} onChange={(e) => setForm({ ...form, emergencyContactName: e.target.value })} /></div>
                <div><Label>Emergency Phone</Label><Input value={form.emergencyContactPhone} onChange={(e) => setForm({ ...form, emergencyContactPhone: e.target.value })} /></div>
                <div><Label>Blood Group</Label><Input value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })} /></div>
                <div><Label>Genotype</Label><Input value={form.genotype} onChange={(e) => setForm({ ...form, genotype: e.target.value })} /></div>
              </div>
              <div className="rounded-xl border border-dashed p-6 text-center">
                <Upload className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                <p className="font-medium">Upload passport photo</p>
                <input type="file" accept="image/*" className="mt-4 block w-full text-sm" onChange={(e) => e.target.files?.[0] && uploadPassport(e.target.files[0])} />
                {passportUrl && <p className="mt-3 text-xs text-emerald-600">Uploaded successfully</p>}
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
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : 'Create Student Account'}
              </Button>
            )}
          </div>
        </Card>
      </section>
    </main>
  )
}
