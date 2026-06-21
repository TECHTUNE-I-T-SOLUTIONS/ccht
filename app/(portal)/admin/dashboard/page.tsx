'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, BookOpen, CreditCard, FileText, GraduationCap, Settings, ArrowRight, UserRound } from 'lucide-react'

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, programs: 0, payments: 0, posts: 0 })
  const [recentUsers, setRecentUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const getStats = async () => {
      const [usersRes, programsRes, paymentsRes, postsRes, recentUsersRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('programs').select('id', { count: 'exact', head: true }),
        supabase.from('payments').select('id', { count: 'exact', head: true }),
        supabase.from('blog_posts').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id, first_name, last_name, role, created_at').order('created_at', { ascending: false }).limit(4),
      ])
      setStats({
        users: usersRes.count || 0,
        programs: programsRes.count || 0,
        payments: paymentsRes.count || 0,
        posts: postsRes.count || 0,
      })
      setRecentUsers(recentUsersRes.data || [])
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

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
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
              <Button asChild className="w-full justify-start rounded-2xl">
                <Link href="/admin/admissions">
                  <GraduationCap className="mr-2 h-4 w-4" />
                  Review admissions
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start rounded-2xl">
                <Link href="/admin/users">
                  <Users className="mr-2 h-4 w-4" />
                  Manage users
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start rounded-2xl">
                <Link href="/admin/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  System settings
                </Link>
              </Button>
            </div>
          </Card>
          <Card className="rounded-[2rem] p-6">
            <h2 className="text-2xl font-bold">Recent users</h2>
            <div className="mt-4 space-y-3">
              {recentUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent users found.</p>
              ) : (
                recentUsers.map((member) => (
                  <div key={member.id} className="rounded-2xl border border-border bg-background p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <UserRound className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{[member.first_name, member.last_name].filter(Boolean).join(' ') || 'User'}</p>
                        <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
