import { Navbar } from '@/components/public/navbar'
import { Footer } from '@/components/public/footer'
import { SCHOOL_INFO } from '@/lib/constants'

export const metadata = {
  title: `Terms of Service - ${SCHOOL_INFO.name}`,
  description: 'Terms governing use of Covenant College of Health Technology online services.',
}

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="animated-bg-surface py-16 md:py-20">
        <section className="mx-auto w-full max-w-none px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-10">
            <h1 className="text-3xl font-bold md:text-4xl">Terms of Service</h1>
            <p className="mt-3 text-sm text-foreground/70">Last updated: May 29, 2026</p>

            <div className="mt-8 space-y-6 text-sm leading-relaxed text-foreground/80 md:text-base">
              <section>
                <h2 className="text-xl font-semibold">Use of Platform</h2>
                <p>
                  This platform is intended for official school communication, academic workflows, admissions, and approved payments.
                  Unauthorized use is prohibited.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold">Account Responsibility</h2>
                <p>
                  Users must maintain accurate information and protect login credentials. Actions performed under an account are considered
                  the responsibility of that account holder.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold">Academic and Payment Records</h2>
                <p>
                  Result publication, grading, and payment processing follow institutional policies. Disputes should be raised through the
                  official administrative channels.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold">Contact</h2>
                <p>
                  For legal or platform usage inquiries, contact {SCHOOL_INFO.email}.
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
