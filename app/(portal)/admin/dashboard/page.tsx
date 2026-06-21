'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, BookOpen, CreditCard, FileText, GraduationCap, Settings, ArrowRight } from 'lucide-react'

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, programs: 0, payments: 0, posts: 0 })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const getStats = async () => {
      const [usersRes, programsRes, paymentsRes, postsRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('programs').select('id', { count: 'exact', head: true }),
        supabase.from('payments').select('id', { count: 'exact', head: true }),
        supabase.from('blog_posts').select('id', { count: 'exact', head: true }),
      ])
      setStats({
        users: usersRes.count || 0,
        programs: programsRes.count || 0,
        payments: paymentsRes.count || 0,
        posts: postsRes.count || 0,
      })
      setLoading(false)
    }
    getStats()
  }, [])

  if (loading) return <div className="p-8">Loading dashboard...</div>

  return (
    <div className="space-y-8">
      <div className="rounded-[2rem] border border-border bg-[linear-gradient(160deg,hsl(var(--primary)/0.12),hsl(var(--secondary)/0.08),hsl(var(--card)))] p-6 md:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Admin dashboard</p>
        <h1 className="mt-3 text-3xl font-extrabold md:text-5xl">Manage the school operation hub</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-foreground/70">
          Admissions, students, lecturers, departments, payments, results, and content all live here with role-based control.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total users', value: stats.users, icon: Users },
          { label: 'Programs', value: stats.programs, icon: BookOpen },
          { label: 'Transactions', value: stats.payments, icon: CreditCard },
          { label: 'Blog posts', value: stats.posts, icon: FileText },
        ].map((item) => {
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

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-[2rem] p-6">
          <h2 className="text-2xl font-bold">Management modules</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              'Admission applications and screening',
              'Student onboarding and status updates',
              'Lecturer onboarding and course allocation',
              'Program, department, and class management',
              'Results uploads and transcript data',
              'Fee structure, sessions, and receipts',
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-border bg-background p-4 text-sm">{item}</div>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-[2rem] p-6">
            <h2 className="text-2xl font-bold">Quick actions</h2>
            <div className="mt-4 space-y-3">
              <Button className="w-full justify-start rounded-2xl">
                <GraduationCap className="mr-2 h-4 w-4" />
                Review admissions
              </Button>
              <Button variant="outline" className="w-full justify-start rounded-2xl">
                <Users className="mr-2 h-4 w-4" />
                Manage users
              </Button>
              <Button variant="outline" className="w-full justify-start rounded-2xl">
                <Settings className="mr-2 h-4 w-4" />
                System settings
              </Button>
            </div>
          </Card>
          <Card className="rounded-[2rem] p-6">
            <h2 className="text-2xl font-bold">Portal links</h2>
            <Link href="/secure/admin/signup" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">
              Admin signup <ArrowRight className="h-4 w-4" />
            </Link>
          </Card>
        </div>
      </div>
    </div>
  )
}
