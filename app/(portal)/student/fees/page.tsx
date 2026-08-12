'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CreditCard, Receipt, ShieldCheck, Coins, CalendarDays, Download, AlertCircle, BadgeCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { createClient } from '@/lib/supabase/client'

type FeeStructure = {
  id: string
  session: string
  session_id?: string
  semester: string
  fee_type: string
  amount: number
  due_date: string
  description: string
  program_id?: string
}

type Payment = {
  id: string
  amount: number
  description: string
  status: 'success' | 'pending' | 'failed'
  paystack_reference?: string
  paid_at?: string
  created_at: string
  fee_structure_id?: string
  payment_plan_type?: 'full' | 'installment_1' | 'installment_2'
  installment_number?: 1 | 2
  payment_plan_id?: string
  due_date?: string
}

type PaymentPlan = {
  id: string
  student_id: string
  total_amount: number
  amount_paid: number
  amount_remaining: number
  plan_type: 'full' | 'installment'
  first_installment_amount?: number
  first_installment_paid: boolean
  first_installment_paid_at?: string
  second_installment_amount?: number
  second_installment_paid: boolean
  second_installment_paid_at?: string
  second_installment_due_date?: string
  status: 'pending' | 'partial' | 'completed' | 'overdue'
  is_late: boolean
  created_at: string
  updated_at: string
}

