import Link from 'next/link'
import { Navbar } from '@/components/public/navbar'
import { Footer } from '@/components/public/footer'
import { ROUTES, SCHOOL_INFO } from '@/lib/constants'
import { Award, Users, ShieldCheck, Target, Sparkles } from 'lucide-react'

export const metadata = {
  title: `About | ${SCHOOL_INFO.name}`,
  description: 'Mission, vision, values, and the learning environment at the college.',
}

const values = [
  { icon: Target, title: 'Purpose', text: 'We train for real healthcare service, not just classroom theory.' },
  { icon: Award, title: 'Excellence', text: 'Quality teaching, practical standards, and continuous improvement.' },
  { icon: ShieldCheck, title: 'Integrity', text: 'Transparent, secure, and accountable academic workflows.' },
  { icon: Users, title: 'Community', text: 'A college culture that supports learners, lecturers, and staff.' },
]

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="bg-background">
        <section className="border-b border-border bg-[linear-gradient(180deg,hsl(var(--primary)/0.08),hsl(var(--background)))]">
          <div className="mx-auto w-full max-w-none px-4 py-16 sm:px-6 md:px-8 lg:px-12 xl:px-16">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">About the college</p>
            <h1 className="mt-4 text-4xl font-extrabold md:text-6xl">Built around health education, discipline, and practical readiness</h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-foreground/70 md:text-lg">
              {SCHOOL_INFO.fullname} exists to prepare students for meaningful service in health-related professions through focused academic and
              practical training.
            </p>
            <Link href={ROUTES.admissions} className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground">
              Apply for Admission <Sparkles className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <section className="mx-auto w-full max-w-none px-4 py-16 sm:px-6 md:px-8 lg:px-12 xl:px-16">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-[2rem] border border-border bg-card p-8">
              <h2 className="text-3xl font-bold">Mission</h2>
              <p className="mt-4 text-sm leading-8 text-foreground/70">
                To deliver quality, accessible, and professionally relevant health technology education that shapes competent graduates and
                supports ethical service in society.
              </p>
            </div>
            <div className="rounded-[2rem] border border-border bg-card p-8">
              <h2 className="text-3xl font-bold">Vision</h2>
              <p className="mt-4 text-sm leading-8 text-foreground/70">
                To become a leading private tertiary institution in Nigeria for modern health training, digital administration, and student-centered innovation.
              </p>
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-card/50">
          <div className="mx-auto w-full max-w-none px-4 py-16 sm:px-6 md:px-8 lg:px-12 xl:px-16">
            <h2 className="text-3xl font-bold">Core values</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {values.map((item) => {
                const Icon = item.icon
                return (
                  <article key={item.title} className="rounded-3xl border border-border bg-background p-6">
                    <Icon className="h-6 w-6 text-primary" />
                    <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-foreground/70">{item.text}</p>
                  </article>
                )
              })}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
