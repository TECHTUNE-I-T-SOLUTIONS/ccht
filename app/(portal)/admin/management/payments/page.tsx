'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Plus, Search, DollarSign, Calendar, User, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type StudentProfile = {
  profile_id: string
  student_number?: string
  matric_number?: string
  current_level?: string
  admission_status?: string
  profile?: {
    id: string
    first_name: string
    last_name: string
    email: string
  }
  enrollments?: Array<{
    id: string
    program: {
      title: string
      department: {
        name: string
      }
    }
    status: string
  }>
}

type Payment = {
  id: string
  student_id: string
  enrollment_id?: string
  invoice_id?: string
  amount: number
  currency: string
  payment_method?: string
  paystack_reference?: string
  status: 'pending' | 'success' | 'failed' | 'abandoned' | 'refunded'
  description?: string
  paid_at?: string
  created_at: string
  updated_at: string
  invoice?: {
    id: string
    session_id?: string
    session?: {
      id: string
      name: string
      is_current: boolean
    }
  }
  enrollment?: {
    id: string
    student_id: string
    session_id?: string
    program?: {
      title: string
      department?: {
        name: string
      }
    }
  }
}

type PaymentEvent = {
  id: string
  payment_id: string
  event_type: string
  description: string
  created_at: string
}

type AcademicSession = {
  id: string
  name: string
  is_current: boolean
}

