'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { AlertCircle, CheckCircle, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function ResetPasswordConfirmContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(true)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    // The PKCE token exchange now happens server-side at /auth/confirm, which
    // redirects here with a valid session cookie already set. We just need to
    // confirm the user is authenticated before showing the password form.
    const verifySession = async () => {
      // If the server-side exchange failed, /auth/confirm redirects here with
      // ?error=invalid_or_expired (or the old ?code=... / ?error=... params).
      const errorParam = searchParams.get('error')

      if (errorParam === 'invalid_or_expired') {
        setError('This password reset link is invalid or has expired. Please request a new one.')
        setVerifying(false)
        return
      }

      // Legacy links may still arrive with a `code` (PKCE) or `access_token`
      // (implicit) in the URL. If so, the server-side /auth/confirm route was
      // bypassed (e.g. old email still in the user's inbox). We can't reliably
      // exchange a PKCE code in the browser because the code_verifier was
      // generated in a different session, so we show an explanatory error and
      // ask the user to request a fresh link.
      const code = searchParams.get('code')
      const accessToken = searchParams.get('access_token')

      if (code || accessToken) {
        setError(
          'This password reset link is no longer valid (it may have been used already or was generated for a different session). Please request a new reset link.'
        )
        setVerifying(false)
        return
      }

      // Confirm we have an active session (set by /auth/confirm).
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          setError('Your session could not be verified. Please request a new password reset link.')
        }
      } catch (err) {
        setError('Your session could not be verified. Please request a new password reset link.')
      } finally {
        setVerifying(false)
      }
    }

    verifySession()
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      // The session was established server-side by /auth/confirm, so the
      // browser client already has the session cookie. We can call
      // updateUser directly — no client-side code exchange needed.
      const supabase = createClient()
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      })

      if (updateError) {
        throw new Error(updateError.message)
      }

      setSuccess(true)
      toast.success('Password updated successfully')

      // Sign the user out and redirect to login after a short delay so they
      // can sign in with the new password.
      setTimeout(async () => {
        try {
          await supabase.auth.signOut()
        } catch {
          // ignore sign-out errors
        }
        router.push('/login')
      }, 2000)
    } catch (error: any) {
      setError(error.message || 'Failed to reset password')
      toast.error(error.message || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  // Loading state while we verify the session
  if (verifying) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-slate-950">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Verifying your reset link…</p>
        </div>
      </div>
    )
  }

  // Error state — link invalid/expired
  if (error && !success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-slate-950">
        <div className="w-full max-w-md space-y-6">
          <div className="flex gap-3 rounded-lg border border-red-400/30 bg-red-500/10 p-4 text-red-900 dark:text-red-200">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-semibold">Unable to reset password</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
          <Button
            onClick={() => router.push('/forgot-password')}
            className="w-full border border-primary hover:shadow-lg hover:shadow-blue-600"
          >
            Request new reset link
          </Button>
        </div>
      </div>
    )
  }

  // Success state
  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-slate-950">
        <div className="w-full max-w-md space-y-6">
          <div className="flex gap-3 rounded-lg border border-green-400/30 bg-green-500/10 p-4 text-green-900 dark:text-green-200">
            <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-semibold">Password updated successfully!</p>
              <p className="text-sm">Redirecting to login…</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Form state
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Set new password</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Enter your new password below
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="password">New Password</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  placeholder="Enter new password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10"
                  placeholder="Confirm new password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full border border-primary hover:shadow-lg hover:shadow-blue-600"
          >
            {loading ? 'Updating…' : 'Update password'}
          </Button>
        </form>
      </div>
    </div>
  )
}

export default function ResetPasswordConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-slate-950">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Loading…</p>
          </div>
        </div>
      }
    >
      <ResetPasswordConfirmContent />
    </Suspense>
  )
}