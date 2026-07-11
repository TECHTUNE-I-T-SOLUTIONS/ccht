'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CreditCard, Receipt, ShieldCheck, Coins } from 'lucide-react'
import { toast } from 'sonner'

export default function StudentFeesPage() {
  const [student, setStudent] = useState<any | null>(null)
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [initiating, setInitiating] = useState(false)
  const totalTuition = 120000

  const loadPaymentData = async () => {
    try {
      const [meRes, paymentsRes] = await Promise.all([fetch('/api/v1/auth/me'), fetch('/api/v1/payments')])
      const me = await meRes.json().catch(() => null)
      const payList = await paymentsRes.json().catch(() => null)
      setStudent(me?.user || null)
      setPayments(payList?.data || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPaymentData()
  }, [])

  const paidTuition = payments.filter((p) => p.description?.toLowerCase().includes('tuition') && p.status === 'success').reduce((sum, p) => sum + p.amount, 0)
  const paymentStatus = paidTuition >= totalTuition ? 'fully_paid' : paidTuition > 0 ? 'partially_paid' : 'unpaid'
  const remainingBalance = Math.max(0, totalTuition - paidTuition)

  const payTuition = async (amount: number) => {
    if (!student) return
    setInitiating(true)
    try {
      const response = await fetch('/api/v1/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          email: student.email,
          studentId: student.id,
          description: `Tuition Fee Payment (₦${amount.toLocaleString()})`,
        }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Failed to initiate payment')
      window.location.href = payload.authorizationUrl
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setInitiating(false)
    }
  }

  if (loading) return <div className="p-8 font-technical">Loading accounts and fee status...</div>

  return (
    <div className="space-y-8">
      <div className="rounded-[2.5rem] border border-border bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.12),transparent_30%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--accent-soft)))] p-8 md:p-10">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Student Finances</p>
            <h1 className="mt-2 text-3xl font-extrabold md:text-5xl">Tuition & administrative payments</h1>
            <p className="mt-1 text-sm text-foreground/75">Pay tuition securely and track your outstanding balance.</p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border bg-white p-4 shadow-sm">
            <Coins className="h-10 w-10 text-primary" />
            <div>
              <span className="block text-[10px] font-technical uppercase font-bold text-muted-foreground">Session Balance</span>
              <span className="text-2xl font-black font-technical text-foreground">₦{remainingBalance.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="space-y-6 rounded-[2.5rem] border bg-white p-8 shadow-sm">
          <h2 className="text-xl font-bold">Session tuition fee</h2>
          <p className="text-sm text-muted-foreground">Pay at least 50% upfront, or clear the full balance when ready.</p>

          <div className="space-y-4 rounded-2xl border bg-slate-50 p-6">
            <div className="flex items-center justify-between text-sm font-semibold">
              <span className="text-muted-foreground">Total tuition due</span>
              <span>₦{totalTuition.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-sm font-semibold">
              <span className="text-muted-foreground">Paid to date</span>
              <span className="font-bold text-emerald-600">₦{paidTuition.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between border-t pt-4 text-sm font-bold">
              <span>Status</span>
              <span className="rounded-full px-3 py-1 text-xs uppercase tracking-wider">
                {paymentStatus === 'fully_paid' && 'Fully Paid'}
                {paymentStatus === 'partially_paid' && 'Partially Paid'}
                {paymentStatus === 'unpaid' && 'Unpaid'}
              </span>
            </div>
          </div>

          {paymentStatus !== 'fully_paid' && (
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-bold text-sm">Select payment structure</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {paymentStatus === 'unpaid' && (
                  <Card className="flex h-44 cursor-pointer flex-col justify-between rounded-2xl border-2 p-5 transition-all hover:border-primary" onClick={() => payTuition(totalTuition / 2)}>
                    <div>
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">Upfront installment</span>
                      <h4 className="mt-4 text-2xl font-extrabold">₦{(totalTuition / 2).toLocaleString()}</h4>
                      <p className="mt-1 text-xs text-muted-foreground">Pay 50% to activate lectures and course registration.</p>
                    </div>
                    <Button disabled={initiating} size="sm" className="mt-4 w-full rounded-xl">Pay 50%</Button>
                  </Card>
                )}
                <Card className="flex h-44 cursor-pointer flex-col justify-between rounded-2xl border-2 p-5 transition-all hover:border-primary" onClick={() => payTuition(remainingBalance)}>
                  <div>
                    <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600">Full balance</span>
                    <h4 className="mt-4 text-2xl font-extrabold">₦{remainingBalance.toLocaleString()}</h4>
                    <p className="mt-1 text-xs text-muted-foreground">Clear all outstanding balances for this session.</p>
                  </div>
                  <Button disabled={initiating} size="sm" className="mt-4 w-full rounded-xl bg-emerald-600 hover:bg-emerald-700">Pay Outstanding</Button>
                </Card>
              </div>
            </div>
          )}

          {paymentStatus === 'fully_paid' && (
            <div className="flex items-center gap-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
              <ShieldCheck className="h-10 w-10 shrink-0 text-emerald-600" />
              <div>
                <h4 className="font-bold text-foreground">Tuition cleared</h4>
                <p className="text-xs text-muted-foreground">All outstanding tuition fees for this session have been settled.</p>
              </div>
            </div>
          )}
        </Card>

        <Card className="space-y-6 rounded-[2.5rem] border bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <Receipt className="h-5 w-5 text-primary" />
            Transaction history
          </h2>
          <div className="space-y-4">
            {payments.length === 0 ? (
              <p className="py-8 text-center text-xs text-muted-foreground">No payments made on this account yet.</p>
            ) : (
              payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-xl border bg-slate-50 p-4 text-xs">
                  <div>
                    <p className="font-bold">{p.description || 'College payment'}</p>
                    <span className="text-[10px] text-muted-foreground">{p.paystack_reference || 'Ref: N/A'} · {p.paid_at ? new Date(p.paid_at).toLocaleDateString() : 'Pending'}</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-sm font-extrabold">₦{p.amount.toLocaleString()}</span>
                    <span className={`font-bold capitalize ${p.status === 'success' ? 'text-emerald-600' : 'text-amber-500'}`}>{p.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
