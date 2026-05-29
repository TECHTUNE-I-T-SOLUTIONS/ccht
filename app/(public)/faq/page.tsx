import Link from 'next/link'
import { Navbar } from '@/components/public/navbar'
import { Footer } from '@/components/public/footer'
import { ROUTES, SCHOOL_INFO } from '@/lib/constants'
import { ChevronRight, HelpCircle } from 'lucide-react'

export const metadata = {
  title: `FAQs - ${SCHOOL_INFO.name}`,
  description: 'Answers to common questions about admission, academics, fees, and student life at CCHT.',
}

const faqGroups = [
  {
    title: 'Admissions',
    items: [
      {
        q: 'How do I apply for admission?',
        a: 'Create an account from the admissions page, complete your profile, upload required documents, and submit your application for review.',
      },
      {
        q: 'What documents are required?',
        a: 'Typically, you need O-Level results, a valid means of identification, passport photographs, and any program-specific requirements.',
      },
      {
        q: 'Can I apply for more than one program?',
        a: 'Yes. You may indicate alternate program options during application so admissions can guide you to the best fit.',
      },
    ],
  },
  {
    title: 'Academics',
    items: [
      {
        q: 'Do you run semesters or terms?',
        a: 'CCHT operates an academic session with semesters, in line with tertiary institution structure.',
      },
      {
        q: 'How are assessments and results handled?',
        a: 'Continuous assessments and examinations are entered by lecturers and published according to approved academic procedures.',
      },
      {
        q: 'Is there practical and clinical exposure?',
        a: 'Yes. Programs include practical laboratory training and supervised clinical exposure to build real-world competence.',
      },
    ],
  },
  {
    title: 'Fees and Payments',
    items: [
      {
        q: 'Can I pay fees in installments?',
        a: 'Approved payment structures and installment options are communicated by the bursary unit based on program policies.',
      },
      {
        q: 'How do I confirm my payment?',
        a: 'Once payment is successful, your portal record is updated and a receipt/reference is available in your payment history.',
      },
      {
        q: 'Who should I contact for billing issues?',
        a: 'Use the contact page or visit the portal support channel so the admin and bursary teams can assist quickly.',
      },
    ],
  },
  {
    title: 'Portal and Support',
    items: [
      {
        q: 'Who can access the portal?',
        a: 'Students, lecturers, and administrators each have role-based access to their own dashboard and features.',
      },
      {
        q: 'I forgot my password. What should I do?',
        a: 'Use the password reset option on the login page. A secure reset link will be sent to your registered email.',
      },
      {
        q: 'How can I get help quickly?',
        a: 'Reach out through the contact page or admissions desk. Include your full name, email, and issue summary for faster support.',
      },
    ],
  },
]

export default function FaqPage() {
  return (
    <>
      <Navbar />
      <main className="bg-background text-foreground">
        <section className="animated-bg-surface relative overflow-hidden border-b border-border/60 py-16 md:py-24">
          <div className="floating-orb pointer-events-none absolute -left-12 top-12 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
          <div className="floating-orb-delay pointer-events-none absolute right-0 top-20 h-56 w-56 rounded-full bg-secondary/20 blur-3xl" />
          <div className="relative mx-auto w-full max-w-none px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
              <HelpCircle className="h-3.5 w-3.5" />
              Frequently Asked Questions
            </p>
            <h1 className="text-balance text-4xl font-extrabold leading-tight md:text-5xl">
              Get clear answers before you apply or resume your semester
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-relaxed text-foreground/75 md:text-lg">
              This page covers common questions from prospective students, current students, lecturers, and guardians.
              If your question is not listed, contact our support or admissions team.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={ROUTES.contact}
                className="inline-flex items-center gap-2 rounded-lg bg-[hsl(var(--primary))] px-5 py-3 text-sm font-semibold text-[hsl(var(--primary-foreground))] transition hover:opacity-90"
              >
                Contact Support <ChevronRight className="h-4 w-4" />
              </Link>
              <Link
                href={ROUTES.register}
                className="inline-flex items-center rounded-lg border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground transition hover:border-primary/40 hover:text-primary"
              >
                Start Admission
              </Link>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="mx-auto w-full max-w-none px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
            <div className="grid gap-8 lg:grid-cols-2">
              {faqGroups.map((group) => (
                <article key={group.title} className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm">
                  <h2 className="text-2xl font-bold">{group.title}</h2>
                  <div className="mt-6 space-y-4">
                    {group.items.map((item) => (
                      <details key={item.q} className="group rounded-xl border border-border bg-background px-4 py-3">
                        <summary className="cursor-pointer list-none pr-8 text-sm font-semibold leading-relaxed text-foreground group-open:text-primary md:text-base">
                          {item.q}
                        </summary>
                        <p className="mt-3 text-sm leading-relaxed text-foreground/70 md:text-base">{item.a}</p>
                      </details>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