export default function PaymentsManagementPage() {
  const supabase = createClient()
  const [students, setStudents] = useState<StudentProfile[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [sessions, setSessions] = useState<AcademicSession[]>([])
  const [selectedSession, setSelectedSession] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [manualPaymentDialogOpen, setManualPaymentDialogOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null)
  const [manualPaymentAmount, setManualPaymentAmount] = useState('')
  const [manualPaymentType, setManualPaymentType] = useState('')
  const [creatingPayment, setCreatingPayment] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      
      // Load sessions
      const { data: sessionsData } = await supabase
        .from('academic_sessions')
        .select('*')
        .order('created_at', { ascending: false })
      
      setSessions(sessionsData || [])
      
      // Only set current session as default on initial load
      if (isInitialLoad) {
        const currentSession = sessionsData?.find(s => s.is_current)
        setSelectedSession(currentSession?.id || sessionsData?.[0]?.id || 'all')
        setIsInitialLoad(false)
      }

      // Load all students with their profiles
      const { data: studentsData } = await supabase
        .from('student_profiles')
        .select(`
          profile_id,
          student_number,
          matric_number,
          current_level,
          admission_status,
          profile:profiles(id, first_name, last_name, email)
        `)
      
      // Load enrollments separately to avoid nested query issues
      const { data: enrollmentsData } = await supabase
        .from('enrollments')
        .select(`
          student_id,
          program:programs(title, department:departments(name)),
          status
        `)
      
      // Process students to get their most recent enrollment (active if available)
      const processedStudents = studentsData?.map(student => {
        const studentEnrollments = enrollmentsData?.filter(e => e.student_id === student.profile_id) || []
        const activeEnrollment = studentEnrollments.find(e => e.status === 'active')
        const mostRecentEnrollment = studentEnrollments[0] // Get most recent if no active
        
        return {
          ...student,
          enrollment: activeEnrollment || mostRecentEnrollment || null,
          enrollments: studentEnrollments
        }
      }) || []
      
      setStudents(processedStudents)

      // Load payments with invoice, session, and enrollment information
      const { data: paymentsData } = await supabase
        .from('payments')
        .select(`
          *,
          invoice:invoices(
            id,
            session_id,
            session:academic_sessions(id, name, is_current)
          ),
          enrollment:enrollments(
            id,
            student_id,
            session_id,
            program:programs(title, department:departments(name))
          )
        `)
        .order('created_at', { ascending: false })
      
      setPayments(paymentsData || [])
    } catch (error) {
      console.error('Failed to load data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [supabase, isInitialLoad])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Session filtering now works through the invoice table which contains session information

  const getStudentPayments = (studentId: string) => {
    return payments.filter(p => p.student_id === studentId)
  }

  const getSessionFilteredPayments = (studentId: string) => {
    const studentPayments = getStudentPayments(studentId)
    
    if (!selectedSession || selectedSession === 'all') return studentPayments
    
    // Filter by session through invoice
    return studentPayments.filter(p => 
      p.invoice?.session_id === selectedSession
    )
  }

  const getPaymentStatus = (studentId: string) => {
    const studentPayments = getSessionFilteredPayments(studentId)
    if (studentPayments.length === 0) return 'none'
    
    const hasSuccess = studentPayments.some(p => p.status === 'success')
    const hasPending = studentPayments.some(p => p.status === 'pending')
    
    if (hasSuccess) return 'completed'
    if (hasPending) return 'pending'
    return 'failed'
  }

  const getTotalPaid = (studentId: string) => {
    return getSessionFilteredPayments(studentId)
      .filter(p => p.status === 'success')
      .reduce((sum, p) => sum + Number(p.amount), 0)
  }

  const getFilteredStudents = () => {
    return students.filter(student => {
      const searchLower = searchQuery.toLowerCase()
      const fullName = `${student.profile?.first_name} ${student.profile?.last_name}`.toLowerCase()
      const matricNumber = student.matric_number.toLowerCase()
      const email = student.profile?.email?.toLowerCase() || ''
      
      const matchesSearch = fullName.includes(searchLower) || 
                           matricNumber.includes(searchLower) || 
                           email.includes(searchLower)
      
      const status = getPaymentStatus(student.id)
      const matchesStatus = paymentStatusFilter === 'all' || status === paymentStatusFilter
      
      return matchesSearch && matchesStatus
    })
  }

  const handleCreateManualPayment = async () => {
    if (!selectedStudent || !manualPaymentAmount || !manualPaymentType) {
      toast.error('Please fill in all required fields')
      return
    }

    if (!selectedSession || selectedSession === 'all') {
      toast.error('Please select a specific session to create a payment')
      return
    }

    try {
      setCreatingPayment(true)
      
      const sessionData = sessions.find(s => s.id === selectedSession)
      if (!sessionData) {
        toast.error('Please select a valid session')
        return
      }
      
      const paymentReference = `MANUAL-${Date.now()}-${selectedStudent.matric_number || selectedStudent.student_number}`
      
      // Get the student's enrollment for this session if available
      const { data: enrollmentData } = await supabase
        .from('enrollments')
        .select('*')
        .eq('student_id', selectedStudent.profile_id)
        .eq('session_id', sessionData.id)
        .single()
      
      const enrollmentId = enrollmentData?.id
      
      // First, create or find an invoice for this student and session
      const { data: existingInvoice } = await supabase
        .from('invoices')
        .select('*')
        .eq('student_id', selectedStudent.profile_id)
        .eq('session_id', sessionData.id)
        .single()
      
      let invoiceId: string
      
      if (existingInvoice) {
        invoiceId = existingInvoice.id
        // Update the invoice amount_paid
        await supabase
          .from('invoices')
          .update({
            amount_paid: Number(existingInvoice.amount_paid) + parseFloat(manualPaymentAmount),
            status: 'paid',
            updated_at: new Date().toISOString()
          })
          .eq('id', existingInvoice.id)
      } else {
        // Create a new invoice
        const { data: newInvoice } = await supabase
          .from('invoices')
          .insert({
            student_id: selectedStudent.profile_id,
            enrollment_id: enrollmentId,
            session_id: sessionData.id,
            invoice_number: `INV-${Date.now()}`,
            description: `${manualPaymentType} - ${sessionData.name}`,
            amount_due: parseFloat(manualPaymentAmount),
            amount_paid: parseFloat(manualPaymentAmount),
            currency: 'NGN',
            status: 'paid',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single()
        
        invoiceId = newInvoice.id
      }
      
      // Create the payment linked to the invoice and enrollment
      const { data: paymentData, error: paymentError } = await supabase
        .from('payments')
        .insert({
          student_id: selectedStudent.profile_id,
          enrollment_id: enrollmentId,
          invoice_id: invoiceId,
          amount: parseFloat(manualPaymentAmount),
          currency: 'NGN',
          payment_method: 'cash',
          paystack_reference: paymentReference,
          status: 'success',
          description: `${manualPaymentType} - ${sessionData.name}`,
          paid_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (paymentError) throw paymentError

      // Create payment event record with proper schema
      await supabase.from('payment_events').insert({
        payment_id: paymentData.id,
        invoice_id: invoiceId,
        event_type: 'manual_payment_created',
        provider: 'manual',
        provider_reference: paymentReference,
        payload: {
          amount: parseFloat(manualPaymentAmount),
          currency: 'NGN',
          payment_type: manualPaymentType,
          session: sessionData.name,
          session_id: sessionData.id,
          created_by: 'admin',
          manual_payment: true
        },
        processed: true,
        processed_at: new Date().toISOString()
      })

      toast.success('Manual payment created successfully')
      setManualPaymentDialogOpen(false)
      setSelectedStudent(null)
      setManualPaymentAmount('')
      setManualPaymentType('')
      
      // Reload payments data to reflect the new payment
      const { data: paymentsData } = await supabase
        .from('payments')
        .select(`
          *,
          invoice:invoices(
            id,
            session_id,
            session:academic_sessions(id, name, is_current)
          ),
          enrollment:enrollments(
            id,
            student_id,
            session_id,
            program:programs(title, department:departments(name))
          )
        `)
        .order('created_at', { ascending: false })
      setPayments(paymentsData || [])
    } catch (error) {
      console.error('Failed to create manual payment:', error)
      toast.error('Failed to create manual payment')
    } finally {
      setCreatingPayment(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            <CheckCircle className="h-3 w-3 mr-1" /> Paid
          </Badge>
        )
      case 'pending':
        return (
          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            <Clock className="h-3 w-3 mr-1" /> Pending
          </Badge>
        )
      case 'failed':
        return (
          <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
            <XCircle className="h-3 w-3 mr-1" /> Failed
          </Badge>
        )
      default:
        return (
          <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400">
            <AlertCircle className="h-3 w-3 mr-1" /> No Payments
          </Badge>
        )
    }
  }

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return (
          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            <CheckCircle className="h-3 w-3 mr-1" /> Success
          </Badge>
        )
      case 'pending':
        return (
          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            <Clock className="h-3 w-3 mr-1" /> Pending
          </Badge>
        )
      case 'failed':
        return (
          <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
            <XCircle className="h-3 w-3 mr-1" /> Failed
          </Badge>
        )
      case 'abandoned':
        return (
          <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400">
            <AlertCircle className="h-3 w-3 mr-1" /> Abandoned
          </Badge>
        )
      case 'refunded':
        return (
          <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
            <AlertCircle className="h-3 w-3 mr-1" /> Refunded
          </Badge>
        )
      default:
        return (
          <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400">
            {status}
          </Badge>
        )
    }
  }



  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Student Fee Payments</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage and track student school fee payments</p>
        </div>
      </div>

      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, matric number, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="w-full md:w-48">
            <Select value={selectedSession} onValueChange={setSelectedSession}>
              <SelectTrigger>
                <SelectValue placeholder="Select session" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem key="all" value="all">All Sessions</SelectItem>
                {sessions.map(session => (
                  <SelectItem key={session.id} value={session.id}>
                    {session.name} {session.is_current && '(Current)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full md:w-48">
            <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Payment status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem key="all" value="all">All Status</SelectItem>
                <SelectItem key="completed" value="completed">Paid</SelectItem>
                <SelectItem key="pending" value="pending">Pending</SelectItem>
                <SelectItem key="failed" value="failed">Failed</SelectItem>
                <SelectItem key="none" value="none">No Payments</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">All Students ({getFilteredStudents().length})</h2>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading payment data...</div>
        ) : getFilteredStudents().length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No students found matching your search.
          </div>
        ) : (
          <div className="space-y-4">
            {getFilteredStudents().map((student) => {
              const studentPayments = getSessionFilteredPayments(student.profile_id)
              const status = getPaymentStatus(student.profile_id)
              const totalPaid = getTotalPaid(student.profile_id)

              return (
                <Card key={student.profile_id} className="p-4 hover:border-primary/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          <User className="h-5 w-5 text-muted-foreground" />
                          <h3 className="font-semibold">
                            {student.profile?.first_name} {student.profile?.last_name}
                          </h3>
                        </div>
                        <div key={`status-${student.profile_id}`}>
                          {getStatusBadge(status)}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        <div key={`matric-${student.profile_id}`}>
                          <span className="text-muted-foreground">Matric Number:</span>
                          <span className="ml-2 font-medium">{student.matric_number || student.student_number || 'N/A'}</span>
                        </div>
                        <div key={`program-${student.profile_id}`}>
                          <span className="text-muted-foreground">Program:</span>
                          <span className="ml-2 font-medium">{student.enrollment?.program?.title || 'Not enrolled'}</span>
                        </div>
                        <div key={`department-${student.profile_id}`}>
                          <span className="text-muted-foreground">Department:</span>
                          <span className="ml-2 font-medium">{student.enrollment?.program?.department?.name || 'N/A'}</span>
                        </div>
                        <div key={`status-${student.profile_id}`}>
                          <span className="text-muted-foreground">Status:</span>
                          <span className="ml-2 font-medium capitalize">{student.admission_status || 'N/A'}</span>
                        </div>
                        <div key={`level-${student.profile_id}`}>
                          <span className="text-muted-foreground">Level:</span>
                          <span className="ml-2 font-medium">{student.current_level ? `${student.current_level}L` : 'N/A'}</span>
                        </div>
                        <div key={`total-${student.profile_id}`}>
                          <span className="text-muted-foreground">Total Paid:</span>
                          <span className="ml-2 font-medium text-emerald-600">
                            ₦{totalPaid.toLocaleString()}
                          </span>
                        </div>
                        <div key={`email-${student.profile_id}`}>
                          <span className="text-muted-foreground">Email:</span>
                          <span className="ml-2 font-medium">{student.profile?.email || 'N/A'}</span>
                        </div>
                      </div>

                      {studentPayments.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                          <h4 className="text-sm font-semibold mb-2">Payment History</h4>
                          <div className="space-y-2">
                            {studentPayments.map((payment) => (
                              <div key={payment.id || payment.paystack_reference} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded">
                                <div className="flex items-center gap-3">
                                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                                  <div>
                                    <div className="font-medium">₦{Number(payment.amount).toLocaleString()}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {payment.description || payment.payment_method || 'Payment'} • {payment.currency}
                                      {payment.invoice?.session && ` • ${payment.invoice.session.name}`}
                                      {payment.enrollment?.program && ` • ${payment.enrollment.program.title}`}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {getPaymentStatusBadge(payment.status)}
                                  {payment.paystack_reference?.startsWith('MANUAL-') && (
                                    <Badge variant="outline" className="text-xs">
                                      Manual
                                    </Badge>
                                  )}
                                  <div className="text-xs text-muted-foreground">
                                    {new Date(payment.created_at).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="ml-4">
                      <Dialog open={manualPaymentDialogOpen && selectedStudent?.profile_id === student.profile_id} onOpenChange={(open) => {
                        setManualPaymentDialogOpen(open)
                        if (!open) setSelectedStudent(null)
                      }}>
                        <DialogTrigger asChild>
                          <Button
                            key={`add-payment-${student.profile_id}`}
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedStudent(student)}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Payment
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="border-border bg-white text-foreground dark:bg-slate-950">
                          <DialogHeader>
                            <DialogTitle>Create Manual Payment</DialogTitle>
                            <DialogDescription>
                              Create a manual payment record for {selectedStudent?.profile?.first_name} {selectedStudent?.profile?.last_name}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div>
                              <Label htmlFor="amount">Amount (₦)</Label>
                              <Input
                                id="amount"
                                type="number"
                                placeholder="Enter amount"
                                value={manualPaymentAmount}
                                onChange={(e) => setManualPaymentAmount(e.target.value)}
                              />
                            </div>
                            <div>
                              <Label htmlFor="paymentType">Payment Type</Label>
                              <Select value={manualPaymentType} onValueChange={setManualPaymentType}>
                                <SelectTrigger id="paymentType">
                                  <SelectValue placeholder="Select payment type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem key="school_fees" value="school_fees">School Fees</SelectItem>
                                  <SelectItem key="acceptance_fee" value="acceptance_fee">Acceptance Fee</SelectItem>
                                  <SelectItem key="hostel_fees" value="hostel_fees">Hostel Fees</SelectItem>
                                  <SelectItem key="laboratory_fees" value="laboratory_fees">Laboratory Fees</SelectItem>
                                  <SelectItem key="library_fees" value="library_fees">Library Fees</SelectItem>
                                  <SelectItem key="other" value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setManualPaymentDialogOpen(false)
                                setSelectedStudent(null)
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={handleCreateManualPayment}
                              disabled={creatingPayment}
                            >
                              {creatingPayment ? 'Creating...' : 'Create Payment'}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
