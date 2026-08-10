'use client'

import { useEffect, useState } from 'react'
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
  id: string
  profile_id: string
  matric_number: string
  current_level: string
  profile?: {
    first_name: string
    last_name: string
    email: string
  }
  enrollment?: {
    program: {
      title: string
      department: {
        name: string
      }
    }
    status: string
  }
}

type Payment = {
  id: string
  student_id: string
  amount: number
  payment_type: string
  session: string
  semester?: string
  status: 'pending' | 'completed' | 'failed'
  payment_reference: string
  is_manual: boolean
  created_at: string
  updated_at: string
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
  const [selectedSession, setSelectedSession] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [manualPaymentDialogOpen, setManualPaymentDialogOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null)
  const [manualPaymentAmount, setManualPaymentAmount] = useState('')
  const [manualPaymentType, setManualPaymentType] = useState('')
  const [manualPaymentSemester, setManualPaymentSemester] = useState('')
  const [creatingPayment, setCreatingPayment] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load sessions
      const { data: sessionsData } = await supabase
        .from('academic_sessions')
        .select('*')
        .order('created_at', { ascending: false })
      
      setSessions(sessionsData || [])
      
      // Set current session as default
      const currentSession = sessionsData?.find(s => s.is_current)
      setSelectedSession(currentSession?.id || sessionsData?.[0]?.id || '')

      // Load students with their profiles and enrollments
      const { data: studentsData } = await supabase
        .from('student_profiles')
        .select(`
          *,
          profile:profiles(first_name, last_name, email),
          enrollments(
            program:programs(title, department:departments(name)),
            status
          )
        `)
      
      // Filter students to only include those with active enrollments
      const studentsWithActiveEnrollments = studentsData?.map(student => {
        const activeEnrollment = student.enrollments?.find(e => e.status === 'active')
        return {
          ...student,
          enrollment: activeEnrollment
        }
      }).filter(student => student.enrollment) || []
      
      setStudents(studentsWithActiveEnrollments)

      // Load payments
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false })
      
      setPayments(paymentsData || [])
    } catch (error) {
      console.error('Failed to load data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const getStudentPayments = (studentId: string) => {
    const selectedSessionName = sessions.find(s => s.id === selectedSession)?.name
    return payments.filter(p => 
      p.student_id === studentId && 
      (selectedSessionName ? p.session === selectedSessionName : true)
    )
  }

  const getPaymentStatus = (studentId: string) => {
    const studentPayments = getStudentPayments(studentId)
    if (studentPayments.length === 0) return 'none'
    
    const hasCompleted = studentPayments.some(p => p.status === 'completed')
    const hasPending = studentPayments.some(p => p.status === 'pending')
    
    if (hasCompleted) return 'completed'
    if (hasPending) return 'pending'
    return 'failed'
  }

  const getTotalPaid = (studentId: string) => {
    return getStudentPayments(studentId)
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0)
  }

  const getFilteredStudents = () => {
    return students.filter(student => {
      const searchLower = searchQuery.toLowerCase()
      const fullName = `${student.profile?.first_name} ${student.profile?.last_name}`.toLowerCase()
      const matricNumber = student.matric_number.toLowerCase()
      const email = student.profile?.email?.toLowerCase() || ''
      
      return fullName.includes(searchLower) || 
             matricNumber.includes(searchLower) || 
             email.includes(searchLower)
    })
  }

  const handleCreateManualPayment = async () => {
    if (!selectedStudent || !manualPaymentAmount || !manualPaymentType) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      setCreatingPayment(true)
      
      const sessionData = sessions.find(s => s.id === selectedSession)
      if (!sessionData) {
        toast.error('Please select a valid session')
        return
      }
      
      const paymentReference = `MANUAL-${Date.now()}-${selectedStudent.matric_number}`
      
      const { data: paymentData, error: paymentError } = await supabase
        .from('payments')
        .insert({
          student_id: selectedStudent.id,
          amount: parseFloat(manualPaymentAmount),
          payment_type: manualPaymentType,
          session: sessionData?.name || '',
          semester: manualPaymentSemester || null,
          status: 'completed',
          payment_reference: paymentReference,
          is_manual: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (paymentError) throw paymentError

      // Create payment event
      await supabase.from('payment_events').insert({
        payment_id: paymentData.id,
        event_type: 'manual_payment_created',
        description: `Manual payment created by admin for ${manualPaymentType}`,
        created_at: new Date().toISOString()
      })

      toast.success('Manual payment created successfully')
      setManualPaymentDialogOpen(false)
      setSelectedStudent(null)
      setManualPaymentAmount('')
      setManualPaymentType('')
      setManualPaymentSemester('')
      
      // Reload payments
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('*')
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

  const getSessionName = (sessionNameOrId: string) => {
    // First try to find by ID
    const session = sessions.find(s => s.id === sessionNameOrId)
    if (session) return session.name
    
    // If not found, assume it's already a session name
    return sessionNameOrId || 'Unknown Session'
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
                {sessions.map(session => (
                  <SelectItem key={session.id} value={session.id}>
                    {session.name} {session.is_current && '(Current)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
              const studentPayments = getStudentPayments(student.id)
              const status = getPaymentStatus(student.id)
              const totalPaid = getTotalPaid(student.id)

              return (
                <Card key={student.id} className="p-4 hover:border-primary/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          <User className="h-5 w-5 text-muted-foreground" />
                          <h3 className="font-semibold">
                            {student.profile?.first_name} {student.profile?.last_name}
                          </h3>
                        </div>
                        {getStatusBadge(status)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Matric Number:</span>
                          <span className="ml-2 font-medium">{student.matric_number}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Program:</span>
                          <span className="ml-2 font-medium">{student.enrollment?.program?.title || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Department:</span>
                          <span className="ml-2 font-medium">{student.enrollment?.program?.department?.name || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Level:</span>
                          <span className="ml-2 font-medium">{student.current_level}L</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Total Paid:</span>
                          <span className="ml-2 font-medium text-emerald-600">
                            ₦{totalPaid.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Email:</span>
                          <span className="ml-2 font-medium">{student.profile?.email || 'N/A'}</span>
                        </div>
                      </div>

                      {studentPayments.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                          <h4 className="text-sm font-semibold mb-2">Payment History</h4>
                          <div className="space-y-2">
                            {studentPayments.map((payment) => (
                              <div key={payment.id} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded">
                                <div className="flex items-center gap-3">
                                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                                  <div>
                                    <div className="font-medium">₦{payment.amount.toLocaleString()}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {payment.payment_type} • {getSessionName(payment.session)}
                                      {payment.semester && ` • ${payment.semester}`}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {payment.is_manual && (
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
                      <Dialog open={manualPaymentDialogOpen && selectedStudent?.id === student.id} onOpenChange={(open) => {
                        setManualPaymentDialogOpen(open)
                        if (!open) setSelectedStudent(null)
                      }}>
                        <DialogTrigger asChild>
                          <Button
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
                                  <SelectItem value="school_fees">School Fees</SelectItem>
                                  <SelectItem value="acceptance_fee">Acceptance Fee</SelectItem>
                                  <SelectItem value="hostel_fees">Hostel Fees</SelectItem>
                                  <SelectItem value="laboratory_fees">Laboratory Fees</SelectItem>
                                  <SelectItem value="library_fees">Library Fees</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="semester">Semester (Optional)</Label>
                              <Select value={manualPaymentSemester} onValueChange={setManualPaymentSemester}>
                                <SelectTrigger id="semester">
                                  <SelectValue placeholder="Select semester" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="first">First Semester</SelectItem>
                                  <SelectItem value="second">Second Semester</SelectItem>
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
