import { Navbar } from '@/components/public/navbar'
import { Footer } from '@/components/public/footer'
import { ProgramService } from '@/lib/services/program.service'
import { ROUTES } from '@/lib/constants'
import Link from 'next/link'
import { BookOpen, Clock, DollarSign, Users, ArrowRight } from 'lucide-react'

export const metadata = { title: 'Programs - Covenant College of Health Technology' }

export default async function ProgramsPage() {
  const programs = await ProgramService.getAllPrograms()

  return (
    <>
      <Navbar />
      <main>
        <section className="animated-bg-surface relative overflow-hidden py-16 md:py-20">
          <div className="mx-auto w-full max-w-none px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Our Programs</h1>
            <p className="text-lg text-foreground/70 max-w-2xl">
              Comprehensive health and technology programs designed to prepare you for a successful healthcare career
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href={ROUTES.register}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
              >
                Start Admission <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={ROUTES.login}
                className="inline-flex items-center rounded-lg border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground transition hover:border-primary/40 hover:text-primary"
              >
                Enter Student Portal
              </Link>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-20">
          <div className="mx-auto w-full max-w-none px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
            {programs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {programs.map((program) => (
                  <Link key={program.id} href={`${ROUTES.programs}/${program.slug}`}>
                    <div className="h-full bg-card border border-border rounded-lg overflow-hidden hover:shadow-xl hover:border-primary transition-all cursor-pointer group">
                      <div className="p-6">
                        <div className="flex items-start gap-4 mb-4">
                          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                            <BookOpen className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold">{program.title}</h3>
                            <p className="text-sm text-primary font-semibold">{program.level}</p>
                          </div>
                        </div>
                        
                        <p className="text-foreground/70 mb-6 line-clamp-3">{program.description}</p>

                        <div className="grid grid-cols-2 gap-4 mb-6 py-4 border-t border-b border-border">
                          <div>
                            <p className="text-xs text-foreground/60 mb-1 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Duration
                            </p>
                            <p className="font-semibold">{program.duration_months} {program.duration_unit}</p>
                          </div>
                          <div>
                            <p className="text-xs text-foreground/60 mb-1 flex items-center gap-1">
                              <DollarSign className="w-3 h-3" /> Tuition
                            </p>
                            <p className="font-semibold">₦{program.tuition_fee.toLocaleString()}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-primary font-semibold text-sm flex items-center gap-1">
                            Learn More <ArrowRight className="w-4 h-4" />
                          </span>
                          {program.max_students && (
                            <span className="text-xs text-foreground/60 flex items-center gap-1">
                              <Users className="w-3 h-3" /> Max {program.max_students}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-foreground/60 text-lg">Programs will be available soon</p>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
