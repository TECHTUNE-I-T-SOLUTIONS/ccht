'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { AlertCircle, ArrowRight, Lock, Mail } from 'lucide-react'
import { ROUTES, SCHOOL_INFO } from '@/lib/constants'
import { toast } from 'sonner'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submitted', { email, password: password ? '***' : '' })
    setLoading(true)
    setError('')
    try {
      console.log('Making API request to /api/v1/auth/login')
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      
      console.log('Response status:', response.status, response.statusText)
      
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        console.error('Login failed:', data)
        const message = data?.error || 'Invalid credentials or account status.'
        setError(message)
        toast.error(message)
        return
      }
      
      const data = await response.json()
      console.log('Login success:', data)
      const { user, redirectTo } = data
      toast.success('Login successful.')
      
      const targetRoute = redirectTo || (user.role === 'admin' ? ROUTES.adminDashboard : user.role === 'lecturer' ? ROUTES.lecturerDashboard : user.role === 'aspirant' ? ROUTES.aspirantDashboard : ROUTES.studentDashboard)
      console.log('Redirecting to:', targetRoute)
      
      router.replace(targetRoute)
      router.refresh()
    } catch (error) {
      console.error('Login error:', error)
      const message = 'Unable to sign in right now. Please try again.'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen">
      {/* Left Side - School Image */}
      <div className="relative hidden w-1/2 lg:block">
          <Image
            src="/images/hero-bg1.jpg"
            alt="CCHT Campus"
            fill
            priority
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
            loading="eager"
          />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/50 to-blue-950/50" />
        <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-white">
          <div className="max-w-lg space-y-6">
            <Link href={ROUTES.home} className="inset-0">
              <Image src="/images/logo.png" alt={SCHOOL_INFO.shortName} width={180} height={180} className="mx-auto" />
            </Link>

            <h1 className="text-4xl font-bold text-center">Welcome to {SCHOOL_INFO.shortName}</h1>
            <p className="text-lg text-center text-white/90">{SCHOOL_INFO.tagline}</p>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex w-full items-center justify-center bg-gray-50 px-4 py-12 lg:w-1/2 dark:bg-slate-950">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="flex justify-center lg:hidden">
            <Image src="/images/logo.png" alt={SCHOOL_INFO.shortName} width={80} height={80} />
          </div>

          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome back</h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Sign in to your portal
            </p>
          </div>

          {error && (
            <div className="flex gap-3 rounded-lg border border-red-400/30 bg-red-500/10 p-4 text-red-100">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email address
                </label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 pl-10 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-slate-900 dark:text-white dark:focus:border-blue-400"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Password
                </label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-slate-900 dark:text-white dark:focus:border-blue-400"
                    placeholder="Enter your password"
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Sign in'}
              <ArrowRight className="h-4 w-4" />
            </button>

            <div className="text-center gap-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Seeking Admission? Start your journey <Link href={ROUTES.admissions} className="ml-1 font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 cursor-pointer">here</Link>.
              </p>
            </div>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            <p>Single Sign-in entry for all users</p>
          </div>
        </div>
      </div>
    </main>
  )
}