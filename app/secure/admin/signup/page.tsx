'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ShieldPlus, Lock, Mail, UserRound, ArrowRight, AlertCircle, ShieldCheck, Check, X } from 'lucide-react'
import { ROUTES } from '@/lib/constants'
import { toast } from 'sonner'

const passwordRules = [
  { label: 'At least 10 characters', test: (value: string) => value.length >= 10 },
  { label: 'One uppercase letter', test: (value: string) => /[A-Z]/.test(value) },
  { label: 'One lowercase letter', test: (value: string) => /[a-z]/.test(value) },
  { label: 'One number', test: (value: string) => /[0-9]/.test(value) },
  { label: 'One special character', test: (value: string) => /[^A-Za-z0-9]/.test(value) },
]

export default function AdminSignupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')

  const passwordScore = passwordRules.filter((rule) => rule.test(password)).length
  const passwordStrong = passwordScore === passwordRules.length

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      if (!fullName.trim() || fullName.trim().length < 2) {
        setError('Please enter a valid full name.')
        return
      }
      if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
        setError('Please enter a valid email address.')
        return
      }
      if (!passwordStrong) {
        setError('Please choose a stronger password.')
        return
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.')
        return
      }

      const [firstName, ...rest] = fullName.trim().split(/\s+/)
      const response = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName: rest.join(' ') || 'Admin',
          email,
          password,
          confirmPassword,
          role: 'admin',
        }),
      })

      const data = await response.json().catch(() => null)
      if (!response.ok) {
        const message = data?.error || 'Unable to create admin account.'
        setError(message)
        toast.error(message)
        return
      }

      toast.success('Admin account created successfully.')
      router.push('/secure/admin/login?signup=success')
    } catch {
      const message = 'Unable to create admin account right now.'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

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
            {error && (
              <div className="mt-4 flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-900/40 dark:bg-red-950/30">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}
            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <label className="block">
                <span className="mb-2 block text-sm font-medium">Full name</span>
                <div className="relative">
                  <UserRound className="absolute left-3 top-3.5 h-4 w-4 text-foreground/40" />
                  <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full rounded-2xl border border-border bg-card py-3 pl-10 pr-4 text-sm outline-none focus:border-primary" type="text" placeholder="Admin Name" required />
                </div>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium">Email</span>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 h-4 w-4 text-foreground/40" />
                  <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-2xl border border-border bg-card py-3 pl-10 pr-4 text-sm outline-none focus:border-primary" type="email" placeholder="admin@school.edu" required />
                </div>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium">Password</span>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 h-4 w-4 text-foreground/40" />
                  <input value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-2xl border border-border bg-card py-3 pl-10 pr-4 text-sm outline-none focus:border-primary" type="password" placeholder="Choose a secure password" required />
                </div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <p className={`text-xs ${passwordStrong ? 'text-emerald-600' : 'text-foreground/60'}`}>
                    {password ? `${passwordScore} of ${passwordRules.length} checks passed` : 'Choose a strong password.'}
                  </p>
                  <span className={`inline-flex items-center gap-1 text-xs font-medium ${passwordStrong ? 'text-emerald-600' : 'text-foreground/50'}`}>
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {passwordStrong ? 'Secure' : 'Needs work'}
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-border">
                  <div
                    className={`h-full rounded-full transition-all ${passwordStrong ? 'bg-emerald-500' : passwordScore >= 3 ? 'bg-amber-500' : 'bg-rose-500'}`}
                    style={{ width: `${(passwordScore / passwordRules.length) * 100}%` }}
                  />
                </div>
                <ul className="mt-3 grid gap-2 text-xs text-foreground/65 sm:grid-cols-2">
                  {passwordRules.map((rule) => {
                    const met = rule.test(password)
                    return (
                      <li key={rule.label} className={`flex items-center gap-2 ${met ? 'text-emerald-600' : ''}`}>
                        {met ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                        <span>{rule.label}</span>
                      </li>
                    )
                  })}
                </ul>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium">Confirm password</span>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 h-4 w-4 text-foreground/40" />
                  <input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full rounded-2xl border border-border bg-card py-3 pl-10 pr-4 text-sm outline-none focus:border-primary" type="password" placeholder="Confirm password" required />
                </div>
              </label>
              <button disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60">
                {loading ? 'Creating account...' : 'Create admin account'} <ArrowRight className="h-4 w-4" />
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
