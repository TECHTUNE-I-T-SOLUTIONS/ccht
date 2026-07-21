'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Search, DollarSign, CheckCircle, Clock, XCircle, User, X, FileText, CalendarDays } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

type Payment = {
  id: string
  aspirant_id: string
  aspirant_name: string
  aspirant_email: string
  amount: number
  payment_type: string
  status: string
  reference: string
  description: string
  created_at: string
  paid_at: string | null
  table_source: string
}

export default function AdminPaymentsAspirants() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, successful: 0, pending: 0, failed: 0 })
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadPayments()
  }, [statusFilter])

  const loadPayments = async () => {
    setLoading(true)
    try {
      // Fetch from all three payment tables
      const [eventsRes, admissionRes, applicationRes] = await Promise.all([
        supabase
          .from('aspirant_payment_events')
          .select('*, profiles(first_name, last_name, email)')
          .order('created_at', { ascending: false }),
        supabase
          .from('aspirant_admission_payments')
          .select('*, profiles(first_name, last_name, email)')
          .order('created_at', { ascending: false }),
        supabase
          .from('aspirant_application_payments')
          .select('*, profiles(first_name, last_name, email)')
          .order('created_at', { ascending: false })
      ])

      const allPayments: Payment[] = []

      // Process aspirant_payment_events
      if (eventsRes.data) {
        eventsRes.data.forEach((p: any) => {
          allPayments.push({
            id: p.id,
            aspirant_id: p.aspirant_id,
            aspirant_name: p.profiles ? `${p.profiles.first_name} ${p.profiles.last_name}` : 'Unknown',
            aspirant_email: p.profiles?.email || '',
            amount: p.amount || 0,
            payment_type: p.payment_type || 'application_fee',
            status: p.status || 'pending',
            reference: p.paystack_reference || p.providertransaction_id || 'N/A',
            description: p.description || 'Payment',
            created_at: p.created_at,
            paid_at: p.paid_at,
            table_source: 'aspirant_payment_events'
          })
        })
      }

      // Process aspirant_admission_payments
      if (admissionRes.data) {
        admissionRes.data.forEach((p: any) => {
          allPayments.push({
            id: p.id,
            aspirant_id: p.aspirant_id,
            aspirant_name: p.profiles ? `${p.profiles.first_name} ${p.profiles.last_name}` : 'Unknown',
            aspirant_email: p.profiles?.email || '',
            amount: p.amount || 0,
            payment_type: 'admission_fee',
            status: p.payment_status || p.status || 'pending',
            reference: p.paystack_reference || p.providertransaction_id || 'N/A',
            description: 'Admission Fee Payment',
            created_at: p.created_at,
            paid_at: p.paid_at,
            table_source: 'aspirant_admission_payments'
          })
        })
      }

      // Process aspirant_application_payment
      if (applicationRes.data) {
        applicationRes.data.forEach((p: any) => {
          allPayments.push({
            id: p.id,
            aspirant_id: p.aspirant_id,
            aspirant_name: p.profiles ? `${p.profiles.first_name} ${p.profiles.last_name}` : 'Unknown',
            aspirant_email: p.profiles?.email || '',
            amount: p.amount || 0,
            payment_type: 'application_fee',
            status: p.payment_status || p.status || 'pending',
            reference: p.paystack_reference || p.providertransaction_id || 'N/A',
            description: 'Application Fee Payment',
            created_at: p.created_at,
            paid_at: p.paid_at,
            table_source: 'aspirant_application_payment'
          })
        })
      }

      // Sort by created_at
      allPayments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      let filtered = allPayments
      if (statusFilter !== 'all') {
        filtered = filtered.filter(p => p.status === statusFilter)
      }

      setPayments(filtered)
      setStats({
        total: filtered.reduce((sum, p) => sum + (p.status === 'success' || p.status === 'paid' ? p.amount : 0), 0),
        successful: filtered.filter(p => p.status === 'success' || p.status === 'paid').length,
        pending: filtered.filter(p => p.status === 'pending').length,
        failed: filtered.filter(p => p.status === 'failed').length,
      })
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

  const filteredPayments = payments.filter(p =>
    p.aspirant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.aspirant_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.reference.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) return <div className="flex items-center justify-center p-8"><div className="text-sm text-muted-foreground">Loading payments...</div></div>

  return (
    <div className="space-y-6">
      <div className="rounded-[2.5rem] border border-border bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.12),transparent_30%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--accent-soft)))] p-6 md:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Admin</p>
        <h1 className="mt-3 text-3xl font-extrabold">Aspirant Payments</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-foreground/70">
          Track and manage all aspirant payments including application, admission, and other fees.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="rounded-[2rem] border bg-white p-6 shadow-sm dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-primary/10 p-3 text-primary">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold">₦{stats.total.toLocaleString()}</p>
            </div>
          </div>
        </Card>
        <Card className="rounded-[2rem] border bg-white p-6 shadow-sm dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-600">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Successful</p>
              <p className="text-2xl font-bold">{stats.successful}</p>
            </div>
          </div>
        </Card>
        <Card className="rounded-[2rem] border bg-white p-6 shadow-sm dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-yellow-500/10 p-3 text-yellow-600">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold">{stats.pending}</p>
            </div>
          </div>
        </Card>
        <Card className="rounded-[2rem] border bg-white p-6 shadow-sm dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-red-500/10 p-3 text-red-600">
              <XCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Failed</p>
              <p className="text-2xl font-bold">{stats.failed}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="rounded-[2rem] border bg-white p-6 shadow-sm dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or reference..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 rounded-xl bg-slate-50 dark:bg-slate-800 border-none"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] rounded-xl bg-slate-50 dark:bg-slate-800 border-none">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="success">Successful</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-xl border overflow-hidden hidden md:block">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
              <TableRow>
                <TableHead>Aspirant</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">No payments found.</TableCell>
                </TableRow>
              ) : (
                filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <div>{payment.aspirant_name}</div>
                          <div className="text-xs text-muted-foreground">{payment.aspirant_email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="capitalize text-sm">{payment.payment_type.replace('_', ' ')}</span>
                    </TableCell>
                    <TableCell className="font-bold">₦{payment.amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(payment.status)}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(payment.status)}
                          {payment.status}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(payment.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl"
                        onClick={() => {
                          setSelectedPayment(payment)
                          setShowModal(true)
                        }}
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-4">
          {filteredPayments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No payments found.</div>
          ) : (
            filteredPayments.map((payment) => (
              <Card key={payment.id} className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold break-words">{payment.aspirant_name}</p>
                      <p className="text-xs text-muted-foreground break-words">{payment.aspirant_email}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Type</p>
                      <p className="text-sm capitalize">{payment.payment_type.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Amount</p>
                      <p className="text-sm font-bold">₦{payment.amount.toLocaleString()}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <Badge className={getStatusColor(payment.status)}>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(payment.status)}
                        {payment.status}
                      </span>
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CalendarDays className="h-3 w-3" />
                    <span>{new Date(payment.created_at).toLocaleDateString()}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full rounded-xl"
                    onClick={() => {
                      setSelectedPayment(payment)
                      setShowModal(true)
                    }}
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    View Details
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </Card>

      {/* Payment Details Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md w-full max-h-[85vh] bg-white dark:bg-slate-950 overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0 pb-2">
            <div className="flex items-center justify-between">
              <DialogTitle>Payment Details</DialogTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <DialogDescription className="hidden">
              View detailed payment information
            </DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="flex-1 overflow-y-auto space-y-3 px-1">
              <div>
                <p className="text-xs text-muted-foreground">Aspirant</p>
                <p className="font-semibold break-words">{selectedPayment.aspirant_name}</p>
                <p className="text-sm text-muted-foreground break-words">{selectedPayment.aspirant_email}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Payment Type</p>
                  <p className="text-sm capitalize">{selectedPayment.payment_type.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Amount</p>
                  <p className="text-xl font-bold">₦{selectedPayment.amount.toLocaleString()}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <Badge className={getStatusColor(selectedPayment.status)}>
                  <span className="flex items-center gap-1">
                    {getStatusIcon(selectedPayment.status)}
                    {selectedPayment.status}
                  </span>
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Reference</p>
                <p className="text-sm font-mono">{selectedPayment.reference}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Description</p>
                <p className="text-sm">{selectedPayment.description}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Source</p>
                <p className="text-sm">{selectedPayment.table_source}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Created At</p>
                  <p className="text-sm">{new Date(selectedPayment.created_at).toLocaleString()}</p>
                </div>
                {selectedPayment.paid_at && (
                  <div>
                    <p className="text-xs text-muted-foreground">Paid At</p>
                    <p className="text-sm">{new Date(selectedPayment.paid_at).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
