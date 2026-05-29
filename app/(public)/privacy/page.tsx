import { Navbar } from '@/components/public/navbar'
import { Footer } from '@/components/public/footer'
import { SCHOOL_INFO } from '@/lib/constants'

export const metadata = {
  title: `Privacy Policy - ${SCHOOL_INFO.name}`,
  description: 'Privacy policy for Covenant College of Health Technology digital services.',
}

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="animated-bg-surface py-16 md:py-20">
        <section className="mx-auto w-full max-w-none px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-10">
            <h1 className="text-3xl font-bold md:text-4xl">Privacy Policy</h1>
            <p className="mt-3 text-sm text-foreground/70">Last updated: May 29, 2026</p>

            <div className="mt-8 space-y-6 text-sm leading-relaxed text-foreground/80 md:text-base">
              <section>
                <h2 className="text-xl font-semibold">Information We Collect</h2>
                <p>
                  We collect data required for admissions, academic administration, student support, and secure platform access, including
                  profile information, academic records, and payment records.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold">How We Use Data</h2>
                <p>
                  Your information is used strictly for identity verification, academic processing, communication, invoicing, and service
                  delivery. We do not sell personal information.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold">Security</h2>
                <p>
                  Access is controlled with role-based permissions and audit logging. Sensitive operations and records are protected through
                  authenticated workflows and security policies.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold">Contact</h2>
                <p>
                  For privacy requests or questions, contact {SCHOOL_INFO.email}.
                </p>
              </section>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
