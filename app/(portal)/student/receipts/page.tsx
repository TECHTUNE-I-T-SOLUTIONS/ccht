'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Download, DollarSign, Calendar, CheckCircle, Clock, XCircle, User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { generatePaymentReceipt } from '@/lib/templates/payment-receipt'

type Payment = {
  id: string
  amount: number
  payment_type: string
  status: string
  reference: string
  description: string
  created_at: string
  paid_at: string | null
  table_source: string
}

export default function StudentReceiptsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [studentData, setStudentData] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    loadPayments()
  }, [])

  const loadPayments = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch student profile and enrollment data
      const [profileRes, studentProfileRes, enrollmentRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('student_profiles').select('*').eq('profile_id', user.id).single(),
        supabase.from('enrollments').select('*, program:programs(title, department:departments(name))').eq('student_id', user.id).eq('status', 'active').single()
      ])

      if (profileRes.data && studentProfileRes.data) {
        setStudentData({
          profiles: profileRes.data,
          ...studentProfileRes.data,
          program: enrollmentRes.data?.program || null
        })
      }

      // Fetch payments from all tables
      const [admissionRes, applicationRes, paymentsRes] = await Promise.all([
        supabase
          .from('aspirant_admission_payment')
          .select('*')
          .eq('profile_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('aspirant_application_payment')
          .select('*')
          .eq('profile_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('payments')
          .select('*')
          .eq('student_id', user.id)
          .order('created_at', { ascending: false })
      ])

      const allPayments: Payment[] = []

      // Process aspirant_admission_payment
      if (admissionRes.data) {
        admissionRes.data.forEach((p: any) => {
          allPayments.push({
            id: p.id,
            amount: p.amount || 0,
            payment_type: 'admission_fee',
            status: p.payment_status || p.status || 'pending',
            reference: p.payment_reference || p.reference || 'N/A',
            description: 'Admission Fee Payment',
            created_at: p.created_at,
            paid_at: p.paid_at,
            table_source: 'aspirant_admission_payment'
          })
        })
      }

      // Process aspirant_application_payment
      if (applicationRes.data) {
        applicationRes.data.forEach((p: any) => {
          allPayments.push({
            id: p.id,
            amount: p.amount || 0,
            payment_type: 'application_fee',
            status: p.payment_status || p.status || 'pending',
            reference: p.payment_reference || p.reference || 'N/A',
            description: 'Application Fee Payment',
            created_at: p.created_at,
            paid_at: p.paid_at,
            table_source: 'aspirant_application_payment'
          })
        })
      }

      // Process payments table
      if (paymentsRes.data) {
        paymentsRes.data.forEach((p: any) => {
          allPayments.push({
            id: p.id,
            amount: p.amount || 0,
            payment_type: p.payment_type || 'fee',
            status: p.status || 'pending',
            reference: p.reference || 'N/A',
            description: p.description || 'Payment',
            created_at: p.created_at,
            paid_at: p.paid_at,
            table_source: 'payments'
          })
        })
      }

      // Sort by created_at
      allPayments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      setPayments(allPayments)
    } catch (error) {
      console.error('Failed to load payments:', error)
      toast.error('Failed to load payments')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
      case 'paid':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'failed':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
      case 'paid':
        return <CheckCircle className="h-4 w-4" />
      case 'pending':
        return <Clock className="h-4 w-4" />
      case 'failed':
        return <XCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const downloadReceipt = (payment: Payment) => {
    if (!studentData) {
      toast.error('Student data not loaded')
      return
    }

    const paymentDate = payment.paid_at ? new Date(payment.paid_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Pending'
    const createdDate = new Date(payment.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    
    const content = generatePaymentReceipt({
      receiptId: payment.id,
      firstName: studentData.profiles?.first_name || '',
      lastName: studentData.profiles?.last_name || '',
      matricNumber: studentData.matric_number || '',
      program: studentData.program?.title || '',
      department: studentData.program?.department?.name || '',
      email: studentData.profiles?.email || '',
      phone: studentData.profiles?.phone || studentData.student_number || '',
      paymentType: payment.payment_type,
      amount: payment.amount,
      reference: payment.reference,
      description: payment.description,
      status: payment.status,
      paymentDate,
      requestDate: createdDate
    })

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Receipt_${payment.payment_type}_${payment.id}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Receipt downloaded')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-sm text-muted-foreground">Loading receipts...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[2.5rem] border border-border bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.12),transparent_30%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--accent-soft)))] p-6 md:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Student Portal</p>
        <h1 className="mt-3 text-3xl font-extrabold">Payment Receipts</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-foreground/70">
          View and download your payment receipts for application fees, admission fees, and other payments.
        </p>
      </div>

      {studentData && (
        <Card className="rounded-[2rem] border bg-white p-6 shadow-sm dark:bg-slate-900">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-primary/10 p-4 text-primary">
              <User className="h-8 w-8" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold">Student Information</h3>
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Name</p>
                  <p className="font-semibold">{studentData.profiles?.first_name} {studentData.profiles?.last_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Matric Number</p>
                  <p className="font-semibold">{studentData.matric_number}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Program</p>
                  <p className="font-semibold">{studentData.program?.title}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Department</p>
                  <p className="font-semibold">{studentData.program?.department?.name}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      <Card className="rounded-[2rem] border bg-white p-6 shadow-sm dark:bg-slate-900">
        <h3 className="text-xl font-bold mb-4">Payment History</h3>
        {payments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No payment records found.
          </div>
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => (
              <Card key={payment.id} className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="rounded-xl bg-primary/10 p-3 text-primary">
                      <DollarSign className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold capitalize">{payment.payment_type.replace('_', ' ')}</p>
                        <Badge className={getStatusColor(payment.status)}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(payment.status)}
                            {payment.status}
                          </span>
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{payment.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(payment.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          <span className="font-mono">{payment.reference}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xl font-bold">₦{payment.amount.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{payment.table_source}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl"
                      onClick={() => downloadReceipt(payment)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Receipt
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
