'use client'

import { useMemo, useState, useEffect, Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { z } from 'zod'
import { motion, AnimatePresence } from 'motion/react'
import { Navbar } from '@/components/public/navbar'
import { Footer } from '@/components/public/footer'
import { ROUTES } from '@/lib/constants'
import { ArrowRight, BadgeCheck, Check, ChevronDown, FileText, Info, School, ShieldCheck, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Section } from '@/components/ui/section'
import { Input } from '@/components/ui/input'
import { TypographyH1, TypographyH3, TypographyLead, TypographyP, TypographyTechnical } from '@/components/ui/typography'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { ProgramsService, Program } from '@/lib/services/programs.service'

const initial = {
  firstName: '',
  middleName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
  phone: '',
  jambRegNo: '',
  admissionSession: '',
}

// Step 1 validation schema (personal details)
const stepOneSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  middleName: z.string().optional().or(z.literal('')),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(10, 'Password must be at least 10 characters'),
  confirmPassword: z.string().min(10, 'Password must be at least 10 characters'),
  phone: z.string().min(10, 'Phone number must be at least 10 characters').regex(/^[0-9+\-\s()]+$/, 'Invalid phone number format'),
  jambRegNo: z.string().optional().or(z.literal('')),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

// Step 2 validation schema (session and course)
const stepTwoSchema = z.object({
  admissionSession: z.string().min(1, 'Please select an admission session'),
})

const steps = [
  'Create your account and confirm your email.',
  'Pay the ₦6,500 application fee.',
  'Complete your profile and upload documents.',
  'Take the entrance exam when scheduled.',
  'Pay the ₦30,000 admission and administrative charge if offered admission.',
  'Pay at least 50% tuition to prepare for resumption.',
]

function ApplyPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState(initial)
  const [course, setCourse] = useState('')
  const [courseId, setCourseId] = useState('')
  const [admissionSession, setAdmissionSession] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [courseOpen, setCourseOpen] = useState(false)
  const [programs, setPrograms] = useState<Program[]>([])
  const [loadingPrograms, setLoadingPrograms] = useState(true)
  const [sessions, setSessions] = useState<{id: string, name: string}[]>([])
  const [loadingSessions, setLoadingSessions] = useState(true)

  useEffect(() => {
    const loadPrograms = async () => {
      try {
        const data = await ProgramsService.getActivePrograms()
        setPrograms(data)
      } catch (error) {
        console.error('Failed to load programs:', error)
        toast.error('Failed to load available programs')
      } finally {
        setLoadingPrograms(false)
      }
    }
    loadPrograms()
  }, [])

  useEffect(() => {
    const loadSessions = async () => {
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        
        // Query for active sessions that are eligible for admission
        const { data, error } = await supabase
          .from('academic_sessions')
          .select('id, name')
          .eq('is_active', true)
          .order('name', { ascending: false })

        console.log('Loaded sessions from DB:', data, error)

        if (error) throw error
        
        if (data && data.length > 0) {
          setSessions(data)
        } else {
          // Fallback to default sessions if database is empty
          console.log('No sessions found, using fallback')
          setSessions([
            { id: '2025/2026', name: '2025/2026' },
            { id: '2026/2027', name: '2026/2027' },
            { id: '2027/2028', name: '2027/2028' },
          ])
        }
      } catch (error) {
        console.error('Failed to load sessions:', error)
        // Fallback to default sessions if database fetch fails
        setSessions([
          { id: '2025/2026', name: '2025/2026' },
          { id: '2026/2027', name: '2026/2027' },
          { id: '2027/2028', name: '2027/2028' },
        ])
      } finally {
        setLoadingSessions(false)
      }
    }
    loadSessions()
  }, [])

  useEffect(() => {
    const emailParam = searchParams.get('email')
    if (emailParam) {
      setForm((prev) => ({ ...prev, email: emailParam }))
    }
  }, [searchParams])

  const progress = useMemo(() => Math.round((step / 3) * 100), [step])

  const validateStepOne = () => {
    // console.log('Validating step 1:', form)
    
    const result = stepOneSchema.safeParse(form)
    if (result.success) {
      setErrors({})
      return true
    }
    
    const fieldErrors: Record<string, string> = {}
    console.log('Validation errors:', result.error.issues)
    
    for (const issue of result.error.issues) {
      const key = issue.path[0]
      if (typeof key === 'string' && !fieldErrors[key]) {
        fieldErrors[key] = issue.message
      }
    }
    setErrors(fieldErrors)
    return false
  }

  const validateStepTwo = () => {
    // console.log('Validating step 2:', { admissionSession, course })
    
    const result = stepTwoSchema.safeParse({ admissionSession })
    if (result.success) {
      return true
    }
    
    const fieldErrors: Record<string, string> = {}
    console.log('Step 2 validation errors:', result.error.issues)
    
    for (const issue of result.error.issues) {
      const key = issue.path[0]
      if (typeof key === 'string' && !fieldErrors[key]) {
        fieldErrors[key] = issue.message
      }
    }
    setErrors(fieldErrors)
    return false
  }

  const goNext = async () => {
    console.log('goNext called, step:', step)
    
    if (step === 1) {
      // console.log('Validating step 1...')
      const isValid = validateStepOne()
      // console.log('Validation result:', isValid, 'Errors:', errors)
      if (!isValid) {
        console.log('Validation failed, not proceeding')
        return
      }
      console.log('Validation passed, proceeding to step 2')
    }
    
    if (step === 2) {
      console.log('Validating step 2...')
      const isValid = validateStepTwo()
      // console.log('Step 2 validation result:', isValid, 'Errors:', errors)
      if (!isValid) {
        console.log('Step 2 validation failed, not proceeding')
        return
      }
      
      if (!course) {
        setErrors((prev) => ({ ...prev, course: 'Please choose a course.' }))
        return
      }
    }

    if (step < 3) {
      console.log('Moving to next step:', step + 1)
      setStep((value) => value + 1)
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          role: 'aspirant',
          jamb_reg_no: form.jambRegNo || null,
          preferred_program_id: courseId || null,
          admission_session: admissionSession,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        const message = data?.error || 'We could not complete your signup right now.'
        setErrors({ submit: message })
        toast.error(message)
        return
      }

      toast.success('Admission profile created successfully.')
      router.push(`${ROUTES.login}?application=created`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-background pt-24 lg:pt-0">
        <section className="border-b border-border bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.12),transparent_30%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--accent-soft)))]">
          <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:px-12 lg:py-24">
            <div className="max-w-2xl">
              <Badge className="bg-background text-primary shadow-sm border border-primary">ADMISSION 2026/2027</Badge>
              <TypographyH1 className="mt-5 text-4xl leading-tight md:text-6xl">
                Begin your admission journey
              </TypographyH1>
              <TypographyLead className="mt-5 max-w-xl text-foreground/75">
                Create your aspirant profile, pay the application fee, complete your documents, and move through the admission steps in sequence.
              </TypographyLead>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="#application-form" className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground border border-gray-200 shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background">
                  Start now <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href={ROUTES.programs} className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-6 py-3 text-sm font-semibold">
                  View programs
                </Link>
              </div>
            </div>
            <div className="rounded-[2rem] border border-border bg-background p-3 shadow-xl">
              <div className="relative min-h-[380px] overflow-hidden rounded-[1.5rem]">
                <Image src="/images/CONVENT2.jpg.jpeg" alt="Admissions" fill className="object-cover" loading="eager" sizes="(max-width: 768px) 100vw, 50vw" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-900/15 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/75">Admission process</p>
                  <h2 className="mt-2 text-2xl font-bold">Easy, simple and clear</h2>
                  <p className="mt-2 text-sm leading-7 text-white/80">
                    The process is seamless and designed to guide you through each step, from application to acceptance.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Section className="bg-background">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {[
              { title: 'Direct admission flow', text: 'Designed around application, exam, and acceptance.', icon: ShieldCheck },
              { title: 'Optional JAMB field', text: 'Keep it for the future without blocking current admissions.', icon: BadgeCheck },
              { title: 'Clear documents', text: 'Every required admission document is listed upfront.', icon: FileText },
              { title: 'Student handoff', text: 'Accepted applicants move into the student portal.', icon: School },
            ].map((item) => {
              const Icon = item.icon
              return (
                <article key={item.title} className="rounded-3xl border border-border bg-background p-6 shadow-sm">
                  <Icon className="h-6 w-6 text-primary" />
                  <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-foreground/70">{item.text}</p>
                </article>
              )
            })}
          </div>
        </Section>

        <Section className="border-y border-border bg-background/70">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-[2rem] border border-border bg-background p-8 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Steps</p>
              <TypographyH3 className="mt-3 text-3xl">Admission steps</TypographyH3>
              <div className="mt-6 space-y-4">
                {steps.map((item, index) => (
                  <div key={item} className="flex gap-4 rounded-2xl border border-border bg-background p-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
                      {index + 1}
                    </div>
                    <p className="text-sm leading-7 text-foreground/75">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[2rem] border border-border bg-background p-8 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Documents</p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {[
                    'Application form',
                    'Acceptance and provisional letter',
                    "O'level result",
                    'Birth certificate',
                    'State of origin certificate',
                    'National Identification Slip',
                    'Medical fitness report/certificate',
                    'Passport photo',
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-3 rounded-2xl border border-border bg-background p-4 text-sm font-medium">
                      <Check className="h-4 w-4 text-primary" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[2rem] border border-primary/15 bg-gradient-to-br from-primary/10 to-white p-8 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Fees</p>
                <div className="mt-4 space-y-2 text-sm leading-7 text-foreground/75">
                  <p>Application fee: ₦6,500</p>
                  <p>Admission / administrative charge: ₦30,000</p>
                  <p>Tuition: at least 50% upfront before resumption</p>
                </div>
              </div>
            </div>
          </div>
        </Section>

        <Section className="bg-background" id="application-form">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[2rem] border border-border bg-background p-8 shadow-sm">
              <div className="mb-10">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-300 dark:bg-blue-950">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full rounded-full bg-black dark:bg-blue-300" />
                </div>
              </div>

              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="grid gap-6 md:grid-cols-2">
                    {[
                      ['First Name', 'firstName'],
                      ['Middle Name (optional)', 'middleName'],
                      ['Last Name', 'lastName'],
                      ['Email Address', 'email'],
                      ['Phone Number', 'phone'],
                      ['JAMB Registration No. (optional)', 'jambRegNo'],
                      ['Password', 'password'],
                      ['Confirm Password', 'confirmPassword'],
                    ].map(([label, field]) => (
                      <label key={field} className={cn('space-y-2', field === 'jambRegNo' && 'md:col-span-2')}>
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/55">{label}</span>
                        <Input
                          type={field.includes('password') ? 'password' : field === 'email' ? 'email' : 'text'}
                          className="h-14 rounded-2xl border-border bg-background"
                          value={(form as any)[field]}
                          onChange={(e) => {
                            setForm({ ...form, [field]: e.target.value })
                            // Clear error when user starts typing
                            if (errors[field]) {
                              setErrors((prev) => {
                                const newErrors = { ...prev }
                                delete newErrors[field]
                                return newErrors
                              })
                            }
                          }}
                        />
                        {errors[field] && <p className="text-xs font-semibold text-red-500">{errors[field]}</p>}
                      </label>
                    ))}
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                    <div className="relative">
                      <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-foreground/55 mb-2">Admission Session</label>
                      <select
                        value={admissionSession}
                        onChange={(e) => setAdmissionSession(e.target.value)}
                        className="w-full rounded-2xl border border-border bg-white dark:bg-black p-4 text-left h-14 appearance-none"
                      >
                        <option value="">Select admission session</option>
                        {loadingSessions ? (
                          <option value="" disabled>Loading sessions...</option>
                        ) : sessions.length === 0 ? (
                          <option value="" disabled>No sessions available</option>
                        ) : (
                          sessions.map((session) => (
                            <option key={session.id} value={session.name}>{session.name}</option>
                          ))
                        )}
                      </select>
                      {errors.admissionSession && <p className="text-xs font-semibold text-red-500 mt-2">{errors.admissionSession}</p>}
                      {!loadingSessions && sessions.length === 0 && (
                        <p className="text-xs text-yellow-600 mt-2">No active admission sessions available. Please contact admin.</p>
                      )}
                    </div>

                    <div className="relative">
                      <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-foreground/55 mb-2">Course of Study</label>
                      <button onClick={() => setCourseOpen(!courseOpen)} className="flex w-full items-center justify-between rounded-2xl border border-border bg-background p-5 text-left">
                        <span className={cn('font-semibold', !course && 'text-muted-foreground')}>{course || 'Select a course of study'}</span>
                        <ChevronDown className={cn('h-5 w-5 transition-transform', courseOpen && 'rotate-180')} />
                      </button>
                      <AnimatePresence>
                        {courseOpen && (
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-border bg-white dark:bg-black shadow-2xl">
                            {loadingPrograms ? (
                              <div className="p-4 text-center text-sm text-muted-foreground">Loading programs...</div>
                            ) : programs.length === 0 ? (
                              <div className="p-4 text-center text-sm text-muted-foreground">No programs available for admission</div>
                            ) : (
                              programs.map((program: Program) => (
                                <button key={program.id} onClick={() => { setCourse(program.title); setCourseId(program.id); setCourseOpen(false) }} className="flex w-full items-center justify-between p-4 text-left hover:bg-primary/5">
                                  <span>{program.title}</span>
                                  {courseId === program.id && <Check className="h-4 w-4 text-primary" />}
                                </button>
                              ))
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    {errors.course && <p className="text-xs font-semibold text-red-500">{errors.course}</p>}
                    <div className="rounded-2xl border border-border bg-background p-5">
                      <p className="text-sm font-semibold">What happens next?</p>
                      <p className="mt-2 text-sm leading-7 text-foreground/70">
                        After signup, the application fee unlocks the full form and document upload steps.
                      </p>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <ReviewCard label="Full Name" value={`${form.firstName} ${form.middleName} ${form.lastName}`.replace(/\s+/g, ' ').trim()} />
                      <ReviewCard label="Email" value={form.email} />
                      <ReviewCard label="Phone" value={form.phone} />
                      <ReviewCard label="Admission Session" value={admissionSession} />
                      <ReviewCard label="Course" value={course} />
                      <ReviewCard label="JAMB Reg" value={form.jambRegNo || 'Optional'} className="sm:col-span-2" />
                    </div>
                    <div className="flex gap-4 rounded-3xl border border-primary/10 bg-primary/5 p-5">
                      <Info className="h-6 w-6 shrink-0 text-primary" />
                      <div>
                        <p className="text-sm font-bold text-primary">FINAL CHECK</p>
                        <p className="mt-1 text-sm text-muted-foreground">Make sure your details match your official documents before submission.</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mt-10 flex items-center justify-between gap-4 border-t border-border pt-6">
                <Button variant="ghost" disabled={step === 1} onClick={() => setStep((value) => Math.max(1, value - 1))} className="rounded-full px-6">
                  Back
                </Button>
                <div className="flex flex-col items-end gap-2">
                  {errors.submit && <p className="text-xs font-semibold text-red-500">{errors.submit}</p>}
                  <Button onClick={goNext} disabled={submitting} className="rounded-full px-8">
                    {submitting ? 'Processing...' : step === 3 ? 'Complete Profile' : 'Continue'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[2rem] border border-border bg-background p-8 shadow-sm">
                <TypographyTechnical className="text-primary font-bold">Support</TypographyTechnical>
                <TypographyH3 className="mt-3 text-2xl">Need help with your application?</TypographyH3>
                <TypographyP className="mt-4 text-sm text-muted-foreground">
                  Our admissions office can help with login, payment, and document questions.
                </TypographyP>
                <Separator className="my-8" />
                <ul className="space-y-4">
                  {[
                    'Use an email you can access immediately.',
                    'Upload clear, readable copies of your documents.',
                    'JAMB details are optional for now.',
                  ].map((item) => (
                    <li key={item} className="flex gap-3 text-sm text-muted-foreground">
                      <Check className="mt-0.5 h-4 w-4 text-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-[2rem] border border-border bg-background p-8 shadow-sm">
                <BadgeCheck className="h-10 w-10 text-primary" />
                <TypographyH3 className="mt-5 text-xl">What successful applicants receive</TypographyH3>
                <TypographyP className="mt-4 text-sm text-muted-foreground">
                  Admission letter, document access, and the transition to the student portal after acceptance and payment.
                </TypographyP>
              </div>
            </div>
          </div>
        </Section>
      </main>
      <Footer />
    </div>
  )
}

export default function ApplyPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center p-8"><div className="text-sm text-muted-foreground">Loading...</div></div>}>
      <ApplyPageInner />
    </Suspense>
  )
}

function ReviewCard({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={cn('rounded-3xl border border-border bg-white dark:bg-black p-5', className)}>
      <TypographyTechnical className="mb-2 block text-[10px] font-bold text-muted-foreground">{label}</TypographyTechnical>
      <p className="font-semibold text-foreground">{value || '---'}</p>
    </div>
  )
}