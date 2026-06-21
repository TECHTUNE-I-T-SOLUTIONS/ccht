import Link from 'next/link'
import { ShieldPlus, Lock, Mail, UserRound, ArrowRight } from 'lucide-react'
import { ROUTES, SCHOOL_INFO } from '@/lib/constants'

export const metadata = {
  title: `Admin Signup | ${SCHOOL_INFO.name}`,
}

export default function AdminSignupPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.14),transparent_25%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--card)))]">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-4 py-12 sm:px-6 md:px-8">
        <div className="grid w-full gap-8 rounded-[2rem] border border-border bg-card p-6 shadow-2xl lg:grid-cols-[0.95fr_1.05fr] lg:p-8">
          <section className="rounded-[1.5rem] border border-border bg-background p-6">
            <ShieldPlus className="h-10 w-10 text-primary" />
            <h1 className="mt-6 text-3xl font-extrabold">Secure admin signup</h1>
            <p className="mt-4 text-sm leading-7 text-foreground/70">
              This page is for temporary administrative onboarding only. Students should never use this route for direct account creation.
            </p>
            <div className="mt-6 rounded-2xl border border-dashed border-border bg-card p-4 text-sm text-foreground/65">
              After signup, admins can be assigned permissions for admissions, students, lecturers, payments, and content management.
            </div>
          </section>

          <section className="rounded-[1.5rem] bg-[linear-gradient(160deg,hsl(var(--primary)/0.08),hsl(var(--secondary)/0.08),hsl(var(--background)))] p-6">
            <h2 className="text-2xl font-bold">Create account</h2>
            <form className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium">Full name</span>
                <div className="relative">
                  <UserRound className="absolute left-3 top-3.5 h-4 w-4 text-foreground/40" />
                  <input className="w-full rounded-2xl border border-border bg-card py-3 pl-10 pr-4 text-sm outline-none focus:border-primary" type="text" placeholder="Admin Name" />
                </div>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium">Email</span>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 h-4 w-4 text-foreground/40" />
                  <input className="w-full rounded-2xl border border-border bg-card py-3 pl-10 pr-4 text-sm outline-none focus:border-primary" type="email" placeholder="admin@school.edu" />
                </div>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium">Password</span>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 h-4 w-4 text-foreground/40" />
                  <input className="w-full rounded-2xl border border-border bg-card py-3 pl-10 pr-4 text-sm outline-none focus:border-primary" type="password" placeholder="Choose a secure password" />
                </div>
              </label>
              <button className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">
                Create admin account <ArrowRight className="h-4 w-4" />
              </button>
            </form>
            <p className="mt-6 text-sm text-foreground/65">
              Existing admin? <Link href="/secure/admin/login" className="font-semibold text-primary">Sign in here</Link>.
            </p>
            <p className="mt-2 text-sm text-foreground/55">
              Or go back to <Link href={ROUTES.login} className="font-semibold text-primary">main portal login</Link>.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
