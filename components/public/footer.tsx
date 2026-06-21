import Link from 'next/link'
import { ROUTES, SCHOOL_INFO } from '@/lib/constants'
import { Mail, Phone, MapPin, ShieldCheck, GraduationCap, Landmark } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t border-border bg-[linear-gradient(180deg,hsl(var(--background)),hsl(var(--card)))]">
      <div className="mx-auto w-full max-w-none px-4 py-12 sm:px-6 md:px-8 lg:px-12 xl:px-16">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_0.8fr_0.8fr_1fr_1fr]">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
                CCHT
              </div>
              <div>
                <h3 className="text-base font-bold">{SCHOOL_INFO.shortName}</h3>
                <p className="text-xs text-foreground/60">{SCHOOL_INFO.tagline}</p>
              </div>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-foreground/70">
              {SCHOOL_INFO.fullname} serves aspirants, students, lecturers, and administrators through a unified campus experience that is modern, secure, and easy to use.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground/70">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Secure portals
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground/70">
                <GraduationCap className="h-3.5 w-3.5 text-primary" /> Admissions-ready
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground/70">
                <Landmark className="h-3.5 w-3.5 text-primary" /> College management
              </span>
            </div>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-foreground/50">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href={ROUTES.home} className="text-foreground/70 transition hover:text-primary">Home</Link></li>
              <li><Link href={ROUTES.programs} className="text-foreground/70 transition hover:text-primary">Programs</Link></li>
              <li><Link href={ROUTES.admissions} className="text-foreground/70 transition hover:text-primary">Admissions</Link></li>
              <li><Link href={ROUTES.about} className="text-foreground/70 transition hover:text-primary">About</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-foreground/50">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href={ROUTES.blog} className="text-foreground/70 transition hover:text-primary">News</Link></li>
              <li><Link href={ROUTES.events} className="text-foreground/70 transition hover:text-primary">Events</Link></li>
              <li><Link href={ROUTES.faq} className="text-foreground/70 transition hover:text-primary">FAQs</Link></li>
              <li><Link href={ROUTES.contact} className="text-foreground/70 transition hover:text-primary">Support</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-foreground/50">Portal Access</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href={ROUTES.login} className="text-foreground/70 transition hover:text-primary">Applicant Portal</Link></li>
              <li><Link href={ROUTES.studentDashboard} className="text-foreground/70 transition hover:text-primary">Student Portal</Link></li>
              <li><Link href={ROUTES.lecturerDashboard} className="text-foreground/70 transition hover:text-primary">Lecturer Portal</Link></li>
              <li><Link href={ROUTES.adminDashboard} className="text-foreground/70 transition hover:text-primary">Admin Portal</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-foreground/50">Contact</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span className="text-foreground/70">{SCHOOL_INFO.address}</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <a href={`mailto:${SCHOOL_INFO.email}`} className="text-foreground/70 transition hover:text-primary">
                  {SCHOOL_INFO.email}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <a href={`tel:${SCHOOL_INFO.phone}`} className="text-foreground/70 transition hover:text-primary">
                  {SCHOOL_INFO.phone}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-border pt-6 md:flex-row md:items-center">
          <p className="text-xs text-foreground/50">
            &copy; {new Date().getFullYear()} {SCHOOL_INFO.name}. All rights reserved.
          </p>
          <div className="flex gap-4 text-xs text-foreground/50">
            <Link href={ROUTES.privacy} className="hover:opacity-100 transition-opacity">Privacy Policy</Link>
            <Link href={ROUTES.terms} className="hover:opacity-100 transition-opacity">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
