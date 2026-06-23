'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { motion, AnimatePresence } from 'motion/react'
import { Navbar } from '@/components/public/navbar'
import { Footer } from '@/components/public/footer'
import { ROUTES } from '@/lib/constants'
import { 
  ArrowRight, 
  CheckCircle2, 
  ChevronDown, 
  Check, 
  GraduationCap, 
  School, 
  ShieldCheck, 
  Users, 
  X,
  FileText,
  Info,
  BadgeCheck
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Section } from '@/components/ui/section'
import { Input } from '@/components/ui/input'
import { 
  TypographyH1, 
  TypographyH2, 
  TypographyH3, 
  TypographyP, 
  TypographyTechnical,
  TypographyLead
} from '@/components/ui/typography'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

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
          ...form,
          role: 'aspirant',
          jamb_reg_no: form.jambRegNo,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        const message =
          data?.error ||
          data?.details?.fieldErrors?.email?.[0] ||
          'We could not complete your signup right now.'
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

  const goBack = () => setStep((s) => Math.max(1, s - 1))

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-background pt-24 lg:pt-0">
        <section className="relative min-h-[50vh] flex flex-col lg:flex-row overflow-hidden bg-secondary">
           {/* Header Content */}
           <div className="flex-1 text-muted-foreground relative z-10 flex items-center py-16 lg:py-0">
              <div className="mx-auto px-6 sm:px-12 lg:px-24 max-w-4xl">
                 <motion.div
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                 >
                   <Badge className="bg-primary text-muted-foreground border-none px-4 py-1 rounded-full font-technical mb-6">
                     ADMISSION 2026/2027
                   </Badge>
                   <TypographyH1 className="text-muted-foreground text-4xl md:text-5xl lg:text-6xl leading-tight">
                     Begin Your <br /> Professional Journey
                   </TypographyH1>
                   <TypographyLead className="mt-6 text-muted-foreground/70 max-w-md">
                     Create your aspirant profile to start the admission process. Fast, secure, and fully digital.
                   </TypographyLead>
                 </motion.div>
              </div>
           </div>

           {/* Hero Media (Asymmetric Split) */}
           <div className="relative flex-[0.8] min-h-[300px] lg:min-h-0 hidden lg:block">
              <Image
                src="https://images.pexels.com/photos/7942517/pexels-photo-7942517.jpeg"
                alt="Admissions"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/20" />
              <div className="absolute top-0 -left-[1px] bottom-0 w-24 z-20 fill-secondary">
                 <svg viewBox="0 0 100 800" className="h-full w-full preserve-3d" preserveAspectRatio="none">
                    <path d="M0,0 Q60,200 40,400 Q60,600 0,800 L0,0 Z" />
                 </svg>
              </div>
           </div>
        </section>

        <Section className="bg-accent-soft/30 -mt-10 lg:-mt-20 relative z-30 pt-0">
           <div className="grid lg:grid-cols-12 gap-12 max-w-7xl mx-auto">
              {/* Form Area */}
              <div className="lg:col-span-8 bg-background rounded-[3rem] p-8 md:p-12 shadow-2xl shadow-primary/5 border border-border/50">
                 <div className="flex flex-wrap items-center gap-4 mb-10">
                    {['Profile', 'Preference', 'Review'].map((label, index) => (
                      <div key={label} className="flex items-center gap-4">
                         <button
                           onClick={() => {
                             if (index + 1 < step) setStep(index + 1)
                           }}
                           className={cn(
                             "h-10 px-6 rounded-full text-xs font-technical font-bold transition-all",
                             step === index + 1 
                               ? "bg-primary text-muted-foreground shadow-lg shadow-primary/20" 
                               : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary"
                           )}
                         >
                           {index + 1}. {label.toUpperCase()}
                         </button>
                         {index < 2 && <ArrowRight className="h-3 w-3 text-muted-foreground/30" />}
                      </div>
                    ))}
                 </div>

                 <div className="mb-12">
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                       <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: `${progress}%` }}
                         className="h-full bg-primary"
                       />
                    </div>
                 </div>

                 <AnimatePresence mode="wait">
                    {step === 1 && (
                      <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="grid gap-8 md:grid-cols-2"
                      >
                         <FormField label="First Name" error={errors.firstName}>
                            <Input
                              className="input-base"
                              placeholder="e.g. John"
                              value={form.firstName}
                              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                            />
                         </FormField>
                         <FormField label="Last Name" error={errors.lastName}>
                            <Input
                              className="input-base"
                              placeholder="e.g. Doe"
                              value={form.lastName}
                              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                            />
                         </FormField>
                         <FormField label="Email Address" error={errors.email}>
                            <Input
                              type="email"
                              className="input-base"
                              placeholder="john.doe@example.com"
                              value={form.email}
                              onChange={(e) => setForm({ ...form, email: e.target.value })}
                            />
                         </FormField>
                         <FormField label="Phone Number" error={errors.phone}>
                            <Input
                              className="input-base"
                              placeholder="+234 ..."
                              value={form.phone}
                              onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            />
                         </FormField>
                         <FormField label="JAMB Registration No." error={errors.jambRegNo} className="md:col-span-2">
                            <Input
                              className="input-base"
                              placeholder="Enter your 10-digit number"
                              value={form.jambRegNo}
                              onChange={(e) => setForm({ ...form, jambRegNo: e.target.value })}
                            />
                         </FormField>
                         <FormField label="Create Password" error={errors.password}>
                            <Input
                              type="password"
                              className="input-base"
                              placeholder="At least 8 characters"
                              value={form.password}
                              onChange={(e) => setForm({ ...form, password: e.target.value })}
                            />
                            {form.password && (
                               <div className="mt-4 p-4 bg-muted rounded-2xl">
                                  <div className="flex justify-between items-center mb-2">
                                     <span className="text-[10px] font-technical font-bold text-muted-foreground">STRENGTH</span>
                                     <span className={cn("text-[10px] font-bold", passwordStrong ? "text-emerald-500" : "text-amber-500")}>
                                        {passwordStrong ? "EXCELLENT" : "WEAK"}
                                     </span>
                                  </div>
                                  <div className="flex gap-1">
                                     {[...Array(5)].map((_, i) => (
                                        <div key={i} className={cn("h-1 flex-1 rounded-full bg-background transition-colors", i < passwordScore && (passwordStrong ? "bg-emerald-500" : "bg-amber-500"))} />
                                     ))}
                                  </div>
                               </div>
                            )}
                         </FormField>
                         <FormField label="Confirm Password" error={errors.confirmPassword}>
                            <Input
                              type="password"
                              className="input-base"
                              placeholder="Re-enter password"
                              value={form.confirmPassword}
                              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                            />
                         </FormField>
                      </motion.div>
                    )}

                    {step === 2 && (
                      <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-10"
                      >
                         <div>
                            <TypographyTechnical className="text-primary font-bold block mb-4">Preferred Course</TypographyTechnical>
                            <div className="relative">
                               <button
                                 onClick={() => setCourseOpen(!courseOpen)}
                                 className="flex w-full items-center justify-between p-5 rounded-2xl bg-muted border border-transparent focus:border-primary/30 transition-all text-left"
                               >
                                  <span className={cn("font-bold", !course && "text-muted-foreground")}>{course || "Select a course of study"}</span>
                                  <ChevronDown className={cn("h-5 w-5 transition-transform", courseOpen && "rotate-180")} />
                               </button>
                               <AnimatePresence>
                                  {courseOpen && (
                                     <motion.div 
                                       initial={{ opacity: 0, y: 10 }}
                                       animate={{ opacity: 1, y: 0 }}
                                       exit={{ opacity: 0, y: 10 }}
                                       className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-black border border-border rounded-2xl shadow-2xl z-50 overflow-hidden"
                                     >
                                        {courses.map((item) => (
                                           <button
                                             key={item}
                                             onClick={() => { setCourse(item); setCourseOpen(false); }}
                                             className="w-full p-4 text-left hover:bg-primary/5 transition-colors flex items-center justify-between group"
                                           >
                                              <span className="font-medium">{item}</span>
                                              {course === item && <Check className="h-4 w-4 text-primary" />}
                                           </button>
                                        ))}
                                     </motion.div>
                                  )}
                               </AnimatePresence>
                            </div>
                            {errors.course && <p className="mt-2 text-xs text-red-500 font-bold">{errors.course}</p>}
                         </div>

                         <div>
                            <TypographyTechnical className="text-primary font-bold block mb-6">Application Type</TypographyTechnical>
                            <div className="grid sm:grid-cols-2 gap-4">
                               {['Fresh admission', 'Transfer candidate', 'Returning applicant'].map((type) => (
                                  <button
                                    key={type}
                                    onClick={() => setApplicationType(type)}
                                    className={cn(
                                       "p-6 rounded-2xl border-2 transition-all text-left group relative overflow-hidden",
                                       applicationType === type 
                                          ? "border-primary bg-primary/5 shadow-xl shadow-primary/5" 
                                          : "border-muted bg-muted/30 hover:border-primary/20"
                                    )}
                                  >
                                     <div className="flex items-center gap-4 relative z-10">
                                        <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center", applicationType === type ? "border-primary bg-primary" : "border-muted-foreground/30")}>
                                           {applicationType === type && <Check className="h-3 w-3 text-muted-foreground" />}
                                        </div>
                                        <span className={cn("font-bold", applicationType === type ? "text-primary" : "text-muted-foreground")}>{type}</span>
                                     </div>
                                     {applicationType === type && (
                                        <motion.div layoutId="type-bg" className="absolute inset-0 bg-primary/5" />
                                     )}
                                  </button>
                               ))}
                            </div>
                         </div>
                      </motion.div>
                    )}

                    {step === 3 && (
                      <motion.div
                        key="step3"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-8"
                      >
                         <div className="grid sm:grid-cols-2 gap-4">
                            <ReviewCard label="Full Name" value={`${form.firstName} ${form.lastName}`} />
                            <ReviewCard label="Email" value={form.email} />
                            <ReviewCard label="Phone" value={form.phone} />
                            <ReviewCard label="Course" value={course} />
                            <ReviewCard label="JAMB Reg" value={form.jambRegNo} className="sm:col-span-2" />
                         </div>
                         <div className="p-6 rounded-3xl bg-secondary/5 border border-secondary/10 flex gap-4">
                            <Info className="h-6 w-6 text-secondary shrink-0" />
                            <div>
                               <p className="font-bold text-secondary text-sm">FINAL VERIFICATION</p>
                               <p className="text-sm text-muted-foreground mt-1">Please ensure all details are correct. You won't be able to edit these until your profile is fully verified.</p>
                            </div>
                         </div>
                      </motion.div>
                    )}
                 </AnimatePresence>

                 <div className="mt-16 flex items-center justify-between gap-6 border-t border-border/50 pt-10">
                    <Button 
                      variant="ghost" 
                      disabled={step === 1} 
                      onClick={goBack}
                      className="rounded-full px-8 h-12 font-bold"
                    >
                       Back
                    </Button>
                    <div className="flex flex-col items-end gap-2">
                       {errors.submit && <p className="text-xs text-red-500 font-bold">{errors.submit}</p>}
                       <Button 
                         onClick={goNext} 
                         disabled={submitting}
                         className="rounded-full px-12 h-14 font-bold shadow-xl shadow-primary/20"
                       >
                          {submitting ? 'PROCESSING...' : step === 3 ? 'COMPLETE PROFILE' : 'CONTINUE'}
                          <ArrowRight className="ml-2 h-4 w-4" />
                       </Button>
                    </div>
                 </div>
              </div>

              {/* Sidebar Info */}
              <div className="lg:col-span-4 space-y-6">
                 <div className="bg-secondary p-10 rounded-[3rem] text-muted-foreground">
                    <TypographyTechnical className="text-primary-foreground/60 font-bold block mb-6">Support</TypographyTechnical>
                    <TypographyH3 className="text-2xl leading-tight">Need assistance with your application?</TypographyH3>
                    <TypographyP className="text-muted-foreground/60 text-sm mt-4">
                       Our admissions office is available Monday - Friday, 9am - 4pm to help you with any issues.
                    </TypographyP>
                    <Separator className="my-8 bg-white/10" />
                    <ul className="space-y-6">
                       <TipItem text="Check your JAMB registration number carefully." />
                       <TipItem text="Use an email you have immediate access to." />
                       <TipItem text="Ensure your names match your official documents." />
                    </ul>
                 </div>

                 <div className="bg-card border border-border/50 p-10 rounded-[3rem] relative overflow-hidden group">
                    <div className="relative z-10">
                       <BadgeCheck className="h-10 w-10 text-primary mb-6" />
                       <TypographyH3 className="text-xl">Fast Track Admission</TypographyH3>
                       <TypographyP className="text-sm text-muted-foreground mt-4 leading-relaxed">
                          Applying early gives you a better chance of securing your preferred course and campus accommodation.
                       </TypographyP>
                    </div>
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                       <School className="h-32 w-32" />
                    </div>
                 </div>
              </div>
           </div>
        </Section>
      </main>
      <Footer />

      <style jsx global>{`
        .input-base {
          @apply w-full h-14 px-6 rounded-2xl bg-muted border-2 border-transparent focus:border-primary/30 focus:bg-background outline-none transition-all font-medium;
        }
      `}</style>
    </div>
  )
}

function FormField({ label, error, children, className }: { label: string, error?: string, children: React.ReactNode, className?: string }) {
  return (
    <div className={cn("space-y-2.5", className)}>
       <label className="text-[10px] font-technical font-bold text-muted-foreground uppercase tracking-widest pl-4">
          {label}
       </label>
       {children}
       {error && <p className="text-[10px] text-red-500 font-bold pl-4">{error.toUpperCase()}</p>}
    </div>
  )
}

function ReviewCard({ label, value, className }: { label: string, value: string, className?: string }) {
  return (
    <div className={cn("p-6 rounded-3xl bg-muted/50 border border-border/30", className)}>
       <TypographyTechnical className="text-[10px] text-muted-foreground font-bold block mb-2">{label}</TypographyTechnical>
       <p className="font-bold text-foreground">{value || "---"}</p>
    </div>
  )
}

function TipItem({ text }: { text: string }) {
  return (
    <li className="flex gap-4">
       <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
          <Check className="h-3 w-3 text-primary-foreground" />
       </div>
       <span className="text-sm text-muted-foreground/70 font-medium leading-tight">{text}</span>
    </li>
  )
}
