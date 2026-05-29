'use client'

import Link from 'next/link'
import { ROUTES, SCHOOL_INFO, USER_ROLES } from '@/lib/constants'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Lock, User, AlertCircle, CheckCircle } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: USER_ROLES.STUDENT as const,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match')
        return
      }

      const response = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          role: formData.role,
        }),
      })

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => {
          router.push(ROUTES.login)
        }, 2000)
      } else {
        const data = await response.json()
        setError(data.error || 'Registration failed')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/5">
        <div className="w-full max-w-md px-4">
          <div className="bg-card border border-border rounded-lg shadow-lg p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Registration Successful!</h2>
            <p className="text-foreground/60 mb-6">
              Please verify your email address. Check your inbox for the verification link.
            </p>
            <p className="text-sm text-foreground/50">Redirecting to login...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/5 py-8">
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
          <h1 className="text-2xl font-bold mb-2">Create Account</h1>
          <p className="text-foreground/60 mb-6">Join {SCHOOL_INFO.shortName} today</p>

          {error && (
            <div className="bg-red-100 text-red-800 rounded-lg p-4 mb-6 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">First Name</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="John"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Last Name</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Doe"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-foreground/40" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value={USER_ROLES.STUDENT}>Student</option>
                <option value={USER_ROLES.LECTURER}>Lecturer</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-foreground/40" />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-foreground/40" />
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
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
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-foreground/60 mt-6">
            Already have an account?{' '}
            <Link href={ROUTES.login} className="text-primary font-semibold hover:opacity-80">
              Sign in
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
