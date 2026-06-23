import Image from 'next/image'
import Link from 'next/link'
import { Navbar } from '@/components/public/navbar'
import { Footer } from '@/components/public/footer'
import { ROUTES, SCHOOL_INFO } from '@/lib/constants'
import { ArrowRight, BookOpen, CheckCircle2, GraduationCap, MailCheck, School, Stethoscope, Users } from 'lucide-react'

export const metadata = {
  title: `Admissions | ${SCHOOL_INFO.name}`,
  description: 'Admissions information and application entry point for prospective students.',
}

const processSteps = [
  'Check the course of study that best fits your goals.',
  'Create your application using your personal and JAMB details.',
  'Upload your documents and complete the remaining forms.',
  'Track your application and await further communication from the school.',
]

const courses = [
  'Medical Laboratory Technology',
  'Community Health',
  'Public Health',
  'Pharmacy Technician',
]

const requirements = [
  'JAMB registration number and result',
  'Passport photograph and signature',
  'Birth certificate or declaration of age',
  'Primary and secondary school certificates',
  'Indigene certificate and NIN',
]

const benefits = [
  { icon: School, title: 'Clear admission process', text: 'A simple route from interest to application and review.' },
  { icon: Users, title: 'Helpful guidance', text: 'Support for first-time applicants and returning candidates.' },
  { icon: GraduationCap, title: 'Programs that fit', text: 'Choose the course that matches your background and interest.' },
  { icon: MailCheck, title: 'Timely updates', text: 'Applicants can follow progress and next steps easily.' },
]

export default function AdmissionsPage() {
  return (
    <>
      <Navbar />
      <main className="bg-background text-foreground">
        <section className="relative overflow-hidden border-b border-border bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.14),transparent_24%),radial-gradient(circle_at_80%_20%,hsl(var(--secondary)/0.10),transparent_20%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--card)))]">
          <div className="mx-auto grid w-full max-w-none gap-10 px-4 py-16 sm:px-6 md:px-8 lg:grid-cols-[1.02fr_0.98fr] lg:px-12 xl:px-16 lg:py-24">
            <div className="max-w-2xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                <Stethoscope className="h-3.5 w-3.5" />
                Admissions
              </p>
              <h1 className="mt-5 text-balance text-4xl font-extrabold leading-tight md:text-6xl">
                Begin your journey at Covenant College of Health Technology
              </h1>
              <p className="mt-4 max-w-xl text-base leading-8 text-foreground/75 md:text-lg">
                If you are seeking admission into CCHT, this is the right place to start. Choose your course, complete your application, and
                follow the simple steps to finish your registration.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/admissions/apply" className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90">
                  Start your application <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href={ROUTES.programs} className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold transition hover:border-primary/40 hover:text-primary">
                  View courses
                </Link>
              </div>
            </div>

            <div className="rounded-[2rem] border border-border bg-card p-3 shadow-xl">
              <div className="relative min-h-[380px] overflow-hidden rounded-[1.5rem]">
                <Image
                  src="/images/hero-bg1.jpg"
                  alt="Students at Covenant College of Health Technology"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 text-muted-foreground">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground/75">Student admission</p>
                  <h2 className="mt-2 text-2xl font-bold">Simple, guided, and welcoming</h2>
                  <p className="mt-2 max-w-lg text-sm leading-7 text-muted-foreground/80">
                    Find your course, prepare your documents, and complete the admission form in a few easy steps.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-none px-4 py-16 sm:px-6 md:px-8 lg:px-12 xl:px-16">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {benefits.map((item) => {
              const Icon = item.icon
              return (
                <article key={item.title} className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                  <Icon className="h-6 w-6 text-primary" />
                  <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-foreground/70">{item.text}</p>
                </article>
              )
            })}
          </div>
        </section>

        <section className="border-y border-border bg-card/50">
          <div className="mx-auto grid w-full max-w-none gap-8 px-4 py-16 sm:px-6 md:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-12 xl:px-16">
            <div className="rounded-[2rem] border border-border bg-background p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">How to apply</p>
              <h2 className="mt-3 text-3xl font-bold md:text-4xl">Follow these steps</h2>
              <div className="mt-6 space-y-4">
                {processSteps.map((item, index) => (
                  <div key={item} className="flex gap-4 rounded-2xl border border-border bg-card p-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
                      {index + 1}
                    </div>
                    <p className="text-sm leading-7 text-foreground/75">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-[2rem] border border-border bg-card p-8">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Available courses</p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {courses.map((course) => (
                    <div key={course} className="rounded-2xl border border-border bg-background p-4 text-sm font-medium">
                      <BookOpen className="mb-2 h-4 w-4 text-primary" />
                      {course}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[2rem] border border-border bg-gradient-to-br from-primary/10 to-secondary/10 p-8">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Documents to prepare</p>
                <div className="mt-5 space-y-3">
                  {requirements.map((item) => (
                    <div key={item} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-none px-4 py-16 sm:px-6 md:px-8 lg:px-12 xl:px-16">
          <div className="flex flex-col gap-4 rounded-[2rem] border border-border bg-card p-8 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Start here</p>
              <h2 className="mt-2 text-3xl font-bold">Ready to begin your admission?</h2>
              <p className="mt-2 text-sm leading-7 text-foreground/70">
                Create your application and continue to the next step whenever you are ready.
              </p>
            </div>
            <Link href="/admissions/apply" className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground">
              Start application <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
