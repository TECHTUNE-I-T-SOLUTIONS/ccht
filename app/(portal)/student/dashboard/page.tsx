'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen, CreditCard, FileText, UserRound, ReceiptText, ArrowRight, BadgeCheck } from 'lucide-react'

export default function StudentDashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        setUser(data)
      }
      setLoading(false)
    }
    getUser()
  }, [])

  if (loading) return <div className="p-8">Loading...</div>

  const stats = [
    { label: 'Registered courses', value: '6', icon: BookOpen },
    { label: 'Pending fees', value: '₦18,000', icon: CreditCard },
    { label: 'Result entries', value: '3', icon: FileText },
    { label: 'Profile completion', value: '88%', icon: BadgeCheck },
  ]

  return (
    <div className="space-y-8">
      <div className="rounded-[2rem] border border-border bg-[linear-gradient(160deg,hsl(var(--primary)/0.12),hsl(var(--secondary)/0.08),hsl(var(--card)))] p-6 md:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Student portal</p>
        <h1 className="mt-3 text-3xl font-extrabold md:text-5xl">Welcome, {user?.first_name || 'Student'}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-foreground/70">
          Manage your academic progress, course registration, results, payments, and personal records from one place.
        </p>
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
            <Button className="justify-start rounded-2xl">
              <BookOpen className="mr-2 h-4 w-4" />
              Register courses
            </Button>
            <Button variant="outline" className="justify-start rounded-2xl">
              <FileText className="mr-2 h-4 w-4" />
              View results
            </Button>
            <Button variant="outline" className="justify-start rounded-2xl">
              <CreditCard className="mr-2 h-4 w-4" />
              Pay fees
            </Button>
            <Button variant="outline" className="justify-start rounded-2xl">
              <ReceiptText className="mr-2 h-4 w-4" />
              Download receipt
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
