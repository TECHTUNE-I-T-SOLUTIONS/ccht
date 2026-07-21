'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ReceiptText, Download, Calendar, CreditCard, CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { PaymentReceipt } from '@/components/aspirant/payment-receipt'
import { format } from 'date-fns'

type Payment = {
  id: string
  payment_type: string
  type: string
  amount: number
  currency: string
  status: 'pending' | 'success' | 'failed' | 'abandoned' | 'refunded'
  paystack_reference: string | null
  paid_at: string | null
  created_at: string
}

type AspirantProfile = {
  first_name: string
  last_name: string
  email: string
  phone: string | null
}

export default function AspirantPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [aspirant, setAspirant] = useState<AspirantProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPayments()
  }, [])

  const loadPayments = async () => {
    try {
      setLoading(true)
      
      // Get user info
      const meRes = await fetch('/api/v1/auth/me')
      const meData = await meRes.json()
      const user = meData?.user

      if (!user) {
        throw new Error('User not found')
      }

      setAspirant({
        first_name: user.firstName || '',
        last_name: user.lastName || '',
        email: user.email || '',
        phone: user.phone || null
      })

      // Get payment history
      const paymentsRes = await fetch('/api/v1/aspirant/payments/history')
      const paymentsData = await paymentsRes.json()

      if (paymentsData.success) {
        setPayments(paymentsData.data || [])
      }
    } catch (error) {
      console.error('Error loading payments:', error)
      toast.error('Failed to load payment history')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-emerald-600" />
      case 'pending':
        return <Clock className="h-5 w-5 text-amber-600" />
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />
      case 'abandoned':
        return <AlertCircle className="h-5 w-5 text-gray-600" />
      case 'refunded':
        return <AlertCircle className="h-5 w-5 text-orange-600" />
      default:
        return <Clock className="h-5 w-5 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      success: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      pending: 'bg-amber-100 text-amber-800 border-amber-200',
      failed: 'bg-red-100 text-red-800 border-red-200',
      abandoned: 'bg-gray-100 text-gray-800 border-gray-200',
      refunded: 'bg-orange-100 text-orange-800 border-orange-200',
    }
    
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${styles[status as keyof typeof styles] || styles.pending}`}>
        {getStatusIcon(status)}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const formatAmount = (amount: number, currency: string = 'NGN') => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy h:mm a')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Loading payment history...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-[2.5rem] border border-border bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.12),transparent_30%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--accent-soft)))] p-8">
        <div className="flex items-center gap-4">
          <div className="rounded-2xl bg-primary/10 p-4 text-primary">
            <ReceiptText className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold">Payment History</h1>
            <p className="mt-1 text-sm text-muted-foreground">View and download your payment receipts</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-2xl border bg-white p-6 shadow-sm dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Payments</p>
              <p className="mt-2 text-3xl font-bold">{payments.length}</p>
            </div>
            <div className="rounded-xl bg-primary/10 p-3 text-primary">
              <CreditCard className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border bg-white p-6 shadow-sm dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Successful</p>
              <p className="mt-2 text-3xl font-bold text-emerald-600">
                {payments.filter(p => p.status === 'success').length}
              </p>
            </div>
            <div className="rounded-xl bg-emerald-100 p-3 text-emerald-600 dark:bg-emerald-900/20">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="rounded-2xl border bg-white p-6 shadow-sm dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
              <p className="mt-2 text-3xl font-bold">
                {formatAmount(
                  payments
                    .filter(p => p.status === 'success')
                    .reduce((sum, p) => sum + p.amount, 0)
                )}
              </p>
            </div>
            <div className="rounded-xl bg-blue-100 p-3 text-blue-600 dark:bg-blue-900/20">
              <ReceiptText className="h-6 w-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Payments List */}
      <Card className="rounded-[2.5rem] border bg-white p-6 shadow-sm dark:bg-slate-900">
        <h2 className="text-xl font-bold mb-6">Transaction History</h2>

        {payments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-slate-50 p-12 text-center dark:bg-slate-800/50">
            <ReceiptText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold">No payments yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Your payment history will appear here once you make any payments.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="rounded-2xl border border-border bg-slate-50 p-4 dark:bg-slate-800/50"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-primary/10 p-2 text-primary">
                        <CreditCard className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{payment.payment_type}</h3>
                        <p className="text-xs text-muted-foreground">
                          Ref: {payment.paystack_reference || payment.id}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(payment.created_at)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="font-semibold text-foreground">
                          {formatAmount(payment.amount, payment.currency)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {getStatusBadge(payment.status)}
                    {payment.status === 'success' && aspirant && (
                      <PaymentReceipt payment={payment} aspirant={aspirant} />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
