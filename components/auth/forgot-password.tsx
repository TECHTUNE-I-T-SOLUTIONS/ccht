'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { AlertCircle, ArrowLeft, Mail, CheckCircle, ArrowRight } from 'lucide-react'
import { ROUTES, SCHOOL_INFO } from '@/lib/constants'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/v1/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        const message = data?.error || 'Failed to send reset email'
        setError(message)
        toast.error(message)
        return
      }
      
      setSuccess(true)
      toast.success('Password reset email sent successfully')
    } catch (error) {
      const message = 'Unable to send reset email. Please try again.'
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
              <Image src="/images/logo.png" alt={SCHOOL_INFO.shortName} width={180} height={180} className="mx-auto" loading="eager" />
            </Link>

            <h1 className="text-4xl font-bold text-center">Welcome to {SCHOOL_INFO.shortName}</h1>
            <p className="text-lg text-center text-white/90">{SCHOOL_INFO.tagline}</p>
          </div>
        </div>
      </div>

      {/* Right Side - Forgot Password Form */}
      <div className="flex w-full items-center justify-center bg-gray-50 px-4 py-12 lg:w-1/2 dark:bg-slate-950">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="flex justify-center lg:hidden">
            <Image src="/images/logo.png" alt={SCHOOL_INFO.shortName} width={80} height={80} loading="eager" />
          </div>

          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Reset your password</h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Enter your email address and we'll send you a link to reset your password
            </p>
          </div>

          {error && (
            <div className="flex gap-3 rounded-lg border border-red-400/30 bg-red-500/10 p-4 text-red-900">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="flex gap-3 rounded-lg border border-green-400/30 bg-green-500/10 p-4 text-green-900">
              <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-semibold">Password reset email sent!</p>
                <p className="mt-1">Please check your email inbox for the reset link.</p>
              </div>
            </div>
          )}

          {!success && (
            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email address</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full border border-primary hover:shadow-lg hover:shadow-blue-600"
              >
                {loading ? 'Sending...' : 'Send reset link'}
                {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </form>
          )}

          <div className="text-center">
            <Link
              href="login"
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300 border border-primary p-2 rounded-lg hover:shadow-lg hover:shadow-blue-600"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
