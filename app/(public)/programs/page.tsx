import Link from 'next/link'
import { Navbar } from '@/components/public/navbar'
import { Footer } from '@/components/public/footer'
import { ProgramService } from '@/lib/services/program.service'
import { ROUTES, SCHOOL_INFO } from '@/lib/constants'
import { BookOpen, Clock3, DollarSign, ArrowRight } from 'lucide-react'

export const metadata = {
  title: `Programs | ${SCHOOL_INFO.name}`,
  description: 'Available academic programs and their key details.',
}

export default async function ProgramsPage() {
  const programs = await ProgramService.getAllPrograms()

  return (
    <>
      <Navbar />
      <main className="bg-background">
        <section className="border-b border-border bg-[linear-gradient(180deg,hsl(var(--secondary)/0.08),hsl(var(--background)))]">
          <div className="mx-auto w-full max-w-none px-4 py-16 sm:px-6 md:px-8 lg:px-12 xl:px-16">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Programs</p>
            <h1 className="mt-4 text-4xl font-extrabold md:text-6xl">Programs built for healthcare practice and professional growth</h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-foreground/70 md:text-lg">
              Explore the school’s academic offerings and start the admissions journey from the same modern, consistent experience.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={ROUTES.admissions} className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground">
                Start Admission <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href={ROUTES.login} className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold transition hover:border-primary/40 hover:text-primary">
                Portal Login
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-none px-4 py-16 sm:px-6 md:px-8 lg:px-12 xl:px-16">
          {programs.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {programs.map((program) => (
                <Link key={program.id} href={`${ROUTES.programs}/${program.slug}`} className="group rounded-3xl border border-border bg-card p-6 transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
                  <div className="inline-flex rounded-2xl bg-primary/10 p-3 text-primary">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-2xl font-bold group-hover:text-primary">{program.title}</h3>
                  <p className="mt-2 text-sm font-semibold uppercase tracking-[0.18em] text-foreground/55">{program.level}</p>
                  <p className="mt-4 line-clamp-4 text-sm leading-7 text-foreground/70">{program.description}</p>
                  <div className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-4 text-sm">
                    <div>
                      <p className="flex items-center gap-2 text-foreground/55"><Clock3 className="h-4 w-4" /> Duration</p>
                      <p className="mt-1 font-semibold">{program.duration_months} {program.duration_unit}</p>
                    </div>
                    <div>
                      <p className="flex items-center gap-2 text-foreground/55"><DollarSign className="h-4 w-4" /> Tuition</p>
                      <p className="mt-1 font-semibold">₦{program.tuition_fee.toLocaleString()}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center text-foreground/65">
              Program details will be published soon.
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  )
}
