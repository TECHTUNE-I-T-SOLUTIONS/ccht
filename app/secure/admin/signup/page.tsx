'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { ShieldPlus, Lock, Mail, UserRound, ArrowRight, AlertCircle, ShieldCheck, Check, X, CheckCircle, LogOut, User, Phone, Building, Briefcase, ChevronLeft, ChevronRight, Shield, AlertTriangle } from 'lucide-react'
import { ROUTES, SCHOOL_INFO } from '@/lib/constants'
import { toast } from 'sonner'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ADMIN_DEPARTMENTS, ADMIN_DESIGNATIONS, ADMIN_SCOPES, ADMIN_PERMISSIONS, getDepartmentLabel, getDesignationLabel, getScopeLabel } from '@/lib/admin-constants'

type PortalUser = {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  role: string
  avatarUrl?: string
}

const passwordRules = [
  { label: 'At least 10 characters', test: (value: string) => value.length >= 10 },
  { label: 'One uppercase letter', test: (value: string) => /[A-Z]/.test(value) },
  { label: 'One lowercase letter', test: (value: string) => /[a-z]/.test(value) },
  { label: 'One number', test: (value: string) => /[0-9]/.test(value) },
  { label: 'One special character', test: (value: string) => /[^A-Za-z0-9]/.test(value) },
]

type FormData = {
  fullName: string
  email: string
  phone: string
  password: string
  confirmPassword: string
  department: string
  designation: string
  adminScope: string
  canManageUsers: boolean
  canManageContent: boolean
  canManageAcademics: boolean
  canManageFinance: boolean
}

const steps = [
  { title: 'Personal Info', icon: User },
  { title: 'Security', icon: Lock },
  { title: 'Professional', icon: Briefcase },
  { title: 'Permissions', icon: Shield },
]

