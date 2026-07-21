'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CreditCard, Receipt, ShieldCheck, Coins, CalendarDays, Download, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { generatePaymentReceipt } from '@/lib/templates/payment-receipt'
import { createClient } from '@/lib/supabase/client'

type FeeStructure = {
  id: string
  session: string
  semester: string
  fee_type: string
  amount: number
  due_date: string
  description: string
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
}

export default function StudentFeesPage() {
  const [student, setStudent] = useState<any | null>(null)
  const [studentData, setStudentData] = useState<any | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([])
  const [loading, setLoading] = useState(true)
  const [initiating, setInitiating] = useState(false)
  const [selectedSession, setSelectedSession] = useState('2024/2025')
  const [selectedSemester, setSelectedSemester] = useState('all')
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [selectedFee, setSelectedFee] = useState<FeeStructure | null>(null)

  const sessions = ['2031/2032', '2030/2031', '2029/2030', '2028/2029', '2027/2028', '2026/2027', '2025/2026', '2024/2025', '2023/2024', '2022/2023']
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
        if (feeData.data.summary?.currentSession) {
          setSelectedSession(feeData.data.summary.currentSession)
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

      // Load Paystack inline JS dynamically
      const script = document.createElement('script')
      script.src = 'https://js.paystack.co/v1/inline.js'
      script.async = true
      script.onload = () => {
        const paystack = (window as any).PaystackPop
        paystack.setup({
          key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
          email: student.email,
          amount: fee.amount * 100, // Convert to kobo
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
              body: JSON.stringify({ reference: response.reference }),
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

    const paymentDate = payment.paid_at ? new Date(payment.paid_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Pending'
    const createdDate = new Date(payment.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    
    const doc = generatePaymentReceipt({
      receiptId: payment.id,
      firstName: studentData.profiles?.first_name || '',
      lastName: studentData.profiles?.last_name || '',
      matricNumber: studentData.matric_number || '',
      program: studentData.program?.title || '',
      department: studentData.program?.department?.name || '',
      email: studentData.profiles?.email || '',
      phone: studentData.profiles?.phone || studentData.student_number || '',
      paymentType: payment.description || 'Fee Payment',
      amount: payment.amount,
      reference: payment.paystack_reference || 'N/A',
      description: payment.description,
      status: payment.status,
      paymentDate,
      requestDate: createdDate
    })

    doc.save(`Receipt_${payment.description?.replace(/\s+/g, '_')}_${payment.id}.pdf`)
    toast.success('Receipt downloaded')
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
                {sessions.map(session => (
                  <SelectItem key={session} value={session}>{session}</SelectItem>
                ))}
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
