'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { Navbar } from '@/components/public/navbar'
import { Footer } from '@/components/public/footer'
import { ROUTES } from '@/lib/constants'
import { ArrowRight, CheckCircle2, ChevronDown, Check, GraduationCap, School, ShieldCheck, Users, X } from 'lucide-react'
import { toast } from 'sonner'

const initial = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
  phone: '',
  jambRegNo: '',
}

const signupSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Confirm your password'),
  phone: z.string().min(10, 'Enter a valid phone number').regex(/^[0-9+\-\s()]+$/, 'Enter a valid phone number'),
  jambRegNo: z.string().min(5, 'Enter your JAMB registration number'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

const courses = [
  'Medical Laboratory Technology',
  'Community Health',
  'Public Health',
  'Pharmacy Technician',
]

const applicantTips = [
  'Use a valid email and phone number you check regularly.',
  'Keep your JAMB registration number and name consistent.',
  'Choose the course that matches your interest and result profile.',
]

const passwordRules = [
  { label: 'At least 10 characters', test: (value: string) => value.length >= 10 },
  { label: 'One uppercase letter', test: (value: string) => /[A-Z]/.test(value) },
  { label: 'One lowercase letter', test: (value: string) => /[a-z]/.test(value) },
  { label: 'One number', test: (value: string) => /[0-9]/.test(value) },
  { label: 'One special character', test: (value: string) => /[^A-Za-z0-9]/.test(value) },
]

export default function ApplyPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState(initial)
  const [course, setCourse] = useState('')
  const [applicationType, setApplicationType] = useState('Fresh admission')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [courseOpen, setCourseOpen] = useState(false)

  const progress = useMemo(() => Math.round((step / 3) * 100), [step])
  const passwordScore = passwordRules.filter((rule) => rule.test(form.password)).length
  const passwordStrong = passwordScore === passwordRules.length

  const validateStepOne = () => {
    const result = signupSchema.safeParse(form)
    if (result.success) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next.firstName
        delete next.lastName
        delete next.email
        delete next.password
        delete next.confirmPassword
        delete next.phone
        delete next.jambRegNo
        return next
      })
      return true
    }

    const fieldErrors: Record<string, string> = {}
    for (const issue of result.error.issues) {
      const key = issue.path[0]
      if (typeof key === 'string' && !fieldErrors[key]) fieldErrors[key] = issue.message
    }
    setErrors((prev) => ({ ...prev, ...fieldErrors }))
    return false
  }

  const goNext = async () => {
    if (step === 1 && !validateStepOne()) return
    if (step === 2 && !course) {
      setErrors((prev) => ({ ...prev, course: 'Please choose a course before continuing.' }))
      return
    }
    if (step < 3) {
      setStep((s) => s + 1)
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          password: form.password,
          confirmPassword: form.confirmPassword,
          phone: form.phone,
          jambRegNo: form.jambRegNo,
          role: 'aspirant',
          jamb_reg_no: form.jambRegNo,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        const message =
          data?.error ||
          data?.details?.fieldErrors?.email?.[0] ||
          data?.details?.fieldErrors?.password?.[0] ||
          'We could not complete your signup right now.'
        setErrors({
          submit: message,
        })
        toast.error(message)
        return
      }

      toast.success('Admission profile created successfully.')
      router.push(`${ROUTES.login}?application=created`)
    } finally {
      setSubmitting(false)
    }
  }

  const goBack = () => setStep((s) => Math.max(1, s - 1))

  return (
    <>
      <Navbar />
      <main className="bg-background text-foreground">
        <section className="relative overflow-hidden border-b border-border bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.12),transparent_24%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--card)))]">
          <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 sm:px-6 md:px-8 lg:grid-cols-[1fr_0.92fr] lg:px-12 lg:py-20">
            <div className="max-w-2xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                <School className="h-3.5 w-3.5" />
                Application form
              </p>
              <h1 className="mt-5 text-balance text-4xl font-extrabold leading-tight md:text-5xl">
                Create your admission profile
              </h1>
              <p className="mt-4 max-w-xl text-base leading-8 text-foreground/75">
                Start your admission journey with your personal details and JAMB registration number. After signup, you can log in and continue
                from your aspirant dashboard.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href={ROUTES.admissions} className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-3 text-sm font-semibold transition hover:border-primary/40 hover:text-primary">
                  Back to admissions
                </Link>
                <Link href={ROUTES.login} className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">
                  Sign in instead <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-xl">
              <div className="relative min-h-[360px]">
                <Image
                  src="/images/hero-bg1.jpg"
                  alt="Admissions at Covenant College of Health Technology"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/75">Easy admission</p>
                  <h2 className="mt-2 text-2xl font-bold">Your student journey starts here</h2>
                  <p className="mt-2 text-sm leading-7 text-white/80">
                    Fill the form, choose your course, and finish the first step of your application with ease.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-14 sm:px-6 md:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:px-12">
          <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
            <div className="flex flex-wrap gap-2">
              {['Profile', 'Course', 'Review'].map((label, index) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    if (index + 1 <= step) return setStep(index + 1)
                    if (index === 1 && validateStepOne()) return setStep(2)
                    if (index === 2 && validateStepOne() && course) return setStep(3)
                  }}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    step === index + 1 ? 'bg-primary text-primary-foreground' : 'border border-border bg-background'
                  }`}
                >
                  {index + 1}. {label}
                </button>
              ))}
            </div>

            <div className="mt-6 h-2 overflow-hidden rounded-full bg-border">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
            </div>

            {step === 1 && (
              <div className="mt-8 grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium">First name</span>
                  <input
                    className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  />
                  {errors.firstName && <p className="mt-2 text-xs text-red-600">{errors.firstName}</p>}
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium">Last name</span>
                  <input
                    className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  />
                  {errors.lastName && <p className="mt-2 text-xs text-red-600">{errors.lastName}</p>}
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium">Email address</span>
                  <input
                    className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                  {errors.email && <p className="mt-2 text-xs text-red-600">{errors.email}</p>}
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium">Password</span>
                  <input
                    className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm"
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <p className={`text-xs ${passwordStrong ? 'text-emerald-600' : 'text-foreground/60'}`}>
                      {form.password ? `${passwordScore} of ${passwordRules.length} checks passed` : 'Choose a strong password.'}
                    </p>
                    <span className={`inline-flex items-center gap-1 text-xs font-medium ${passwordStrong ? 'text-emerald-600' : 'text-foreground/50'}`}>
                      <ShieldCheck className="h-3.5 w-3.5" />
                      {passwordStrong ? 'Secure' : 'Needs work'}
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-border">
                    <div
                      className={`h-full rounded-full transition-all ${passwordStrong ? 'bg-emerald-500' : passwordScore >= 3 ? 'bg-amber-500' : 'bg-rose-500'}`}
                      style={{ width: `${(passwordScore / passwordRules.length) * 100}%` }}
                    />
                  </div>
                  <ul className="mt-3 grid gap-2 text-xs text-foreground/65 sm:grid-cols-2">
                    {passwordRules.map((rule) => {
                      const met = rule.test(form.password)
                      return (
                        <li key={rule.label} className={`flex items-center gap-2 ${met ? 'text-emerald-600' : ''}`}>
                          {met ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                          <span>{rule.label}</span>
                        </li>
                      )
                    })}
                  </ul>
                  {errors.password && <p className="mt-2 text-xs text-red-600">{errors.password}</p>}
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium">Confirm password</span>
                  <input
                    className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm"
                    type="password"
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  />
                  {errors.confirmPassword && <p className="mt-2 text-xs text-red-600">{errors.confirmPassword}</p>}
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium">Phone number</span>
                  <input
                    className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                  {errors.phone && <p className="mt-2 text-xs text-red-600">{errors.phone}</p>}
                </label>
                <label className="block md:col-span-2">
                  <span className="mb-2 block text-sm font-medium">JAMB registration number</span>
                  <input
                    className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm"
                    value={form.jambRegNo}
                    onChange={(e) => setForm({ ...form, jambRegNo: e.target.value })}
                  />
                  {errors.jambRegNo && <p className="mt-2 text-xs text-red-600">{errors.jambRegNo}</p>}
                </label>
              </div>
            )}

            {step === 2 && (
              <div className="mt-8 space-y-4">
                <div className="relative block">
                  <span className="mb-2 block text-sm font-medium">Choose your course</span>
                  <button
                    type="button"
                    aria-haspopup="listbox"
                    aria-expanded={courseOpen}
                    onClick={() => setCourseOpen((open) => !open)}
                    className="flex w-full items-center justify-between rounded-2xl border border-border bg-background px-4 py-3 text-left text-sm text-foreground shadow-sm transition hover:border-primary/40 hover:bg-accent/20 dark:bg-card dark:hover:bg-accent/10"
                  >
                    <span className={course ? 'text-foreground' : 'text-foreground/55'}>
                      {course || 'Select a course'}
                    </span>
                    <ChevronDown className={`h-4 w-4 transition ${courseOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {errors.course && <p className="mt-2 text-xs text-red-600">{errors.course}</p>}
                  {courseOpen && (
                    <div
                      role="listbox"
                      className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-border bg-background shadow-2xl ring-1 ring-black/5 dark:bg-popover dark:ring-white/10"
                    >
                      {courses.map((item) => (
                        <button
                          key={item}
                          type="button"
                          role="option"
                          aria-selected={course === item}
                          onClick={() => {
                            setCourse(item)
                            setErrors((prev) => ({ ...prev, course: '' }))
                            setCourseOpen(false)
                          }}
                          className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition ${
                            course === item
                              ? 'bg-primary text-primary-foreground shadow-[inset_0_0_0_1px_hsl(var(--primary-foreground)/0.2)]'
                              : 'bg-background text-foreground hover:bg-accent/40 dark:bg-popover dark:text-popover-foreground dark:hover:bg-accent/20'
                          }`}
                        >
                          <span>{item}</span>
                          {course === item && <Check className="h-4 w-4" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="rounded-[2rem] border border-border bg-background p-5">
                  <p className="text-sm font-semibold">Application type</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Application type">
                    {['Fresh admission', 'Transfer candidate', 'Returning applicant', 'Special consideration'].map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setApplicationType(item)}
                        aria-pressed={applicationType === item}
                        className={`rounded-2xl border px-4 py-3 text-left text-sm font-medium transition duration-200 ${
                          applicationType === item
                            ? 'border-primary bg-primary text-primary-foreground shadow-[0_14px_35px_-18px_hsl(var(--primary)/0.95)] ring-2 ring-primary/20 dark:ring-primary/35'
                            : 'border-border bg-background text-foreground/80 hover:border-primary/40 hover:bg-accent/40 dark:bg-card dark:hover:bg-accent/20'
                        }`}
                      >
                        <span className="flex items-center justify-between gap-3">
                          <span className="flex items-center gap-2">
                            <span
                              className={`flex h-5 w-5 items-center justify-center rounded-full border transition ${
                                applicationType === item
                                  ? 'border-primary-foreground/90 bg-primary-foreground text-primary'
                                  : 'border-foreground/25 bg-transparent dark:border-foreground/35'
                              }`}
                            >
                              {applicationType === item && <Check className="h-3 w-3" />}
                            </span>
                            <span>{item}</span>
                          </span>
                          {applicationType === item && (
                            <span className="rounded-full border border-primary-foreground/30 bg-primary-foreground/15 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary-foreground">
                              Selected
                            </span>
                          )}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="mt-8 rounded-[2rem] border border-border bg-background p-6 text-sm leading-7 text-foreground/75">
                <p className="font-semibold text-foreground">Review your details before submitting</p>
                <p className="mt-1 text-foreground/65">Please confirm that the information below matches your records.</p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {[
                    { label: 'Full name', value: `${form.firstName || 'First name'} ${form.lastName || 'Last name'}` },
                    { label: 'Email', value: form.email || 'Email not entered yet' },
                    { label: 'Phone', value: form.phone || 'Phone not entered yet' },
                    { label: 'JAMB reg. no.', value: form.jambRegNo || 'JAMB number not entered yet' },
                    { label: 'Selected course', value: course || 'No course selected' },
                    { label: 'Application type', value: applicationType },
                  ].map((item) => (
                    <div key={item.label} className="rounded-2xl border border-border bg-card p-4">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-foreground/45">{item.label}</p>
                      <p className="mt-2 font-semibold text-foreground">{item.value}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-5 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-foreground/80 dark:bg-primary/10">
                  <p className="font-semibold text-foreground">What happens next</p>
                  <p className="mt-1">
                    After submission, your application will be created and you can sign in to continue from your aspirant dashboard.
                  </p>
                </div>
              </div>
            )}

            <div className="mt-8 flex items-center justify-between gap-4">
              <button
                type="button"
                disabled={step === 1}
                onClick={goBack}
                className="rounded-full border border-border px-5 py-3 text-sm font-semibold disabled:opacity-40"
              >
                Back
              </button>
              {errors.submit && <p className="text-sm text-red-600">{errors.submit}</p>}
              <button
                type="button"
                onClick={goNext}
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
              >
                {submitting ? 'Submitting...' : step === 3 ? 'Complete signup' : 'Continue'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[2rem] border border-border bg-card p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-primary/10 p-3 text-primary"><Users className="h-5 w-5" /></div>
                <div>
                  <h2 className="text-xl font-bold">Before you begin</h2>
                  <p className="text-sm text-muted-foreground">Have these details ready.</p>
                </div>
              </div>
              <ul className="mt-5 space-y-3 text-sm text-foreground/75">
                {applicantTips.map((item) => (
                  <li key={item} className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-[2rem] border border-border bg-gradient-to-br from-primary/10 to-secondary/10 p-6">
              <GraduationCap className="h-7 w-7 text-primary" />
              <h3 className="mt-4 text-xl font-bold">Need help choosing a course?</h3>
              <p className="mt-2 text-sm leading-7 text-foreground/70">
                Visit the programs page to see which course fits your interest best before you continue.
              </p>
              <Link href={ROUTES.programs} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                View programs <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
