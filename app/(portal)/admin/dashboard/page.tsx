'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, BookOpen, CreditCard, FileText, GraduationCap, Settings, UserRound, ArrowRight, ClipboardCheck, UserCheck, ShieldCheck } from 'lucide-react'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAspirants: 0,
    totalStudents: 0,
    totalLecturers: 0,
    totalAdmins: 0,
    totalPrograms: 0,
    totalPayments: 0,
    totalApplications: 0,
  })
  const [recentUsers, setRecentUsers] = useState<any[]>([])
  const [recentPayments, setRecentPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getStats = async () => {
      try {
        const [dashboardStatsRes, recentAspirantsRes, recentStudentsRes, recentPaymentsRes] = await Promise.all([
          fetch('/api/v1/admin/dashboard/stats'),
          fetch('/api/v1/admin/management/aspirants/recent?limit=4'),
          fetch('/api/v1/admin/management/students/recent?limit=4'),
          fetch('/api/v1/admin/payments/recent?limit=4'),
        ])
        
        const dashboardStats = await dashboardStatsRes.json()
        const recentAspirants = await recentAspirantsRes.json()
        const recentStudents = await recentStudentsRes.json()
        const recentPayments = await recentPaymentsRes.json()
        
        if (dashboardStats.success) setStats(dashboardStats.data)
        
        // Combine recent users from different sources and deduplicate by ID
        const combinedUsers = [
          ...((recentAspirants.data || []).map((a: any) => ({ ...a, role: 'aspirant' }))),
          ...((recentStudents.data || []).map((s: any) => ({ ...s, role: 'student' }))),
        ].reduce((unique: any[], user: any) => {
          if (!unique.some((u: any) => u.id === user.id)) {
            unique.push(user)
          }
          return unique
        }, []).slice(0, 4)
        
        setRecentUsers(combinedUsers)
        setRecentPayments(recentPayments.data || [])
      } catch (error) {
        console.error('Failed to load dashboard stats:', error)
      } finally {
        setLoading(false)
      }
    }
    getStats()
  }, [])

  const managementModules = [
    { label: 'Admission applications and screening', href: '/admin/management/aspirants', icon: GraduationCap },
    { label: 'Student onboarding and status updates', href: '/admin/management/students', icon: Users },
    { label: 'Lecturer onboarding and course allocation', href: '/admin/management/lecturers', icon: UserCheck },
    { label: 'Admin account and permission management', href: '/admin/management/admins', icon: ShieldCheck },
    { label: 'Program, department, and class management', href: '/admin/programs', icon: BookOpen },
    { label: 'Fee structure, sessions, and receipts', href: '/admin/finance/fees', icon: CreditCard },
  ]

  if (loading) return <div className="p-8">Loading dashboard...</div>

  return (
    <div className="space-y-8">
      <div className="rounded-[2rem] border border-border bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.12),transparent_30%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--accent-soft)))] p-6 md:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Admin dashboard</p>
        <h1 className="mt-3 text-3xl font-extrabold md:text-5xl">Manage the school operation hub</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-foreground/70">
          Admissions, students, lecturers, departments, payments, results, and content all live here with role-based control.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total users', value: stats.totalUsers, icon: Users },
          { label: 'Aspirants', value: stats.totalAspirants, icon: GraduationCap },
          { label: 'Students', value: stats.totalStudents, icon: BookOpen },
          { label: 'Lecturers', value: stats.totalLecturers, icon: UserCheck },
        ].map((item) => {
          const Icon = item.icon
          return (
            <Card key={item.label} className="rounded-3xl border bg-white p-6 shadow-sm dark:bg-blue-800/20">
              <Icon className="h-5 w-5 text-primary" />
              <p className="mt-4 text-sm text-muted-foreground">{item.label}</p>
              <p className="mt-1 text-2xl font-bold">{item.value}</p>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Programs', value: stats.totalPrograms, icon: BookOpen },
          { label: 'Transactions', value: stats.totalPayments, icon: CreditCard },
          { label: 'Applications', value: stats.totalApplications, icon: FileText },
          { label: 'Admins', value: stats.totalAdmins, icon: ShieldCheck },
        ].map((item) => {
          const Icon = item.icon
          return (
            <Card key={item.label} className="rounded-3xl border bg-white p-6 shadow-sm dark:bg-blue-800/20">
              <Icon className="h-5 w-5 text-primary" />
              <p className="mt-4 text-sm text-muted-foreground">{item.label}</p>
              <p className="mt-1 text-2xl font-bold">{item.value}</p>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="rounded-[2rem] border bg-white p-6 shadow-sm dark:bg-blue-800/20">
          <h2 className="text-2xl font-bold">Management modules</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {managementModules.map((module) => {
              const Icon = module.icon
              return (
                <Link key={module.href} href={module.href}>
                  <div className="flex items-center gap-3 rounded-2xl border border-border bg-slate-50 p-4 text-sm transition-colors hover:bg-accent dark:bg-blue-800/20">
                    <Icon className="h-5 w-5 text-primary" />
                    <span>{module.label}</span>
                    <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
              )
            })}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-[2rem] border bg-white p-6 shadow-sm dark:bg-blue-800/20">
            <h2 className="text-2xl font-bold">Quick actions</h2>
            <div className="mt-4 space-y-3">
              <Button asChild className="w-full justify-start rounded-2xl">
                <Link href="/admin/management/aspirants"><GraduationCap className="mr-2 h-4 w-4" />Review admissions</Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start rounded-2xl">
                <Link href="/admin/management/students"><Users className="mr-2 h-4 w-4" />Manage students</Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start rounded-2xl">
                <Link href="/admin/admissions"><ClipboardCheck className="mr-2 h-4 w-4" />Bulk migrate aspirants</Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start rounded-2xl">
                <Link href="/admin/settings"><Settings className="mr-2 h-4 w-4" />System settings</Link>
              </Button>
            </div>
          </Card>

          <Card className="rounded-[2rem] border bg-white p-6 shadow-sm dark:bg-blue-800/20">
            <h2 className="text-2xl font-bold">Recent activity</h2>
            <div className="mt-4 space-y-3">
              {recentUsers.length === 0 && recentPayments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent activity found.</p>
              ) : (
                <>
                  {recentUsers.map((member) => (
                    <div key={member.id} className="rounded-2xl border border-border bg-slate-50 p-4 dark:bg-blue-800/20">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <UserRound className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-foreground">{[member.firstName, member.lastName].filter(Boolean).join(' ') || 'User'}</p>
                          <p className="text-xs text-muted-foreground capitalize">{member.role} registered</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {recentPayments.map((payment) => (
                    <div key={payment.id} className="rounded-2xl border border-border bg-slate-50 p-4 dark:bg-blue-800/20">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100 text-green-600">
                          <CreditCard className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-foreground">
                            {payment.user?.first_name} {payment.user?.last_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {payment.payment_type} - ₦{payment.amount?.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
