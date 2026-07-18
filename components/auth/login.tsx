'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { AlertCircle, ArrowRight, Lock, Mail, UserPlus, LogOut, User, CheckCircle } from 'lucide-react'
import { ROUTES, SCHOOL_INFO } from '@/lib/constants'
import { toast } from 'sonner'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

type PortalUser = {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  role: string
  avatarUrl?: string
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [currentUser, setCurrentUser] = useState<PortalUser | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/v1/auth/me')
        const payload = await response.json()
        if (payload?.user) {
          setCurrentUser(payload.user)
        }
      } catch (error) {
        console.error('Session check failed:', error)
      } finally {
        setCheckingSession(false)
      }
    }

    checkSession()
  }, [])

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
        
        // Show registration modal if account doesn't exist
        if (message === 'Account does not exist') {
          setShowRegisterModal(true)
          setError('')
          return
        }
        
        setError(message)
        toast.error(message)
        return
      }
      
      const data = await response.json()
      console.log('Login success:', data)
      const { user, redirectTo } = data
      toast.success('Login successful.')
      
      let targetRoute = redirectTo
      
      if (!targetRoute) {
        if (user.role === 'admin') {
          targetRoute = ROUTES.adminDashboard
        } else if (user.role === 'lecturer') {
          targetRoute = ROUTES.lecturerDashboard
        } else if (user.role === 'aspirant') {
          // Check if aspirant has been migrated to student
          try {
            const profileRes = await fetch('/api/v1/aspirant/profile')
            const profileData = await profileRes.json()
            if (profileData.success && profileData.data?.application_status === 'migrated') {
              targetRoute = ROUTES.studentDashboard
            } else {
              targetRoute = ROUTES.aspirantDashboard
            }
          } catch (error) {
            console.error('Failed to check aspirant status:', error)
            targetRoute = ROUTES.aspirantDashboard
          }
        } else {
          targetRoute = ROUTES.studentDashboard
        }
      }
      
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

  const handleRegisterRedirect = () => {
    setShowRegisterModal(false)
    router.push(`${ROUTES.apply}?email=${encodeURIComponent(email)}`)
  }

  const handleContinueSession = () => {
    if (!currentUser) return
    const targetRoute = currentUser.role === 'admin' ? ROUTES.adminDashboard : currentUser.role === 'lecturer' ? ROUTES.lecturerDashboard : currentUser.role === 'aspirant' ? ROUTES.aspirantDashboard : ROUTES.studentDashboard
    router.replace(targetRoute)
    router.refresh()
  }

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/v1/auth/logout', { method: 'POST' })
      if (response.ok) {
        setCurrentUser(null)
        toast.success('Logged out successfully')
      }
    } catch (error) {
      console.error('Logout failed:', error)
      toast.error('Failed to logout')
    }
  }

  const getRoleLabel = (role: string) => {
    const roleLabels: Record<string, string> = {
      admin: 'Administrator',
      lecturer: 'Lecturer',
      aspirant: 'Aspirant',
      student: 'Student'
    }
    return roleLabels[role] || role
  }

  const getRoleColor = (role: string) => {
    const roleColors: Record<string, string> = {
      admin: 'bg-red-500/10 text-red-600 border-red-500/20',
      lecturer: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
      aspirant: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      student: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
    }
    return roleColors[role] || 'bg-gray-500/10 text-gray-600 border-gray-500/20'
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

      {/* Right Side - Login Form */}
      <div className="flex w-full items-center justify-center bg-gray-50 px-4 py-12 lg:w-1/2 dark:bg-slate-950">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="flex justify-center lg:hidden">
            <Image src="/images/logo.png" alt={SCHOOL_INFO.shortName} width={80} height={80} loading="eager" />
          </div>

          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome back</h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Sign in to your portal
            </p>
          </div>

          {error && (
            <div className="flex gap-3 rounded-lg border border-red-400/30 bg-red-500/10 p-4 text-red-900">
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

          {/* Active Session Card */}
          {!checkingSession && currentUser && (
            <Card className="border-2 border-blue-500/20 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-slate-900 p-6 shadow-lg">
              <div className="flex items-start gap-4">
                {/* Profile Picture */}
                <div className="relative">
                  {currentUser.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={currentUser.avatarUrl} 
                      alt={`${currentUser.firstName} ${currentUser.lastName}`}
                      className="h-16 w-16 rounded-full border-2 border-blue-500 object-cover shadow-md"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-blue-500 bg-blue-500/10 text-blue-600 shadow-md">
                      <User className="h-8 w-8" />
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900">
                    <CheckCircle className="h-3.5 w-3.5 text-white" />
                  </div>
                </div>

                {/* User Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      {currentUser.firstName} {currentUser.lastName}
                    </h3>
                    <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold capitalize ${getRoleColor(currentUser.role)}`}>
                      {getRoleLabel(currentUser.role)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{currentUser.email}</p>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                    You're already signed in. Continue to your dashboard or logout to switch accounts.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 flex gap-3">
                <Button
                  onClick={handleContinueSession}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Continue Session
                </Button>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="flex-1 border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-slate-800"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>
            </Card>
          )}

          <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            <p>CCHT Secure Portal</p>
          </div>
        </div>
      </div>

      {/* Registration Modal */}
      <AlertDialog open={showRegisterModal} onOpenChange={setShowRegisterModal}>
        <AlertDialogContent className="border-border bg-white text-foreground dark:bg-slate-950">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="rounded-full bg-primary/10 p-3 text-primary">
                <UserPlus className="h-6 w-6" />
              </div>
              <AlertDialogTitle>Account Not Found</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-base">
              We couldn't find an account associated with <span className="font-semibold text-foreground">{email}</span>.
              Would you like to register for a course with this email address?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRegisterRedirect}
              className="bg-primary hover:bg-primary/90"
            >
              Register Now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}