'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { AlertCircle, ArrowRight, Lock, Mail, ShieldCheck, BadgeCheck } from 'lucide-react'
import { ROUTES, SCHOOL_INFO } from '@/lib/constants'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!response.ok) {
        setError('Invalid credentials or account status.')
        return
      }
      const { user } = await response.json()
      if (user.role === 'admin') router.push(ROUTES.adminDashboard)
      else if (user.role === 'lecturer' || user.role === 'teacher') router.push(ROUTES.lecturerDashboard)
      else router.push(ROUTES.studentDashboard)
    } catch {
      setError('Unable to sign in right now. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.14),transparent_25%),radial-gradient(circle_at_80%_20%,hsl(var(--secondary)/0.12),transparent_22%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--card)))]">
      <div className="mx-auto grid min-h-screen w-full max-w-none lg:grid-cols-[0.95fr_1.05fr]">
        <section className="flex items-center px-4 py-10 sm:px-6 md:px-8 lg:px-12 xl:px-16">
          <div className="w-full max-w-xl">
            <Link href={ROUTES.home} className="inline-flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
                CCHT
              </div>
              <div>
                <p className="text-sm font-semibold">{SCHOOL_INFO.shortName}</p>
                <p className="text-xs text-foreground/60">{SCHOOL_INFO.tagline}</p>
              </div>
            </Link>

            <div className="mt-10 max-w-lg">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Portal access</p>
              <h1 className="mt-4 text-4xl font-extrabold leading-tight md:text-5xl">Login to the right portal for your role</h1>
              <p className="mt-4 text-base leading-8 text-foreground/70">
                Applicants, students, lecturers, and admins all enter through a secure portal entry. New aspirants should start with admissions,
                not the student dashboard.
              </p>
            </div>

            <div className="mt-8 rounded-[2rem] border border-border bg-card p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                  <BadgeCheck className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Who should sign in here?</h2>
                  <p className="text-sm text-foreground/65">Applicants, students, and staff with existing accounts.</p>
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  { title: 'Applicants', text: 'Continue your admission journey.' },
                  { title: 'Students', text: 'Access your academic records.' },
                  { title: 'Lecturers', text: 'Open your teaching workspace.' },
                  { title: 'Staff', text: 'Enter your assigned dashboard.' },
                ].map((item) => (
                  <div key={item.title} className="rounded-2xl border border-border bg-background p-4">
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="mt-1 text-sm leading-6 text-foreground/70">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center px-4 py-10 sm:px-6 md:px-8 lg:px-12 xl:px-16">
          <div className="w-full max-w-xl rounded-[2rem] border border-border bg-card p-6 shadow-2xl sm:p-8">
            <div className="mb-8 flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Welcome back</p>
                <h2 className="mt-2 text-3xl font-bold">Sign in securely</h2>
                <p className="mt-2 text-sm leading-7 text-foreground/65">Use your assigned email and password to continue.</p>
              </div>
              <div className="hidden rounded-2xl border border-primary/20 bg-primary/10 p-3 text-primary md:block">
                <ShieldCheck className="h-6 w-6" />
              </div>
            </div>

            {error && (
              <div className="mb-5 flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-900/40 dark:bg-red-950/30">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-medium">Email address</span>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 h-4 w-4 text-foreground/40" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-2xl border border-border bg-background py-3 pl-10 pr-4 text-sm outline-none transition focus:border-primary"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium">Password</span>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 h-4 w-4 text-foreground/40" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-2xl border border-border bg-background py-3 pl-10 pr-4 text-sm outline-none transition focus:border-primary"
                    placeholder="Enter your password"
                    required
                  />
                </div>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
              >
                {loading ? 'Signing in...' : 'Sign in'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="mt-6 grid gap-3 sm:grid-cols-1">
              <Link href={ROUTES.admissions} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-background px-4 py-3 text-sm font-semibold transition hover:border-primary/40 hover:text-primary">
                <ArrowRight className="h-4 w-4" />
                Start Admission
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
