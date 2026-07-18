'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Search, CheckCircle2, XCircle, CreditCard, MoreVertical } from 'lucide-react'
import { toast } from 'sonner'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { getPaymentsAction, updatePaymentStatusAction } from '@/app/actions/admin/finance-actions'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    loadData()
  }, [statusFilter])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await getPaymentsAction(statusFilter)
      if (res.success) {
        setPayments(res.data || [])
      } else {
        toast.error('Failed to load payments')
      }
    } catch (err) {
      toast.error('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (id: string, status: string, source: string) => {
    const res = await updatePaymentStatusAction(id, status, source)
    if (res.success) {
      toast.success(`Payment marked as ${status}`)
      loadData()
    } else {
      toast.error(res.error || 'Failed to update payment status')
    }
  }

  const filtered = payments.filter(p => {
    const q = searchQuery.toLowerCase()
    const name = `${p.profile?.first_name} ${p.profile?.last_name}`.toLowerCase()
    const ref = p.reference?.toLowerCase() || ''
    return name.includes(q) || ref.includes(q)
  })

  return (
    <div className="space-y-8">
      <div className="rounded-[2.5rem] border border-border bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.12),transparent_30%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--accent-soft)))] p-8 md:p-10">
        <h1 className="mt-2 text-3xl font-extrabold md:text-5xl">Payments Log</h1>
        <p className="mt-2 text-sm text-foreground/75">Monitor all incoming payments, verify manual transfers, and manage refunds.</p>
      </div>

      <Card className="rounded-[2rem] border bg-white dark:bg-slate-900 shadow-sm p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary dark:data-[state=active]:bg-slate-900">All Payments</TabsTrigger>
            <TabsTrigger value="student" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary dark:data-[state=active]:bg-slate-900">Students</TabsTrigger>
            <TabsTrigger value="aspirant" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary dark:data-[state=active]:bg-slate-900">Aspirants</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by student name or reference ID..."
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
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-xl border overflow-hidden overflow-x-auto">
          <Table className="min-w-[800px]">
            <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Payment Details</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date & Ref</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">Loading payments...</TableCell>
                </TableRow>
              ) : filtered.filter(p => activeTab === 'all' || p.profile?.role === activeTab).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">No payments found in this category.</TableCell>
                </TableRow>
              ) : (
                filtered.filter(p => activeTab === 'all' || p.profile?.role === activeTab).map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <CreditCard className="h-4 w-4" />
                        </div>
                        <div>
                          <div>{payment.profile?.first_name} {payment.profile?.last_name}</div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{payment.profile?.email}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-bold ${payment.profile?.role === 'student' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>{payment.profile?.role}</span>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold capitalize">{payment.fee_schedule?.fee_type || 'Unknown Fee'}</div>
                      <div className="text-xs text-muted-foreground">via {payment.payment_method || 'Unknown'}</div>
                    </TableCell>
                    <TableCell className="font-bold text-lg">
                      {payment.currency} {payment.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{new Date(payment.created_at).toLocaleDateString()}</div>
                      <div className="text-xs font-mono text-muted-foreground">Ref: {payment.reference}</div>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full capitalize ${payment.status === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                          payment.status === 'pending' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                            'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                        {payment.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {payment.status === 'pending' && (
                            <DropdownMenuItem onClick={() => handleUpdateStatus(payment.id, 'completed', payment.payment_source)}>
                              <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" /> Verify & Complete
                            </DropdownMenuItem>
                          )}
                          {(payment.status === 'completed' || payment.status === 'pending') && (
                            <DropdownMenuItem onClick={() => handleUpdateStatus(payment.id, 'failed', payment.payment_source)}>
                              <XCircle className="mr-2 h-4 w-4 text-red-500" /> Mark as Failed
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}
