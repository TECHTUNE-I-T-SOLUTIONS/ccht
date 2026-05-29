'use client'

import Link from 'next/link'
import { ROUTES, SCHOOL_INFO } from '@/lib/constants'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Lock, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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

      if (response.ok) {
        const { user } = await response.json()
        // Redirect based on role
        if (user.role === 'student') {
          router.push(ROUTES.studentDashboard)
        } else if (user.role === 'lecturer' || user.role === 'teacher') {
          router.push(ROUTES.lecturerDashboard)
        } else if (user.role === 'admin') {
          router.push(ROUTES.adminDashboard)
        }
      } else {
        setError('Invalid email or password')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/5">
      <div className="w-full max-w-md px-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href={ROUTES.home} className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white text-sm font-bold">
              C
            </div>
            <span className="text-lg font-bold text-primary">{SCHOOL_INFO.shortName}</span>
          </Link>
        </div>

        {/* Form Card */}
        <div className="bg-card border border-border rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold mb-2">Welcome Back</h1>
          <p className="text-foreground/60 mb-6">Sign in to your account</p>

          {error && (
            <div className="bg-red-100 text-red-800 rounded-lg p-4 mb-6 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-foreground/40" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium">Password</label>
                <Link href={ROUTES.forgotPassword} className="text-sm text-primary hover:opacity-80">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-foreground/40" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-2 rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 mt-6"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-foreground/60 mt-6">
            Don&apos;t have an account?{' '}
            <Link href={ROUTES.register} className="text-primary font-semibold hover:opacity-80">
              Sign up
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-foreground/50 mt-6">
          © {new Date().getFullYear()} {SCHOOL_INFO.name}
        </p>
      </div>
    </div>
  )
}
