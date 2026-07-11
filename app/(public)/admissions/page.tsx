import Image from 'next/image'
import Link from 'next/link'
import { Navbar } from '@/components/public/navbar'
import { Footer } from '@/components/public/footer'
import { ROUTES, SCHOOL_INFO } from '@/lib/constants'
import { ArrowRight, BadgeCheck, CheckCircle2, GraduationCap, ShieldCheck, Sparkles, Users } from 'lucide-react'

export const metadata = {
  title: `Admissions | ${SCHOOL_INFO.name}`,
  description: 'Admissions information and application entry point for prospective students.',
}

const steps = [
  { title: 'Create your account', text: 'Register with your basic details and confirm your email.' },
  { title: 'Pay application fee', text: 'Pay the non-refundable ₦6,500 application fee to unlock the form.' },
  { title: 'Complete your profile', text: 'Fill in personal, academic, and guarantor details, then upload documents.' },
  { title: 'Take the entrance exam', text: 'Sit for the secure online entrance exam with anti-malpractice protection.' },
  { title: 'Pay admission charges', text: 'If admitted, pay the ₦30,000 admission and administrative charges to accept the offer.' },
  { title: 'Pay tuition and resume', text: 'Pay at least 50% tuition for the session, then prepare for resumption and lectures.' },
]

const documents = [
  "Application form",
  'Acceptance and provisional admission letter',
  "O'level result",
  'Birth certificate',
  'State of origin certificate',
  'National Identification Slip',
  'Medical fitness report/certificate',
  'Passport photograph',
]

const highlights = [
  { icon: ShieldCheck, title: 'Admission flow', text: 'Built for direct admission with or without JAMB' },
  { icon: BadgeCheck, title: 'Payment milestones', text: 'Fees map cleanly to application, admission, and tuition checkpoints.' },
  { icon: GraduationCap, title: 'Student handoff', text: 'Accepted applicants move into the student portal with a matric number.' },
  { icon: Users, title: 'Clear guidance', text: 'Applicants always know what comes next and which documents are still missing.' },
]

export default function AdmissionsPage() {
  return (
    <>
      <Navbar />
      <main className="bg-background text-foreground">
        <section className="border-b border-border bg-[radial-gradient(circle_at_15%_20%,hsl(var(--primary)/0.12),transparent_26%),radial-gradient(circle_at_82%_18%,hsl(var(--secondary)/0.12),transparent_22%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--accent-soft)))]">
          <div className="mx-auto grid w-full max-w-none gap-12 px-4 py-16 sm:px-6 md:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-12 xl:px-16 lg:py-24">
            <div className="max-w-2xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white dark:bg-gray-800 px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-primary shadow-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Admissions
              </p>
              <h1 className="mt-5 text-balance text-4xl font-extrabold leading-tight md:text-6xl">
                A simple, guided process from application to matriculation
              </h1>
              <p className="mt-5 max-w-xl text-base leading-8 text-foreground/75 md:text-lg">
                The admissions process is fully ready to help foster an enhance experience for prospective students. From application to matriculation, every step is mapped to the school process, including payment checkpoints, document uploads, entrance exams, and student activation after acceptance.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/admissions/apply" className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90">
                  Start application <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href={ROUTES.programs} className="inline-flex items-center gap-2 rounded-full border border-border bg-white dark:bg-gray-800 px-6 py-3 text-sm font-semibold transition hover:border-primary/30 hover:text-primary">
                  View programs
                </Link>
              </div>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-border bg-white/90 dark:bg-gray-800 p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Application fee</p>
                  <p className="mt-2 text-2xl font-bold">₦6,500</p>
                </div>
                <div className="rounded-2xl border border-border bg-white/90 dark:bg-gray-800 p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Admission charge</p>
                  <p className="mt-2 text-2xl font-bold">₦30,000</p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-border bg-white p-3 shadow-xl">
              <div className="relative rounded-[1.5rem]">
                <Image
                  src="/images/hero-bg1.jpg"
                  alt="Students at Covenant College of Health Technology"
                  width={800}
                  height={600}
                  className="aspect-[4/3] w-full rounded-[1.5rem] object-cover"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-900/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/75">Admission preview</p>
                  <h2 className="mt-2 text-2xl font-bold">From application to matric number</h2>
                  <p className="mt-2 max-w-lg text-sm leading-7 text-white/80">
                    Every step is mapped to the school process, including payment checkpoints, document uploads, entrance exams, and student migration after acceptance.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-none px-4 py-16 sm:px-6 md:px-8 lg:px-12 xl:px-16">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {highlights.map((item) => {
              const Icon = item.icon
              return (
                <article key={item.title} className="rounded-3xl border border-border bg-white dark:bg-gray-800 p-6 shadow-sm">
                  <Icon className="h-6 w-6 text-primary" />
                  <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-foreground/70">{item.text}</p>
                </article>
              )
            })}
          </div>
        </section>

        <section className="border-y border-border bg-white/60 dark:bg-gray-800">
          <div className="mx-auto grid w-full max-w-none gap-8 px-4 py-16 sm:px-6 md:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-12 xl:px-16">
            <div className="rounded-[2rem] border border-border bg-white dark:bg-gray-800 p-8 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Process</p>
              <h2 className="mt-3 text-3xl font-bold md:text-4xl">Admission steps</h2>
              <div className="mt-6 space-y-4">
                {steps.map((item, index) => (
                  <div key={item.title} className="flex gap-4 rounded-2xl border border-border bg-blue-800/20 p-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold">{item.title}</p>
                      <p className="mt-1 text-sm leading-7 text-foreground/70">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[2rem] border border-border bg-white dark:bg-gray-800 p-8 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Required documents</p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {documents.map((item) => (
                    <div key={item} className="flex items-center gap-3 rounded-2xl border border-border bg-slate-50 dark:bg-gray-700 p-4 text-sm font-medium">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[2rem] border border-primary/15 bg-gradient-to-br from-primary/10 to-white dark:to-gray-800 p-8 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Student handoff</p>
                <div className="mt-5 space-y-3 text-sm leading-7 text-foreground/75">
                  <p>The acceptance step assigns a matric number and opens the student portal.</p>
                  <p>Accepted students can later access admission letters, course forms, fees, results, and ongoing announcements.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-none px-4 py-16 sm:px-6 md:px-8 lg:px-12 xl:px-16">
          <div className="flex flex-col gap-4 rounded-[2rem] border border-border bg-white dark:bg-gray-800 p-8 shadow-sm md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Ready?</p>
              <h2 className="mt-2 text-3xl font-bold">Let’s start the admission process</h2>
              <p className="mt-2 text-sm leading-7 text-foreground/70">
                The application flow is now aligned to your fee checkpoints, entrance exam, and student migration path.
              </p>
            </div>
            <Link href="/admissions/apply" className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground border border-primary shadow-sm transition hover:opacity-90">
              Begin application <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
