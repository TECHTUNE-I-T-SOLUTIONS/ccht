import Link from 'next/link'
import { ShieldCheck, Lock, Mail, ArrowRight } from 'lucide-react'
import { ROUTES, SCHOOL_INFO } from '@/lib/constants'

export const metadata = {
  title: `Admin Login | ${SCHOOL_INFO.name}`,
}

export default function AdminLoginPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,hsl(var(--background)),hsl(var(--card)))]">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-4 py-12 sm:px-6 md:px-8">
        <div className="grid w-full gap-8 rounded-[2rem] border border-border bg-card p-6 shadow-2xl lg:grid-cols-[0.9fr_1.1fr] lg:p-8">
          <section className="rounded-[1.5rem] bg-[linear-gradient(160deg,hsl(var(--primary)/0.15),hsl(var(--secondary)/0.12),hsl(var(--background)))] p-6">
            <ShieldCheck className="h-10 w-10 text-primary" />
            <h1 className="mt-6 text-3xl font-extrabold">Admin portal login</h1>
            <p className="mt-4 text-sm leading-7 text-foreground/70">
              Temporary admin signup is separate from student and lecturer access. Keep this route protected and limited to authorized staff.
            </p>
            <Link href="/secure/admin/signup" className="mt-8 inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-3 text-sm font-semibold transition hover:border-primary/40 hover:text-primary">
              Create admin account
            </Link>
          </section>

          <section className="rounded-[1.5rem] border border-border bg-background p-6">
            <h2 className="text-2xl font-bold">Sign in</h2>
            <form className="mt-6 space-y-4">
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
                  <input className="w-full rounded-2xl border border-border bg-card py-3 pl-10 pr-4 text-sm outline-none focus:border-primary" type="password" placeholder="••••••••" />
                </div>
              </label>
              <button className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            </form>
            <p className="mt-6 text-sm text-foreground/65">
              Return to <Link href={ROUTES.login} className="font-semibold text-primary">main portal login</Link>.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