export default function AdminSignupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentStep, setCurrentStep] = useState(0)
  const [currentUser, setCurrentUser] = useState<PortalUser | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    department: '',
    designation: '',
    adminScope: 'operations',
    canManageUsers: false,
    canManageContent: false,
    canManageAcademics: false,
    canManageFinance: false,
  })

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

  const passwordScore = passwordRules.filter((rule) => rule.test(formData.password)).length
  const passwordStrong = passwordScore === passwordRules.length

  const handleNext = () => {
    if (currentStep === 0) {
      if (!formData.fullName.trim() || formData.fullName.trim().length < 2) {
        setError('Please enter a valid full name.')
        return
      }
      if (!formData.email.trim() || !/^\S+@\S+\.\S+$/.test(formData.email)) {
        setError('Please enter a valid email address.')
        return
      }
      if (!formData.phone.trim() || !/^\+?\d{10,15}$/.test(formData.phone.replace(/\s/g, ''))) {
        setError('Please enter a valid phone number.')
        return
      }
    }
    if (currentStep === 1) {
      if (!passwordStrong) {
        setError('Please choose a stronger password.')
        return
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match.')
        return
      }
    }
    if (currentStep === 2) {
      if (!formData.department) {
        setError('Please select a department.')
        return
      }
      if (!formData.designation) {
        setError('Please select a designation.')
        return
      }
    }
    setError('')
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
      setError('')
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      const [firstName, ...rest] = formData.fullName.trim().split(/\s+/)
      const response = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName: rest.join(' ') || 'Admin',
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          role: 'admin',
          department: formData.department,
          designation: formData.designation,
          adminScope: formData.adminScope,
          canManageUsers: formData.canManageUsers,
          canManageContent: formData.canManageContent,
          canManageAcademics: formData.canManageAcademics,
          canManageFinance: formData.canManageFinance,
        }),
      })

      const data = await response.json().catch(() => null)
      if (!response.ok) {
        const message = data?.error || 'Unable to create admin account.'
        setError(message)
        toast.error(message)
        setShowConfirmModal(false)
        return
      }

      toast.success('Admin account created successfully.')
      setShowConfirmModal(false)
      router.push('/secure/admin/login?signup=success')
    } catch {
      const message = 'Unable to create admin account right now.'
      setError(message)
      toast.error(message)
      setShowConfirmModal(false)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAccount = () => {
    setShowConfirmModal(true)
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

            <h1 className="text-4xl font-bold text-center">Admin Portal</h1>
            <p className="text-lg text-center text-white/90">{SCHOOL_INFO.tagline}</p>
            <div className="mt-6 rounded-2xl border border-dashed border-white/30 bg-white/10 p-4 text-sm text-white/80">
              Secure administrative onboarding for authorized personnel only.
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Signup Form */}
      <div className="flex w-full items-center justify-center bg-gray-50 px-4 py-12 lg:w-1/2 dark:bg-slate-950">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="flex justify-center lg:hidden">
            <Image src="/images/logo.png" alt={SCHOOL_INFO.shortName} width={80} height={80} loading="eager" />
          </div>

          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Signup</h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Step {currentStep + 1} of {steps.length}: {steps[currentStep].title}
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const StepIcon = step.icon
              const isCompleted = index < currentStep
              const isCurrent = index === currentStep
              return (
                <div key={step.title} className="flex flex-col items-center flex-1">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all ${
                      isCompleted
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : isCurrent
                        ? 'border-blue-600 bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
                        : 'border-gray-300 bg-gray-50 text-gray-400 dark:border-gray-700 dark:bg-slate-900 dark:text-gray-600'
                    }`}
                  >
                    {isCompleted ? <Check className="h-4 w-4" /> : <StepIcon className="h-4 w-4" />}
                  </div>
                  <span className={`mt-1 text-xs ${isCurrent ? 'font-medium text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-600'}`}>
                    {step.title}
                  </span>
                </div>
              )
            })}
          </div>

          {error && (
            <div className="flex gap-3 rounded-lg border border-red-400/30 bg-red-500/10 p-4 text-red-900">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="mt-8 space-y-6">
            {/* Step 1: Personal Info */}
            {currentStep === 0 && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Full name
                  </label>
                  <div className="relative mt-1">
                    <UserRound className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 pl-10 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-slate-900 dark:text-white dark:focus:border-blue-400"
                      placeholder="Admin Name"
                      required
                    />
                  </div>
                </div>

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
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 pl-10 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-slate-900 dark:text-white dark:focus:border-blue-400"
                      placeholder="admin@school.edu"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Phone number
                  </label>
                  <div className="relative mt-1">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 pl-10 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-slate-900 dark:text-white dark:focus:border-blue-400"
                      placeholder="+234 7066 3698 18"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Security */}
            {currentStep === 1 && (
              <div className="space-y-4">
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
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-slate-900 dark:text-white dark:focus:border-blue-400"
                      placeholder="Choose a secure password"
                      required
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <p className={`text-xs ${passwordStrong ? 'text-emerald-600' : 'text-gray-500 dark:text-gray-400'}`}>
                      {formData.password ? `${passwordScore} of ${passwordRules.length} checks passed` : 'Choose a strong password.'}
                    </p>
                    <span className={`inline-flex items-center gap-1 text-xs font-medium ${passwordStrong ? 'text-emerald-600' : 'text-gray-500 dark:text-gray-400'}`}>
                      <ShieldCheck className="h-3.5 w-3.5" />
                      {passwordStrong ? 'Secure' : 'Needs work'}
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                    <div
                      className={`h-full rounded-full transition-all ${passwordStrong ? 'bg-emerald-500' : passwordScore >= 3 ? 'bg-amber-500' : 'bg-rose-500'}`}
                      style={{ width: `${(passwordScore / passwordRules.length) * 100}%` }}
                    />
                  </div>
                  <ul className="mt-3 grid gap-2 text-xs text-gray-500 dark:text-gray-400 sm:grid-cols-2">
                    {passwordRules.map((rule) => {
                      const met = rule.test(formData.password)
                      return (
                        <li key={rule.label} className={`flex items-center gap-2 ${met ? 'text-emerald-600' : ''}`}>
                          {met ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                          <span>{rule.label}</span>
                        </li>
                      )
                    })}
                  </ul>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Confirm password
                  </label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 pl-10 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-slate-900 dark:text-white dark:focus:border-blue-400"
                      placeholder="Confirm password"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Professional Info */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="department" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Department
                  </label>
                  <div className="relative mt-1">
                    <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <select
                      id="department"
                      name="department"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 pl-10 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-slate-900 dark:text-white dark:focus:border-blue-400"
                      required
                    >
                      <option value="">Select department</option>
                      {ADMIN_DEPARTMENTS.map((dept) => (
                        <option key={dept.value} value={dept.value}>
                          {dept.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="designation" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Designation
                  </label>
                  <div className="relative mt-1">
                    <Briefcase className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <select
                      id="designation"
                      name="designation"
                      value={formData.designation}
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                      className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 pl-10 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-slate-900 dark:text-white dark:focus:border-blue-400"
                      required
                    >
                      <option value="">Select designation</option>
                      {ADMIN_DESIGNATIONS.map((desig) => (
                        <option key={desig.value} value={desig.value}>
                          {desig.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="adminScope" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Admin Scope
                  </label>
                  <div className="relative mt-1">
                    <Shield className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <select
                      id="adminScope"
                      name="adminScope"
                      value={formData.adminScope}
                      onChange={(e) => setFormData({ ...formData, adminScope: e.target.value })}
                      className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 pl-10 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-slate-900 dark:text-white dark:focus:border-blue-400"
                      required
                    >
                      {ADMIN_SCOPES.map((scope) => (
                        <option key={scope.value} value={scope.value}>
                          {scope.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Permissions */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-slate-900">
                  <h3 className="mb-3 text-sm font-medium text-gray-900 dark:text-white">Admin Permissions</h3>
                  <div className="space-y-3">
                    {ADMIN_PERMISSIONS.map((permission) => (
                      <label key={permission.key} className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData[permission.key as keyof FormData] as boolean}
                          onChange={(e) => setFormData({ ...formData, [permission.key]: e.target.checked })}
                          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-700 dark:bg-slate-900"
                        />
                        <div>
                          <span className="block text-sm font-medium text-gray-900 dark:text-white">
                            {permission.label}
                          </span>
                          <span className="block text-xs text-gray-500 dark:text-gray-400">
                            {permission.description}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
                  <h3 className="mb-2 text-sm font-medium text-blue-900 dark:text-blue-100">Summary</h3>
                  <div className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
                    <p><strong>Name:</strong> {formData.fullName}</p>
                    <p><strong>Email:</strong> {formData.email}</p>
                    <p><strong>Phone:</strong> {formData.phone}</p>
                    <p><strong>Department:</strong> {getDepartmentLabel(formData.department)}</p>
                    <p><strong>Designation:</strong> {getDesignationLabel(formData.designation)}</p>
                    <p><strong>Scope:</strong> {getScopeLabel(formData.adminScope)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-3">
              {currentStep > 0 && (
                <Button
                  type="button"
                  onClick={handleBack}
                  variant="outline"
                  className="flex-1 border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-slate-800"
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              )}
              
              {currentStep < steps.length - 1 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleCreateAccount}
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? 'Creating account...' : 'Create admin account'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="text-center gap-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Existing admin? <Link href="/secure/admin/login" className="ml-1 font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 cursor-pointer">Sign in here</Link>.
              </p>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Or go back to <Link href={ROUTES.login} className="ml-1 font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 cursor-pointer">main portal login</Link>.
              </p>
            </div>
          </div>

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
            <p>CCHT Admin Portal</p>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md p-6 shadow-xl">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Confirm Admin Account Creation
                </h3>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  You are about to create an admin account with the following details:
                </p>
                <div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm dark:bg-slate-900">
                  <p><strong>Name:</strong> {formData.fullName}</p>
                  <p><strong>Email:</strong> {formData.email}</p>
                  <p><strong>Phone:</strong> {formData.phone}</p>
                  <p><strong>Department:</strong> {getDepartmentLabel(formData.department)}</p>
                  <p><strong>Designation:</strong> {getDesignationLabel(formData.designation)}</p>
                  <p><strong>Scope:</strong> {getScopeLabel(formData.adminScope)}</p>
                </div>
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                  This action cannot be undone. Are you sure you want to proceed?
                </p>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <Button
                onClick={() => setShowConfirmModal(false)}
                variant="outline"
                className="flex-1 border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-slate-800"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Confirm & Create'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </main>
  )
}
