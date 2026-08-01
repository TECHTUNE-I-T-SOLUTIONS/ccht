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
import { Loader2, ArrowRight, ArrowLeft, Upload, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { nigeriaStates, getStateLGAs, getStateNames } from '@/lib/data/nigeria-states'
import { AcademicSessionService } from '@/lib/services/academic-session.service'

type Step = 1 | 2 | 3

const GENDERS = ['male', 'female', 'other', 'prefer_not_to_say']
const NATIONALITIES = ['Nigerian', 'Ghanaian', 'Beninese', 'Nigerien', 'Cameroonian', 'Other']
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const GENOTYPES = ['AA', 'AS', 'AC', 'SS', 'SC']
const LEVELS = ['100', '200', '300', '400', '500']

export default function StudentSignupPage() {
  const supabase = createClient()
  const [step, setStep] = useState<Step>(1)
  const [checking, setChecking] = useState(true)
  const [enabled, setEnabled] = useState(false)
  const [loading, setLoading] = useState(false)
  const [passportUrl, setPassportUrl] = useState('')
  const [programs, setPrograms] = useState<{ id: string; title: string }[]>([])
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([])
  const [academicSessions, setAcademicSessions] = useState<{ id: string; name: string; is_current: boolean }[]>([])
  const [signupSuccess, setSignupSuccess] = useState(false)
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
    matricNumber: 'CCHT/',
    nationality: 'Nigerian',
    stateOfOrigin: '',
    lga: '',
    address: '',
    addressLine2: '',
    city: '',
    state: '',
    guardianName: '',
    guardianPhone: '',
    guardianEmail: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    bloodGroup: '',
    genotype: '',
    program: '',
    programId: '',
    department: '',
    academicSession: '',
    academicSessionId: '',
    level: '',
    admissionDate: '',
    expectedGraduationDate: '',
  })

  useEffect(() => {
    ;(async () => {
      try {
        const [{ data: setting }, { data: deptData }, { data: progData }, sessionRes] = await Promise.all([
          supabase.from('signup_settings').select('is_enabled').eq('signup_type', 'student').single(),
          supabase.from('departments').select('id, name').eq('is_active', true).order('name'),
          supabase.from('programs').select('id, title').eq('is_active', true).order('title'),
          fetch('/api/v1/public/academic-sessions').then(r => r.json()),
        ])
        
        // console.log('Academic sessions API response:', sessionRes)
        
        setEnabled(Boolean(setting?.is_enabled))
        setDepartments((deptData || []) as any)
        setPrograms((progData || []) as any)
        setAcademicSessions(sessionRes?.sessions || [])
        
        // Auto-select the current academic session if available
        const currentSession = sessionRes?.sessions?.find((s: any) => s.is_current)
        if (currentSession) {
          setForm(prev => ({ ...prev, academicSession: currentSession.name, academicSessionId: currentSession.id }))
        }
      } catch (error) {
        console.error('Error loading signup data:', error)
        setEnabled(false)
      } finally {
        setChecking(false)
      }
    })()
  }, [supabase])

  const canNext = useMemo(() => {
    if (step === 1) return !!form.firstName && !!form.lastName && !!form.email && !!form.password && form.password === form.confirmPassword && !!form.program && !!form.programId && !!form.academicSession && !!form.academicSessionId && !!form.level && !!form.admissionDate && !!form.expectedGraduationDate
    if (step === 2) return !!form.dateOfBirth && !!form.gender && !!form.studentNumber && !!form.matricNumber
    return true
  }, [form, step])

  const validateStep2 = () => {
    // Validate student number matches matric number suffix
    if (form.matricNumber && form.studentNumber) {
      const matricParts = form.matricNumber.split('/')
      const matricSuffix = matricParts[matricParts.length - 1]
      if (matricSuffix !== form.studentNumber) {
        toast.error(`Student number must match the last part of your matric number. Your matric number is "${form.matricNumber}", so your student number should be "${matricSuffix}"`)
        return false
      }
    }
    return true
  }

  const uploadPassport = async (file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('userId', form.email || 'temp')
    const res = await fetch('/api/v1/public/signup/upload-passport', { method: 'POST', body: fd })
    const data = await res.json()
    if (!res.ok) throw new Error(data?.error || 'Passport upload failed')
    setPassportUrl(data.url)
    toast.success('Passport photo uploaded successfully')
  }

  const deletePassport = () => {
    setPassportUrl('')
    toast.success('Passport photo removed')
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
      setSignupSuccess(true)
    } catch (error: any) {
      toast.error(error.message || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  if (checking) return <div className="min-h-screen grid place-items-center">Loading...</div>
  if (!enabled) return <div className="min-h-screen grid place-items-center">Student signup is disabled.</div>

  if (signupSuccess) {
    return (
      <main className="flex min-h-screen flex-col lg:flex-row">
        <section className="relative hidden lg:block lg:w-1/2">
          <Image src="/images/students.jpg" alt="Students" fill className="object-cover" priority sizes="(min-width: 1024px) 50vw, 100vw" />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950/70 via-indigo-950/60 to-cyan-900/40" />
          <div className="absolute inset-0 flex items-end p-12 text-white">
            <div className="max-w-lg space-y-4">
              <p className="text-sm uppercase tracking-[0.35em] text-cyan-200">Student Portal</p>
              <h1 className="text-5xl font-semibold leading-tight">Welcome to CCHT!</h1>
              <p className="text-white/80">Your journey to excellence in health technology begins here.</p>
            </div>
          </div>
        </section>
        <section className="flex w-full items-center justify-center bg-slate-50 px-4 py-8 dark:bg-slate-950 lg:w-1/2">
          <Card className="w-full max-w-2xl p-8 md:p-12 text-center">
            <div className="mb-6 flex justify-center">
              <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center">
                <svg className="h-10 w-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-2">Registration Successful!</h1>
            <p className="text-muted-foreground mb-6">Your student account has been created successfully.</p>
            
            <div className="bg-emerald-50 dark:bg-emerald-900 border border-emerald-200 dark:border-emerald-700 rounded-lg p-6 mb-6 text-left">
              <h3 className="font-semibold text-emerald-800 dark:text-emerald-200 mb-3">Your Registration Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Full Name:</span>
                  <span className="font-medium">{form.firstName} {form.lastName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium">{form.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Matric Number:</span>
                  <span className="font-medium">{form.matricNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Program:</span>
                  <span className="font-medium">{form.program}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Department:</span>
                  <span className="font-medium">{form.department}</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6 text-left">
              <h3 className="font-semibold text-blue-800 mb-3">📧 Check Your Email</h3>
              <p className="text-sm text-blue-700 mb-3">
                A detailed welcome email has been sent to <strong>{form.email}</strong> with:
              </p>
              <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                <li>Your login credentials</li>
                <li>Instructions on how to navigate the student portal</li>
                <li>Important information about your program</li>
                <li>Next steps for your academic journey</li>
              </ul>
            </div>

            <div className="bg-slate-100 border border-slate-200 rounded-lg p-6 mb-6 text-left">
              <h3 className="font-semibold text-slate-800 mb-3">🚀 Next Steps</h3>
              <ol className="text-sm text-slate-700 space-y-2 list-decimal list-inside">
                <li>Check your email for the welcome message</li>
                <li>Log in to the student portal at <a href="/login" className="text-blue-600 hover:underline">newccht.vercel.app/login</a></li>
                <li>Complete your profile setup</li>
                <li>Register for your courses</li>
                <li>Access your timetable and academic resources</li>
              </ol>
            </div>

            <Button className="w-full border border-primary hover:shadow-lg hover:shadow-blue-600" onClick={() => window.location.href = '/login'}>
              Go to Student Portal Login
            </Button>
          </Card>
        </section>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col lg:flex-row">
      <section className="relative hidden lg:block lg:w-1/2">
        <Image src="/images/students.jpg" alt="Students" fill className="object-cover" priority sizes="(min-width: 1024px) 50vw, 100vw" />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/70 via-indigo-950/60 to-cyan-900/40" />
        <div className="absolute inset-0 flex items-end p-12 text-white">
          <div className="max-w-lg space-y-4">
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-200">Student Portal</p>
            <h1 className="text-5xl font-semibold leading-tight">Start your journey with a clean, guided signup.</h1>
            <p className="text-white/80">We'll create your auth account, profile, and student record together.</p>
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
              <div>
                <Label>Program</Label>
                <Select value={form.program} onValueChange={(value) => {
                  const selectedProgram = programs.find(p => p.title === value)
                  setForm({ ...form, program: value, programId: selectedProgram?.id || '' })
                }}>
                  <SelectTrigger><SelectValue placeholder="Select program" /></SelectTrigger>
                  <SelectContent>{programs.map((p) => <SelectItem key={p.id} value={p.title}>{p.title}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Department</Label>
                <Select value={form.department} onValueChange={(value) => setForm({ ...form, department: value })}>
                  <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                  <SelectContent>{departments.map((d) => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Academic Session</Label>
                <Select value={form.academicSession} onValueChange={(value) => {
                  const selectedSession = academicSessions.find(s => s.name === value)
                  setForm({ ...form, academicSession: value, academicSessionId: selectedSession?.id || '' })
                }}>
                  <SelectTrigger><SelectValue placeholder="Select session" /></SelectTrigger>
                  <SelectContent>
                    {academicSessions.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">No active sessions available</div>
                    ) : (
                      academicSessions.map((s) => (
                        <SelectItem key={s.id} value={s.name}>
                          {s.name} {s.is_current && <span className="ml-2 text-xs text-emerald-600 font-semibold">(Current)</span>}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Level</Label>
                <Select value={form.level} onValueChange={(value) => setForm({ ...form, level: value })}>
                  <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                  <SelectContent>{LEVELS.map((l) => <SelectItem key={l} value={l}>{l}L</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Admission Date</Label>
                <Input type="date" value={form.admissionDate} onChange={(e) => setForm({ ...form, admissionDate: e.target.value })} />
              </div>
              <div>
                <Label>Expected Graduation Date</Label>
                <Input type="date" value={form.expectedGraduationDate} onChange={(e) => setForm({ ...form, expectedGraduationDate: e.target.value })} />
              </div>
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
              <div><Label>Student Number (e.g., 006 from your matric number)</Label><Input value={form.studentNumber} onChange={(e) => setForm({ ...form, studentNumber: e.target.value })} /></div>
              <div><Label>Matric Number (e.g., CCHT/2025/006)</Label><Input value={form.matricNumber} onChange={(e) => setForm({ ...form, matricNumber: e.target.value })} /></div>
              <div>
                <Label>Nationality</Label>
                <Select value={form.nationality} onValueChange={(value) => setForm({ ...form, nationality: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{NATIONALITIES.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>State of Origin</Label>
                <Select value={form.stateOfOrigin} onValueChange={(value) => setForm({ ...form, stateOfOrigin: value, lga: '' })}>
                  <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                  <SelectContent>{getStateNames().map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>LGA</Label>
                <Select value={form.lga} onValueChange={(value) => setForm({ ...form, lga: value })} disabled={!form.stateOfOrigin}>
                  <SelectTrigger><SelectValue placeholder={form.stateOfOrigin ? 'Select LGA' : 'Select state first'} /></SelectTrigger>
                  <SelectContent>
                    {form.stateOfOrigin && getStateLGAs(form.stateOfOrigin).map((lga) => (
                      <SelectItem key={lga} value={lga}>{lga}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>City</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
              <div>
                <Label>State (Residence)</Label>
                <Select value={form.state} onValueChange={(value) => setForm({ ...form, state: value })}>
                  <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                  <SelectContent>{getStateNames().map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2"><Label>Address Line 1</Label><Textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
              <div className="md:col-span-2"><Label>Address Line 2 (Optional)</Label><Input value={form.addressLine2} onChange={(e) => setForm({ ...form, addressLine2: e.target.value })} placeholder="Apartment, suite, etc." /></div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div><Label>Guardian Name</Label><Input value={form.guardianName} onChange={(e) => setForm({ ...form, guardianName: e.target.value })} /></div>
                <div><Label>Guardian Phone</Label><Input value={form.guardianPhone} onChange={(e) => setForm({ ...form, guardianPhone: e.target.value })} /></div>
                <div><Label>Guardian Email</Label><Input type="email" value={form.guardianEmail} onChange={(e) => setForm({ ...form, guardianEmail: e.target.value })} /></div>
                <div><Label>Emergency Contact Name</Label><Input value={form.emergencyContactName} onChange={(e) => setForm({ ...form, emergencyContactName: e.target.value })} /></div>
                <div><Label>Emergency Phone</Label><Input value={form.emergencyContactPhone} onChange={(e) => setForm({ ...form, emergencyContactPhone: e.target.value })} /></div>
                <div>
                  <Label>Blood Group</Label>
                  <Select value={form.bloodGroup} onValueChange={(value) => setForm({ ...form, bloodGroup: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{BLOOD_GROUPS.map((bg) => <SelectItem key={bg} value={bg}>{bg}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Genotype</Label>
                  <Select value={form.genotype} onValueChange={(value) => setForm({ ...form, genotype: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{GENOTYPES.map((gt) => <SelectItem key={gt} value={gt}>{gt}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="rounded-xl border border-dashed p-6 text-center">
                {passportUrl ? (
                  <div className="relative inline-block">
                    <img src={passportUrl} alt="Passport preview" className="mx-auto h-32 w-32 rounded-full object-cover border-2 border-primary" />
                    <button
                      type="button"
                      onClick={deletePassport}
                      className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <p className="mt-3 text-xs text-emerald-600 font-medium">Passport uploaded successfully</p>
                  </div>
                ) : (
                  <>
                    <Upload className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                    <p className="font-medium">Upload passport photo</p>
                    <input type="file" accept="image/*" className="mt-4 block w-full text-sm" onChange={(e) => e.target.files?.[0] && uploadPassport(e.target.files[0])} />
                  </>
                )}
              </div>
            </div>
          )}

          <div className="mt-6 flex items-center justify-between gap-3">
            <Button type="button" variant="outline" disabled={step === 1 || loading} onClick={() => setStep((s) => (s - 1) as Step)}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            {step < 3 ? (
              <Button type="button" disabled={!canNext || loading} onClick={() => {
                if (step === 2 && !validateStep2()) return
                setStep((s) => (s + 1) as Step)
              }} className="border border-primary hover:shadow-lg hover:shadow-blue-600">
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button type="button" disabled={loading} onClick={submit} className="border border-primary hover:shadow-lg hover:shadow-blue-600">
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : 'Create Student Account'}
              </Button>
            )}
          </div>
        </Card>
      </section>
    </main>
  )
}