export default function StudentFeesPage() {
  const [student, setStudent] = useState<any | null>(null)
  const [studentData, setStudentData] = useState<any | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([])
  const [paymentPlans, setPaymentPlans] = useState<PaymentPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [initiating, setInitiating] = useState(false)
  const [selectedSession, setSelectedSession] = useState('')
  const [selectedSessionId, setSelectedSessionId] = useState('')
  const [selectedSemester, setSelectedSemester] = useState('all')
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [selectedFee, setSelectedFee] = useState<FeeStructure | null>(null)
  const [availableSessions, setAvailableSessions] = useState<string[]>([])
  const [showPaymentPlanDialog, setShowPaymentPlanDialog] = useState(false)
  const [selectedPaymentPlan, setSelectedPaymentPlan] = useState<PaymentPlan | null>(null)
  const [creatingPaymentPlan, setCreatingPaymentPlan] = useState(false)

  const semesters = ['all', 'first', 'second']

  const loadPaymentData = async () => {
    try {
      const [meRes, feesRes] = await Promise.all([
        fetch('/api/v1/auth/me'),
        fetch('/api/v1/student/fees'),
      ])
      const me = await meRes.json().catch(() => null)
      const feeData = await feesRes.json().catch(() => null)
      setStudent(me?.user || null)
      
      // Fetch student profile and enrollment data for receipt generation
      const supabase = createClient()
      const [profile, studentProfile, enrollment] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', me?.user?.id).single(),
        supabase.from('student_profiles').select('*').eq('profile_id', me?.user?.id).single(),
        supabase.from('enrollments').select('*, program:programs(title, department:departments(name))').eq('student_id', me?.user?.id).eq('status', 'active').single()
      ])

      if (profile.data && studentProfile.data) {
        setStudentData({
          profiles: profile.data,
          ...studentProfile.data,
          program: enrollment.data?.program || null
        })
      }
      
      if (feeData?.data) {
        setFeeStructures(feeData.data.fees || [])
        setPayments(feeData.data.payments || [])
        setPaymentPlans(feeData.data.paymentPlans || [])
        
        // Extract unique sessions from fees
        const uniqueSessions = Array.from(new Set(feeData.data.fees?.map((f: FeeStructure) => f.session) || [])) as string[]
        setAvailableSessions(uniqueSessions)
        
        // Set default session to current session from API or first available
        if (feeData.data.summary?.currentSession) {
          setSelectedSession(feeData.data.summary.currentSession)
          const matchedFee = feeData.data.fees?.find((f: FeeStructure) => f.session === feeData.data.summary.currentSession)
          setSelectedSessionId(matchedFee?.session_id || feeData.data.fees?.[0]?.session_id || '')
        } else if (uniqueSessions.length > 0) {
          setSelectedSession(uniqueSessions[0] as string)
          const matchedFee = feeData.data.fees?.find((f: FeeStructure) => f.session === uniqueSessions[0])
          setSelectedSessionId(matchedFee?.session_id || feeData.data.fees?.[0]?.session_id || '')
        }
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPaymentData()
  }, [])

  const filteredFees = feeStructures.filter(fee => {
    const sessionMatch = fee.session === selectedSession
    const semesterMatch = selectedSemester === 'all' || fee.semester === selectedSemester
    return sessionMatch && semesterMatch
  })

  const filteredPayments = payments.filter(payment => {
    const sessionMatch = payment.description?.includes(selectedSession)
    const semesterMatch = selectedSemester === 'all' || payment.description?.toLowerCase().includes(selectedSemester)
    return sessionMatch && semesterMatch
  })

  const totalFees = filteredFees.reduce((sum, fee) => sum + fee.amount, 0)
  const paidAmount = filteredPayments
    .filter(p => p.status === 'success')
    .reduce((sum, p) => sum + p.amount, 0)
  const remainingBalance = Math.max(0, totalFees - paidAmount)
  const paymentStatus = remainingBalance === 0 ? 'fully_paid' : paidAmount > 0 ? 'partially_paid' : 'unpaid'

  // Get active payment plan for current session
  const activePaymentPlan = paymentPlans.find(plan => 
    plan.status !== 'completed' && 
    (selectedSessionId ? plan.session_id === selectedSessionId : true)
  ) || null

  const canCreatePaymentPlan = !activePaymentPlan && remainingBalance > 0
  const firstInstallmentAmount = activePaymentPlan?.first_installment_amount || Math.round(totalFees * 0.6)
  const secondInstallmentAmount = activePaymentPlan?.second_installment_amount || Math.round(totalFees * 0.4)

  const initiatePayment = async (fee: FeeStructure) => {
    if (!student) return
    setInitiating(true)
    try {
      const response = await fetch('/api/v1/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: fee.amount,
          email: student.email,
          studentId: student.id,
          description: `${fee.fee_type} - ${fee.session} ${fee.semester} Semester`,
        }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Failed to initiate payment')
      const paymentId = payload.paymentId || payload.data?.paymentId || payload.data?.id || payload.data?.payment_id

      if (payload.authorizationUrl) {
        // Prefer the authorization URL only if the popup SDK is unavailable.
      }

      const script = document.createElement('script')
      script.src = 'https://js.paystack.co/v1/inline.js'
      script.async = true
      script.onload = () => {
        const paystack = (window as any).PaystackPop
        if (!paystack?.setup) {
          toast.error('Payment gateway is unavailable')
          setInitiating(false)
          return
        }

        paystack.setup({
          key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
          email: student.email,
          amount: fee.amount * 100,
          ref: payload.reference,
          onClose: function () {
            toast.info('Payment closed')
            setInitiating(false)
          },
          callback: function (response: any) {
            fetch('/api/v1/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ reference: response.reference, paymentId }),
            }).then(async (verifyRes) => {
              const verifyData = await verifyRes.json()
              if (verifyRes.ok && verifyData.success) {
                toast.success('Payment successful!')
                await loadPaymentData()
              } else {
                toast.error('Payment verification failed')
              }
              setInitiating(false)
            }).catch(() => {
              toast.error('Payment verification error')
              setInitiating(false)
            })
          },
        }).openIframe()
      }
      script.onerror = () => {
        toast.error('Failed to load payment gateway')
        setInitiating(false)
      }
      document.body.appendChild(script)
    } catch (err: any) {
      toast.error(err.message)
      setInitiating(false)
    }
  }

  const createPaymentPlan = async (planType: 'full' | 'installment') => {
    if (!student) return
    setCreatingPaymentPlan(true)
    try {
      const response = await fetch('/api/v1/student/payment-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalAmount: totalFees,
          planType,
          enrollmentId: studentData?.enrollment_id,
          sessionId: selectedSessionId || undefined,
        }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Failed to create payment plan')

      toast.success('Payment plan created successfully!')
      await loadPaymentData()
      setShowPaymentPlanDialog(false)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setCreatingPaymentPlan(false)
    }
  }

  const initiateInstallmentPayment = async (installmentNumber: 1 | 2) => {
    if (!student || !activePaymentPlan) return
    setInitiating(true)
    try {
      const amount = installmentNumber === 1 
        ? activePaymentPlan.first_installment_amount 
        : activePaymentPlan.second_installment_amount

      const response = await fetch('/api/v1/student/payment-plans/initiate-installment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentPlanId: activePaymentPlan.id,
          installmentNumber,
          email: student.email,
          enrollmentId: studentData?.enrollment_id,
          description: `Installment ${installmentNumber} - ${selectedSession}`,
        }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Failed to initiate payment')
      const paymentId = payload.paymentId || payload.data?.paymentId || payload.data?.id || payload.data?.payment_id

      // Load Paystack inline JS dynamically
      const script = document.createElement('script')
      script.src = 'https://js.paystack.co/v1/inline.js'
      script.async = true
      script.onload = () => {
        const paystack = (window as any).PaystackPop
        paystack.setup({
          key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
          email: student.email,
          amount: amount * 100, // Convert to kobo
          ref: payload.reference,
          onClose: function() {
            toast.info('Payment closed')
            setInitiating(false)
          },
          callback: function(response: any) {
            // Verify payment
            fetch('/api/v1/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ reference: response.reference, paymentId }),
            }).then(async (verifyRes) => {
              const verifyData = await verifyRes.json()
              if (verifyRes.ok && verifyData.success) {
                toast.success('Payment successful!')
                await loadPaymentData()
              } else {
                toast.error('Payment verification failed')
              }
              setInitiating(false)
            }).catch(() => {
              toast.error('Payment verification error')
              setInitiating(false)
            })
          },
        }).openIframe()
      }
      script.onerror = () => {
        toast.error('Failed to load payment gateway')
        setInitiating(false)
      }
      document.body.appendChild(script)
    } catch (err: any) {
      toast.error(err.message)
      setInitiating(false)
    }
  }

  const reverifyPayment = async (paymentId: string, reference: string) => {
    try {
      const response = await fetch('/api/v1/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference }),
      })
      const data = await response.json()
      
      if (response.ok && data.success) {
        toast.success('Payment verified successfully!')
        await loadPaymentData()
      } else {
        toast.error(data.error || 'Payment verification failed')
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to reverify payment')
    }
  }

  const downloadReceipt = (payment: Payment) => {
    if (!studentData) {
      toast.error('Student data not loaded')
      return
    }

    toast.loading('Generating receipt...', { id: 'receipt-download' })
    fetch('/api/v1/student/receipts/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentId: payment.id, source: 'fees' }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const errorData = await res.json().catch(() => null)
          throw new Error(errorData?.error || 'Failed to generate receipt')
        }

        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `Receipt_${payment.description?.replace(/\s+/g, '_')}_${payment.id}.pdf`
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)
        toast.success('Receipt downloaded', { id: 'receipt-download' })
      })
      .catch((error) => {
        console.error('Failed to generate receipt:', error)
        toast.error(error.message || 'Failed to generate receipt', { id: 'receipt-download' })
      })
  }

  const handlePaymentClick = (fee: FeeStructure) => {
    setSelectedFee(fee)
    setPaymentDialogOpen(true)
  }

  const confirmPayment = () => {
    if (selectedFee) {
      setPaymentDialogOpen(false)
      initiatePayment(selectedFee)
    }
  }

  if (loading) return <div className="p-8 font-technical">Loading accounts and fee status...</div>

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-border bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.12),transparent_30%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--accent-soft)))] p-6 md:p-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Student Finances</p>
            <h1 className="mt-2 text-3xl font-extrabold md:text-5xl">School Fees & Payments</h1>
            <p className="mt-1 text-sm text-foreground/75">View fees by session/semester and make secure payments</p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-white dark:bg-primary/10 p-4 shadow-sm">
            <Coins className="h-10 w-10 text-primary" />
            <div>
              <span className="block text-[8px] font-technical uppercase font-bold text-muted-foreground">Outstanding Balance</span>
              <span className="text-2xl font-black font-technical text-primary">₦{remainingBalance.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Session:</span>
            <Select value={selectedSession} onValueChange={setSelectedSession}>
              <SelectTrigger className="w-[140px] rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableSessions.length === 0 ? (
                  <SelectItem value="none" disabled>No sessions available</SelectItem>
                ) : (
                  availableSessions.map(session => (
                    <SelectItem key={session} value={session}>{session}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Semester:</span>
            <Select value={selectedSemester} onValueChange={setSelectedSemester}>
              <SelectTrigger className="w-[140px] rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Semesters</SelectItem>
                <SelectItem value="first">First Semester</SelectItem>
                <SelectItem value="second">Second Semester</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Fee Summary */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-2xl bg-primary/10 p-3 text-primary">
              <CreditCard className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold">Fee Summary</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <span className="text-sm text-muted-foreground">Total Fees</span>
              <span className="font-bold">₦{totalFees.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <span className="text-sm text-muted-foreground">Paid</span>
              <span className="font-bold text-emerald-600">₦{paidAmount.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <span className="text-sm text-muted-foreground">Balance</span>
              <span className="font-bold text-primary">₦{remainingBalance.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <span className="text-sm text-muted-foreground">Status</span>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                paymentStatus === 'fully_paid' 
                  ? 'bg-emerald-500/10 text-emerald-600' 
                  : paymentStatus === 'partially_paid'
                  ? 'bg-amber-500/10 text-amber-600'
                  : 'bg-red-500/10 text-red-600'
              }`}>
                {paymentStatus === 'fully_paid' ? 'Fully Paid' : paymentStatus === 'partially_paid' ? 'Partially Paid' : 'Unpaid'}
              </span>
            </div>
          </div>
        </Card>

        {/* Payment Plan Options */}
        {canCreatePaymentPlan && (
          <Card className="p-6 lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-bold">Payment Plan Options</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-lg">Full Payment</h3>
                  <span className="text-sm font-bold text-primary">₦{totalFees.toLocaleString()}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">Pay the full amount at once</p>
                <Button 
                  onClick={() => createPaymentPlan('full')}
                  disabled={creatingPaymentPlan}
                  className="w-full"
                >
                  {creatingPaymentPlan ? 'Creating...' : 'Pay Full Amount'}
                </Button>
              </div>
              <div className="rounded-xl border-2 border-amber-500/20 bg-amber-500/5 p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-lg">Installment Plan</h3>
                  <span className="text-sm font-bold text-amber-600">60% + 40%</span>
                </div>
                <div className="space-y-2 mb-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">First (60%):</span>
                    <span className="font-semibold">₦{firstInstallmentAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Second (40%):</span>
                    <span className="font-semibold">₦{secondInstallmentAmount.toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Second payment due within 1 month</p>
                </div>
                <Button 
                  onClick={() => createPaymentPlan('installment')}
                  disabled={creatingPaymentPlan}
                  variant="outline"
                  className="w-full border-amber-500 text-amber-600 hover:bg-amber-500/10"
                >
                  {creatingPaymentPlan ? 'Creating...' : 'Choose Installment Plan'}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Active Payment Plan */}
        {activePaymentPlan && (
          <Card className="p-6 lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                <CalendarDays className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-bold">Active Payment Plan</h2>
              <span className={`ml-auto rounded-full px-3 py-1 text-xs font-semibold ${
                activePaymentPlan.status === 'completed' 
                  ? 'bg-emerald-500/10 text-emerald-600' 
                  : activePaymentPlan.status === 'partial'
                  ? 'bg-amber-500/10 text-amber-600'
                  : 'bg-blue-500/10 text-blue-600'
              }`}>
                {activePaymentPlan.status === 'completed' ? 'Completed' : activePaymentPlan.status === 'partial' ? 'In Progress' : 'Pending'}
              </span>
            </div>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className={`rounded-xl p-4 border-2 ${
                  activePaymentPlan.first_installment_paid 
                    ? 'border-emerald-500/30 bg-emerald-500/5' 
                    : 'border-primary/20 bg-primary/5'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold">First Installment (60%)</h3>
                    {activePaymentPlan.first_installment_paid && (
                      <BadgeCheck className="h-5 w-5 text-emerald-600" />
                    )}
                  </div>
                  <div className="text-2xl font-bold mb-2">₦{activePaymentPlan.first_installment_amount?.toLocaleString() || 0}</div>
                  {activePaymentPlan.first_installment_paid ? (
                    <p className="text-sm text-emerald-600">
                      Paid on {new Date(activePaymentPlan.first_installment_paid_at || '').toLocaleDateString()}
                    </p>
                  ) : (
                    <Button 
                      onClick={() => initiateInstallmentPayment(1)}
                      disabled={initiating}
                      className="w-full"
                    >
                      {initiating ? 'Processing...' : 'Pay First Installment'}
                    </Button>
                  )}
                </div>
                <div className={`rounded-xl p-4 border-2 bg-white dark:bg-black ${
                  activePaymentPlan.second_installment_paid 
                    ? 'border-emerald-500/30 bg-emerald-500/5' 
                    : !activePaymentPlan.first_installment_paid
                    ? 'border-slate-200 bg-slate-50 opacity-50'
                    : 'border-amber-500/20 bg-amber-500/5'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold">Second Installment (40%)</h3>
                    {activePaymentPlan.second_installment_paid && (
                      <BadgeCheck className="h-5 w-5 text-emerald-600" />
                    )}
                  </div>
                  <div className="text-2xl font-bold mb-2">₦{activePaymentPlan.second_installment_amount?.toLocaleString() || 0}</div>
                  {activePaymentPlan.second_installment_paid ? (
                    <p className="text-sm text-emerald-600">
                      Paid on {new Date(activePaymentPlan.second_installment_paid_at || '').toLocaleDateString()}
                    </p>
                  ) : !activePaymentPlan.first_installment_paid ? (
                    <p className="text-sm text-muted-foreground">Available after first installment</p>
                  ) : (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">
                        Due: {activePaymentPlan.second_installment_due_date 
                          ? new Date(activePaymentPlan.second_installment_due_date).toLocaleDateString()
                          : 'Within 1 month of first payment'}
                      </p>
                      <Button 
                        onClick={() => initiateInstallmentPayment(2)}
                        disabled={initiating}
                        variant="outline"
                        className="w-full border-amber-500 text-amber-600 hover:bg-amber-500/10"
                      >
                        {initiating ? 'Processing...' : 'Pay Second Installment'}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-sm text-muted-foreground">Total Paid</span>
                <span className="font-bold text-emerald-600">₦{activePaymentPlan.amount_paid.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <span className="text-sm text-muted-foreground">Remaining Balance</span>
                <span className="font-bold text-primary">₦{activePaymentPlan.amount_remaining.toLocaleString()}</span>
              </div>
            </div>
          </Card>
        )}

        {/* Fee Breakdown */}
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-2xl bg-primary/10 p-3 text-primary">
              <Receipt className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold">Fee Breakdown</h2>
          </div>
          {filteredFees.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <AlertCircle className="mx-auto mb-4 h-12 w-12 opacity-50" />
              <p>No fee structure found for selected session/semester</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFees.map((fee) => {
                // Match payment by description, amount, and session since fee_structure_id doesn't exist
                const isPaid = payments.some(p => 
                  p.status === 'success' && (
                    (p.description?.includes(fee.fee_type) && p.amount === fee.amount) ||
                    (p.description?.includes(fee.session) && p.amount === fee.amount)
                  )
                )
                console.log('Fee:', fee.fee_type, 'ID:', fee.id, 'isPaid:', isPaid, 'Payments:', payments.filter(p => p.status === 'success').map(p => ({ desc: p.description, amount: p.amount })))
                return (
                  <div key={fee.id} className="flex items-center justify-between p-4 rounded-xl border bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex-1">
                      <p className="font-semibold">{fee.fee_type}</p>
                      <p className="text-xs text-muted-foreground">{fee.session} · {fee.semester} Semester</p>
                      <p className="text-xs text-muted-foreground">Due: {new Date(fee.due_date).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-bold">₦{fee.amount.toLocaleString()}</p>
                        {isPaid ? (
                          <span className="text-xs text-emerald-600 font-semibold">Paid</span>
                        ) : (
                          <span className="text-xs text-red-600 font-semibold">Unpaid</span>
                        )}
                      </div>
                      {!isPaid && (
                        <Button 
                          size="sm" 
                          onClick={() => handlePaymentClick(fee)}
                          disabled={initiating}
                          className="rounded-xl border border-primary hover:text-blue-600"
                        >
                          Pay
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Payment History */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-2xl bg-primary/10 p-3 text-primary">
            <Receipt className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-bold">Payment History</h2>
        </div>
        {filteredPayments.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Receipt className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p>No payment history found for selected session/semester</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPayments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-4 rounded-xl border bg-slate-50 dark:bg-slate-800/50">
                <div className="flex-1">
                  <p className="font-semibold">{payment.description}</p>
                  <p className="text-xs text-muted-foreground">
                    Ref: {payment.paystack_reference || 'N/A'} · {payment.paid_at ? new Date(payment.paid_at).toLocaleDateString() : 'Pending'}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-bold">₦{payment.amount.toLocaleString()}</p>
                    <span className={`text-xs font-semibold capitalize ${
                      payment.status === 'success' 
                        ? 'text-emerald-600' 
                        : payment.status === 'pending'
                        ? 'text-amber-600'
                        : 'text-red-600'
                    }`}>
                      {payment.status}
                    </span>
                  </div>
                  {payment.status === 'success' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadReceipt(payment)}
                      className="rounded-xl border border-primary hover:text-blue-600"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Receipt
                    </Button>
                  )}
                  {payment.status === 'pending' && payment.paystack_reference && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => payment.paystack_reference && reverifyPayment(payment.id, payment.paystack_reference)}
                      className="rounded-xl border border-primary hover:text-blue-600"
                    >
                      Reverify
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Payment Confirmation Dialog */}
      <AlertDialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <AlertDialogContent className="border-border bg-white text-foreground dark:bg-slate-950">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Payment</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to pay ₦{selectedFee?.amount.toLocaleString()} for {selectedFee?.fee_type}. 
              This will redirect you to the payment gateway.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmPayment}
              disabled={initiating}
              className="bg-primary hover:bg-primary/90"
            >
              {initiating ? 'Processing...' : 'Proceed to Payment'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
