import Image from 'next/image'
import { Navbar } from '@/components/public/navbar'
import { Footer } from '@/components/public/footer'
import { ProgramService } from '@/lib/services/program.service'
import { BlogService } from '@/lib/services/blog.service'
import { EventService } from '@/lib/services/event.service'
import Link from 'next/link'
import { ROUTES, SCHOOL_INFO } from '@/lib/constants'
import { ArrowRight, BookOpen, Users, Award, Calendar, FileText, HeartPulse, Stethoscope, Microscope, Brain, ClipboardCheck, GraduationCap, ShieldCheck } from 'lucide-react'

async function getHomeData() {
  try {
    const [programs, blogPosts, events] = await Promise.all([
      ProgramService.getAllPrograms(6),
      BlogService.getAllBlogPosts(3),
      EventService.getUpcomingEvents(4),
    ])

    return { programs, blogPosts, events }
  } catch (error) {
    console.error('[ccht] Error fetching home data:', error)
    return { programs: [], blogPosts: [], events: [] }
  }
}

export const metadata = {
  title: `${SCHOOL_INFO.name} - Quality Education for Health`,
  description: SCHOOL_INFO.tagline,
}

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const { programs, blogPosts, events } = await getHomeData()

  const stats = [
    { label: 'Active Students', value: '500+', icon: Users },
    { label: 'Specialized Programs', value: '8+', icon: BookOpen },
    { label: 'Clinical Instructors', value: '50+', icon: Award },
    { label: 'Graduate Success', value: '95%', icon: HeartPulse },
  ]

  const pillars = [
    {
      icon: Stethoscope,
      title: 'Competency-Based Learning',
      description:
        'Every course is structured around practical competencies demanded in hospitals, clinics, and modern laboratories.',
    },
    {
      icon: Microscope,
      title: 'Hands-On Clinical Exposure',
      description:
        'Students gain guided practical sessions and supervised experience that build confidence before professional deployment.',
    },
    {
      icon: Calendar,
      title: 'Career-Ready Progression',
      description:
        'From admission to graduation, our pathway integrates mentoring, ethics, and employability preparation.',
    },
  ]

  const competencies = [
    {
      icon: Brain,
      title: 'Clinical Reasoning',
      description: 'Students learn how to observe, assess, communicate, and document in a healthcare setting with clarity and confidence.',
    },
    {
      icon: ClipboardCheck,
      title: 'Laboratory Practice',
      description: 'Practical lab sessions help learners master procedures, equipment handling, safety routines, and accurate reporting.',
    },
    {
      icon: ShieldCheck,
      title: 'Ethics and Professional Conduct',
      description: 'Training emphasizes confidentiality, discipline, empathy, teamwork, and respectful patient-centered service.',
    },
    {
      icon: GraduationCap,
      title: 'Career Positioning',
      description: 'Graduates are prepared for internships, hospital service, community health work, further study, and specialization.',
    },
  ]

  return (
    <>
      <Navbar />
      <main className="bg-background text-foreground">
        <section className="animated-bg-surface relative overflow-hidden border-b border-border/60 py-20 md:py-28">
          <div className="floating-orb pointer-events-none absolute -left-16 top-12 h-56 w-56 rounded-full bg-primary/20 blur-3xl" />
          <div className="floating-orb-delay pointer-events-none absolute -right-20 bottom-8 h-64 w-64 rounded-full bg-secondary/20 blur-3xl" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,transparent_0,transparent_95%,hsl(var(--border)/0.5)_100%)]" />
          <div className="relative mx-auto w-full max-w-none px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div>
                <p className="mb-4 inline-flex rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                  Trusted Health Education Institution
                </p>
                <h1 className="text-balance text-4xl font-extrabold leading-tight md:text-6xl">
                  Build a Future in Healthcare Through Structured, Practical, and Ethical Training
                </h1>
                <p className="mt-6 max-w-2xl text-base leading-relaxed text-foreground/75 md:text-lg">
                  {SCHOOL_INFO.name} delivers high-quality health technology programs designed for real-world care environments.
                  Students are trained to understand patient care, laboratory systems, community health, academic discipline, and the
                  standards required for responsible practice in modern healthcare settings.
                </p>
                <p className="mt-4 max-w-2xl text-sm leading-relaxed text-foreground/65 md:text-base">
                  Our learning model blends lecture-based teaching, practical demonstrations, supervised laboratory work, clinical exposure,
                  mentoring, and career guidance so learners are positioned for service, competence, and lifelong professional growth.
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Link
                    href={ROUTES.programs}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
                  >
                    Explore Programs <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href={ROUTES.contact}
                    className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition hover:border-primary/40 hover:text-primary"
                  >
                    Talk to Admissions
                  </Link>
                  <Link
                    href={ROUTES.login}
                    className="inline-flex items-center justify-center rounded-lg border border-primary/40 bg-primary/10 px-6 py-3 text-sm font-semibold text-primary transition hover:bg-primary/20"
                  >
                    Enter Portal
                  </Link>
                </div>
              </div>

              <div className="space-y-4">
                <div className="relative overflow-hidden rounded-[2rem] border border-border bg-card shadow-2xl shadow-black/10">
                  {/* <div
                    className="h-[320px] w-full bg-cover bg-center transition duration-700 hover:scale-105"
                    style={{ backgroundImage: "url('/images/hero-bg1.jpg')" }}
                    aria-label="Covenant College of Health Technology learning environment"
                    role="img"
                  /> */}
                  <Image
                    src="/images/hero-bg1.jpg"
                    alt="Covenant College of Health Technology learning environment"
                    width={600}
                    height={400}
                    priority
                    className="h-[320px] w-full object-cover transition duration-700 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/80">Campus Snapshot</p>
                    <h2 className="mt-2 text-2xl font-bold">A learning environment designed for discipline and care</h2>
                    <p className="mt-2 max-w-lg text-sm text-white/85">
                      Practical training spaces, academic focus, and a professional culture help students move from classroom learning to
                      competent service delivery.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {stats.map((stat) => {
                    const Icon = stat.icon
                    return (
                      <article key={stat.label} className="rounded-2xl border border-border bg-card/90 p-5 shadow-sm backdrop-blur">
                        <Icon className="mb-3 h-6 w-6 text-primary" />
                        <p className="text-3xl font-bold">{stat.value}</p>
                        <p className="mt-1 text-sm text-foreground/65">{stat.label}</p>
                      </article>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 md:py-24">
          <div className="mx-auto w-full max-w-none px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
            <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
              <div>
                <h2 className="text-3xl font-bold md:text-4xl">What students learn at CCHT</h2>
                <p className="mt-3 max-w-3xl text-foreground/70">
                  Our college combines theory, practical demonstrations, and guided experience to prepare students for real healthcare
                  responsibilities and future specialization.
                </p>
                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  {competencies.map((item) => {
                    const Icon = item.icon
                    return (
                      <article key={item.title} className="rounded-xl border border-border bg-card p-5 transition hover:border-primary/40 hover:shadow-md">
                        <Icon className="h-6 w-6 text-primary" />
                        <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                        <p className="mt-2 text-sm leading-relaxed text-foreground/70">{item.description}</p>
                      </article>
                    )
                  })}
                </div>
              </div>

              <div className="rounded-[2rem] border border-border bg-card p-8 shadow-xl">
                <h3 className="text-2xl font-bold">Professional positioning</h3>
                <p className="mt-3 text-sm leading-relaxed text-foreground/70 md:text-base">
                  The school prepares learners for the workforce with the habits, technical confidence, and service mindset expected in
                  health institutions.
                </p>
                <div className="mt-6 grid gap-4">
                  {[
                    'Students learn to think critically and act responsibly in healthcare environments.',
                    'Training supports academic excellence, discipline, and strong interpersonal communication.',
                    'Learners are guided toward internships, community service, and long-term career growth.',
                    'The curriculum encourages respect for patients, colleagues, and professional standards.',
                  ].map((item) => (
                    <div key={item} className="rounded-xl border border-border/70 bg-background p-4 text-sm leading-relaxed text-foreground/75">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 md:py-24">
          <div className="mx-auto w-full max-w-none px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold md:text-4xl">Featured Programs</h2>
                <p className="mt-2 max-w-3xl text-foreground/70">
                  Professionally curated programs that combine foundational science, healthcare ethics, and applied practical training.
                </p>
              </div>
              <Link href={ROUTES.programs} className="text-sm font-semibold text-primary hover:opacity-80">
                View All Programs
              </Link>
            </div>

            {programs.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {programs.map((program) => (
                  <Link
                    key={program.id}
                    href={`${ROUTES.programs}/${program.slug}`}
                    className="group rounded-xl border border-border bg-card p-6 transition hover:border-primary/40 hover:shadow-md"
                  >
                    <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <h3 className="text-xl font-bold group-hover:text-primary">{program.title}</h3>
                    <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-foreground/55">{program.level}</p>
                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-foreground/70">{program.description}</p>
                    <div className="mt-5 flex items-center justify-between text-sm">
                      <span className="font-semibold text-primary">N{program.tuition_fee.toLocaleString()}</span>
                      <span className="text-foreground/60">{program.duration_months} {program.duration_unit}</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-foreground/65">
                Programs will be published shortly.
              </div>
            )}
          </div>
        </section>

        <section className="border-y border-border bg-card/50 py-20 md:py-24">
          <div className="mx-auto w-full max-w-none px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
            <h2 className="text-3xl font-bold md:text-4xl">Why Choose CCHT</h2>
            <p className="mt-2 max-w-3xl text-foreground/70">
              Our model is education-first, student-centered, and practice-oriented for healthcare impact.
            </p>
            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
              {pillars.map((pillar) => {
                const Icon = pillar.icon
                return (
                  <article key={pillar.title} className="rounded-xl border border-border bg-background p-6">
                    <Icon className="h-7 w-7 text-primary" />
                    <h3 className="mt-4 text-lg font-bold">{pillar.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-foreground/70">{pillar.description}</p>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        <section className="py-20 md:py-24">
          <div className="mx-auto w-full max-w-none px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
            <div className="grid gap-8 lg:grid-cols-2">
              <div className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
                <h2 className="text-3xl font-bold md:text-4xl">Academic and practical outcomes</h2>
                <ul className="mt-6 space-y-4 text-sm leading-relaxed text-foreground/75 md:text-base">
                  <li className="flex gap-3"><span className="mt-1 h-2.5 w-2.5 rounded-full bg-primary" />Competence in healthcare communication, documentation, and teamwork.</li>
                  <li className="flex gap-3"><span className="mt-1 h-2.5 w-2.5 rounded-full bg-primary" />Practical exposure to foundational health science and applied laboratory routines.</li>
                  <li className="flex gap-3"><span className="mt-1 h-2.5 w-2.5 rounded-full bg-primary" />Preparation for certification, internship, and employment pathways.</li>
                  <li className="flex gap-3"><span className="mt-1 h-2.5 w-2.5 rounded-full bg-primary" />A strong base for higher education and specialized health programs.</li>
                </ul>
              </div>

              <div className="rounded-[2rem] border border-border bg-gradient-to-br from-primary/10 to-secondary/10 p-8 shadow-sm">
                <h2 className="text-3xl font-bold md:text-4xl">Learning environment and student support</h2>
                <p className="mt-3 text-foreground/70">
                  The college provides a professional atmosphere for students to study, practice, and grow with guidance from lecturers and
                  administrators committed to educational quality.
                </p>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {[
                    'Dedicated classrooms',
                    'Practical demonstration spaces',
                    'Digital support for learning',
                    'Mentoring and academic advising',
                  ].map((item) => (
                    <div key={item} className="rounded-xl border border-border/60 bg-background/80 p-4 text-sm font-medium text-foreground/75">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 md:py-24">
          <div className="mx-auto grid w-full max-w-none gap-10 px-4 sm:px-6 md:px-8 lg:grid-cols-2 lg:px-12 xl:px-16">
            <div>
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold md:text-3xl">Latest News</h2>
                <Link href={ROUTES.blog} className="text-sm font-semibold text-primary hover:opacity-80">All Updates</Link>
              </div>
              {blogPosts.length > 0 ? (
                <div className="space-y-4">
                  {blogPosts.map((post) => (
                    <Link key={post.id} href={`${ROUTES.blog}/${post.slug}`} className="block rounded-xl border border-border bg-card p-5 hover:border-primary/40">
                      <div className="mb-2 flex items-center gap-2 text-xs text-foreground/60">
                        <FileText className="h-3.5 w-3.5" />
                        {new Date(post.published_at || post.created_at).toLocaleDateString()}
                      </div>
                      <h3 className="line-clamp-2 text-lg font-semibold">{post.title}</h3>
                      <p className="mt-2 line-clamp-2 text-sm text-foreground/70">{post.excerpt}</p>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-card p-6 text-sm text-foreground/65">
                  News updates are coming soon.
                </div>
              )}
            </div>

            <div>
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold md:text-3xl">Upcoming Events</h2>
                <Link href={ROUTES.events} className="text-sm font-semibold text-primary hover:opacity-80">View Calendar</Link>
              </div>
              {events.length > 0 ? (
                <div className="space-y-4">
                  {events.map((event) => (
                    <Link key={event.id} href={`${ROUTES.events}/${event.slug}`} className="block rounded-xl border border-border bg-card p-5 hover:border-primary/40">
                      <h3 className="text-lg font-semibold">{event.title}</h3>
                      <p className="mt-1 line-clamp-2 text-sm text-foreground/70">{event.description}</p>
                      <div className="mt-3 text-sm text-primary">{new Date(event.event_date).toLocaleString()}</div>
                      {event.location && <p className="mt-1 text-xs text-foreground/60">{event.location}</p>}
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-card p-6 text-sm text-foreground/65">
                  No upcoming events at the moment.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="border-t border-border bg-gradient-to-r from-primary/15 via-secondary/15 to-primary/10 py-16 text-foreground">
          <div className="mx-auto flex w-full max-w-none flex-col items-start justify-between gap-4 px-4 sm:px-6 md:flex-row md:items-center md:px-8 lg:px-12 xl:px-16">
            <div>
              <h2 className="text-2xl font-bold md:text-3xl">Ready to start your healthcare career journey?</h2>
              <p className="mt-1 text-foreground/75">Connect with our admissions team for guidance on the best program path.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={ROUTES.contact}
                className="inline-flex items-center gap-2 rounded-lg bg-[hsl(var(--primary))] px-5 py-3 text-sm font-semibold text-[hsl(var(--primary-foreground))] transition hover:opacity-90"
              >
                Request Admission Support <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={ROUTES.studentDashboard}
                className="inline-flex items-center rounded-lg border border-[hsl(var(--primary))]/50 bg-card px-5 py-3 text-sm font-semibold text-foreground transition hover:border-[hsl(var(--primary))] hover:text-primary"
              >
                Student Portal
              </Link>
              <Link
                href={ROUTES.lecturerDashboard}
                className="inline-flex items-center rounded-lg border border-[hsl(var(--primary))]/50 bg-card px-5 py-3 text-sm font-semibold text-foreground transition hover:border-[hsl(var(--primary))] hover:text-primary"
              >
                Lecturer Portal
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
