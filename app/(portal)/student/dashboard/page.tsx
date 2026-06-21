'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen, CreditCard, FileText, ReceiptText, ArrowRight, BadgeCheck, UserRound } from 'lucide-react'

export default function StudentDashboard() {
  const [user, setUser] = useState<any>(null)
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const [profileRes, paymentsRes] = await Promise.all([
          supabase.from('profiles').select('id, email, first_name, last_name, phone, role, avatar_url').eq('id', user.id).single(),
          supabase.from('payments').select('id, amount, status, created_at').order('created_at', { ascending: false }).limit(3),
        ])
        setUser(profileRes.data)
        setPayments(paymentsRes.data || [])
      }
      setLoading(false)
    }
    getUser()
  }, [])

  if (loading) return <div className="p-8">Loading...</div>

  const stats = [
    { label: 'Registered courses', value: '6', icon: BookOpen },
    { label: 'Pending fees', value: '₦18,000', icon: CreditCard },
    { label: 'Recent payments', value: String(payments.length), icon: FileText },
    { label: 'Profile completion', value: user?.phone ? '88%' : '70%', icon: BadgeCheck },
  ]

  return (
    <div className="space-y-8">
      <div className="rounded-[2rem] border border-border bg-[linear-gradient(160deg,hsl(var(--primary)/0.12),hsl(var(--secondary)/0.08),hsl(var(--card)))] p-6 md:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-border bg-background">
              {user?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatar_url} alt={user?.first_name || 'Student'} className="h-full w-full object-cover" />
              ) : (
                <UserRound className="h-8 w-8 text-primary" />
              )}
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Student portal</p>
              <h1 className="mt-2 text-3xl font-extrabold md:text-5xl">Welcome, {user?.first_name || 'Student'}</h1>
              <p className="mt-2 text-sm text-foreground/70">{user?.email}</p>
            </div>
          </div>
          <p className="max-w-2xl text-sm leading-7 text-foreground/70">
            Manage your academic progress, course registration, results, payments, and personal records from one place.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon
          return (
            <Card key={item.label} className="rounded-3xl p-6">
              <Icon className="h-5 w-5 text-primary" />
              <p className="mt-4 text-sm text-muted-foreground">{item.label}</p>
              <p className="mt-1 text-2xl font-bold">{item.value}</p>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="rounded-[2rem] p-6">
          <h2 className="text-2xl font-bold">Quick actions</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Button asChild className="justify-start rounded-2xl">
              <Link href="/student/courses">
                <BookOpen className="mr-2 h-4 w-4" />
                Register courses
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start rounded-2xl">
              <Link href="/student/results">
                <FileText className="mr-2 h-4 w-4" />
                View results
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start rounded-2xl">
              <Link href="/student/payments">
                <CreditCard className="mr-2 h-4 w-4" />
                Pay fees
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start rounded-2xl">
              <Link href="/student/payments">
                <ReceiptText className="mr-2 h-4 w-4" />
                Download receipt
              </Link>
            </Button>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-[2rem] p-6">
            <h2 className="text-2xl font-bold">Profile snapshot</h2>
            <div className="mt-4 space-y-3 text-sm">
              <p><span className="text-muted-foreground">Email:</span> {user?.email}</p>
              <p><span className="text-muted-foreground">Phone:</span> {user?.phone || 'Not set'}</p>
              <p><span className="text-muted-foreground">Status:</span> Active student</p>
            </div>
          </Card>
          <Card className="rounded-[2rem] p-6">
            <h2 className="text-2xl font-bold">Recent activity</h2>
            <div className="mt-4 space-y-3">
              {payments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent payments found.</p>
              ) : (
                payments.map((payment) => (
                  <div key={payment.id} className="rounded-2xl border border-border bg-background p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold">Payment update</p>
                      <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                        {payment.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">Amount: ₦{payment.amount}</p>
                  </div>
                ))
              )}
            </div>
          </Card>
          <Card className="rounded-[2rem] p-6">
            <h2 className="text-2xl font-bold">Need help?</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              Upload missing documents or contact support if a record is incorrect.
            </p>
            <Link href="/contact" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
              Contact support <ArrowRight className="h-4 w-4" />
            </Link>
          </Card>
        </div>
      </div>
    </div>
  )
}
