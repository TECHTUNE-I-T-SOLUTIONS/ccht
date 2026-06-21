import Image from 'next/image'
import Link from 'next/link'
import { Navbar } from '@/components/public/navbar'
import { Footer } from '@/components/public/footer'
import { ROUTES, SCHOOL_INFO } from '@/lib/constants'
import { ProgramService } from '@/lib/services/program.service'
import { BlogService } from '@/lib/services/blog.service'
import { EventService } from '@/lib/services/event.service'
import { ArrowRight, BadgeCheck, BookOpen, CalendarDays, FileText, HeartPulse, ShieldCheck, Stethoscope, Users, GraduationCap } from 'lucide-react'

export const metadata = {
  title: `${SCHOOL_INFO.name} | Admissions & Portal`,
  description: 'Covenant College of Health Technology admissions, programs, news, and secure portal access.',
}

async function getHomeData() {
  try {
    const [programs, blogPosts, events] = await Promise.all([
      ProgramService.getAllPrograms(4),
      BlogService.getAllBlogPosts(3),
      EventService.getUpcomingEvents(3),
    ])
    return { programs, blogPosts, events }
  } catch (error) {
    console.error('Failed to load homepage data:', error)
    return { programs: [], blogPosts: [], events: [] }
  }
}

export default async function HomePage() {
  const { programs, blogPosts, events } = await getHomeData()

  const spotlight = [
    { icon: Stethoscope, title: 'Practical health training', text: 'Hands-on learning for student growth and professional service.' },
    { icon: ShieldCheck, title: 'Student-first services', text: 'Admissions, results, and school records in one place.' },
    { icon: GraduationCap, title: 'Guided admission', text: 'A simple journey from interest to enrollment.' },
    { icon: HeartPulse, title: 'Strong student support', text: 'A warm environment that helps learners settle, learn, and succeed.' },
  ]

  const quickLinks = [
    { label: 'Admissions', href: ROUTES.admissions, icon: BadgeCheck },
    { label: 'Programs', href: ROUTES.programs, icon: BookOpen },
    { label: 'Portal Login', href: ROUTES.login, icon: FileText },
    { label: 'Contact', href: ROUTES.contact, icon: Users },
  ]

  return (
    <>
      <Navbar />
      <main className="bg-background text-foreground">
        <section className="border-b border-border/60 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.12),transparent_25%),radial-gradient(circle_at_80%_20%,hsl(var(--secondary)/0.10),transparent_22%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--card)))]">
          <div className="mx-auto grid w-full max-w-none gap-12 px-4 py-16 sm:px-6 md:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-12 xl:px-16 lg:py-24">
            <div className="max-w-2xl">
              <p className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                Admissions and portal access
              </p>
              <h1 className="mt-5 text-balance text-4xl font-extrabold leading-tight md:text-6xl">
                Covenant College of Health Technology
              </h1>
              <p className="mt-4 text-lg font-medium text-foreground/80">Welcome to CCHT, where discipline meets practical health education.</p>
              <p className="mt-4 max-w-xl text-base leading-8 text-foreground/70 md:text-lg">
                We prepare students for meaningful service in the health sector through quality teaching, practical exposure, moral discipline, and a supportive campus culture.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href={ROUTES.admissions} className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90">
                  Start Admission <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href={ROUTES.programs} className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold transition hover:border-primary/40 hover:text-primary">
                  Explore Programs
                </Link>
                <Link href={ROUTES.login} className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold transition hover:border-primary/40 hover:text-primary">
                  Portal Login
                </Link>
              </div>
              <div className="mt-10 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {quickLinks.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link key={item.label} href={item.href} className="group rounded-2xl border border-border bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40">
                      <Icon className="h-5 w-5 text-primary" />
                      <p className="mt-3 text-sm font-semibold">{item.label}</p>
                    </Link>
                  )
                })}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -left-6 top-10 h-24 w-24 rounded-full bg-primary/15 blur-3xl" />
              <div className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-2xl">
                <div className="relative min-h-[420px]">
                  <Image
                    src="/images/hero-bg1.jpg"
                    alt="Campus building of Covenant College of Health Technology"
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute left-4 top-4 rounded-2xl border border-white/20 bg-black/35 px-4 py-3 text-white backdrop-blur-md">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/75">Now admitting</p>
                    <p className="mt-1 text-sm font-semibold">Future nurses, technicians, and public health professionals</p>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/75">Campus life</p>
                    <h2 className="mt-2 text-2xl font-bold md:text-3xl">A calm, professional space for learning and care</h2>
                    <p className="mt-2 max-w-lg text-sm leading-7 text-white/80">
                      Study in a setting that encourages focus, practical learning, and a strong sense of purpose.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-none px-4 py-16 sm:px-6 md:px-8 lg:px-12 xl:px-16">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {spotlight.map((item) => {
              const Icon = item.icon
              return (
                <article key={item.title} className="rounded-3xl border border-border bg-card p-6">
                  <Icon className="h-6 w-6 text-primary" />
                  <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-foreground/70">{item.text}</p>
                </article>
              )
            })}
          </div>
        </section>

        <section className="border-y border-border bg-card/50">
          <div className="mx-auto w-full max-w-none px-4 py-14 sm:px-6 md:px-8 lg:px-12 xl:px-16">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Admissions and portals</p>
                <h2 className="mt-2 text-3xl font-bold md:text-4xl">Apply, learn, and stay connected to the college community</h2>
              </div>
              <Link href={ROUTES.admissions} className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground">
                Go to Admissions <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-8 grid gap-4 lg:grid-cols-3">
              {[
                'Aspirant application and admission support',
                'Student dashboard for learning, fees, and records',
                'Lecturer and admin tools for school operations',
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-border bg-background p-5 text-sm leading-7 text-foreground/75">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-none gap-8 px-4 py-16 sm:px-6 md:px-8 lg:grid-cols-3 lg:px-12 xl:px-16">
          <div className="rounded-[2rem] border border-border bg-card p-6 lg:col-span-2">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Programs</p>
                <h2 className="mt-2 text-2xl font-bold">Available academic offerings</h2>
              </div>
              <Link href={ROUTES.programs} className="text-sm font-semibold text-primary">View all</Link>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {programs.length > 0 ? programs.map((program) => (
                <Link key={program.id} href={`${ROUTES.programs}/${program.slug}`} className="rounded-2xl border border-border bg-background p-5 transition hover:border-primary/40">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{program.level}</p>
                  <h3 className="mt-2 text-lg font-semibold">{program.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-foreground/70 line-clamp-3">{program.description}</p>
                </Link>
              )) : (
                <div className="rounded-2xl border border-dashed border-border bg-background p-5 text-sm text-foreground/60">
                  No programs published yet.
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[2rem] border border-border bg-card p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Latest news</p>
              <div className="mt-4 space-y-4">
                {blogPosts.length > 0 ? blogPosts.map((post) => (
                  <Link key={post.id} href={`${ROUTES.blog}/${post.slug}`} className="block">
                    <p className="text-xs text-foreground/50">{post.published_at ? new Date(post.published_at).toLocaleDateString() : 'Recently published'}</p>
                    <h3 className="mt-1 text-sm font-semibold">{post.title}</h3>
                  </Link>
                )) : (
                  <p className="text-sm text-foreground/60">No published news yet.</p>
                )}
              </div>
            </div>

            <div className="rounded-[2rem] border border-border bg-card p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Upcoming events</p>
              <div className="mt-4 space-y-4">
                {events.length > 0 ? events.map((event) => (
                  <Link key={event.id} href={`${ROUTES.events}/${event.slug}`} className="block">
                    <p className="text-xs text-foreground/50">{new Date(event.event_date).toLocaleDateString()}</p>
                    <h3 className="mt-1 text-sm font-semibold">{event.title}</h3>
                  </Link>
                )) : (
                  <p className="text-sm text-foreground/60">No upcoming events published yet.</p>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
