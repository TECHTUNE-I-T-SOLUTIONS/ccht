'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { TrendingUp, Users, ArrowRight, Funnel, CheckCircle, GraduationCap, BarChart3 } from 'lucide-react'

export default function AdminAnalyticsConversionPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalApplications: 0,
    totalPaid: 0,
    totalSubmitted: 0,
    totalAdmitted: 0,
    paymentConversion: 0,
    submissionConversion: 0,
    admissionConversion: 0,
    overallConversion: 0
  })

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/admin/analytics/conversion')
      if (res.ok) {
        const data = await res.json()
        setStats(data.data || stats)
      }
    } catch (error) {
      console.error('Failed to load analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-sm text-muted-foreground">Loading analytics...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[2.5rem] border border-border bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.12),transparent_30%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--accent-soft)))] p-6 md:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Admin</p>
        <h1 className="mt-3 text-3xl font-extrabold">Conversion Analytics</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-foreground/70">
          Track conversion rates from application to admission across the entire funnel.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-[2rem] border bg-white p-6 shadow-sm dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-primary/10 p-3 text-primary">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Applications</p>
              <p className="text-2xl font-bold">{stats.totalApplications}</p>
            </div>
          </div>
        </Card>

        <Card className="rounded-[2rem] border bg-white p-6 shadow-sm dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-600">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Paid</p>
              <p className="text-2xl font-bold">{stats.totalPaid}</p>
            </div>
          </div>
        </Card>

        <Card className="rounded-[2rem] border bg-white p-6 shadow-sm dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-blue-500/10 p-3 text-blue-600">
              <Funnel className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Submitted</p>
              <p className="text-2xl font-bold">{stats.totalSubmitted}</p>
            </div>
          </div>
        </Card>

        <Card className="rounded-[2rem] border bg-white p-6 shadow-sm dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-purple-500/10 p-3 text-purple-600">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Admitted</p>
              <p className="text-2xl font-bold">{stats.totalAdmitted}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-[2rem] border bg-white p-6 shadow-sm dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-green-500/10 p-3 text-green-600">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Payment Conversion</p>
              <p className="text-2xl font-bold">{stats.paymentConversion.toFixed(1)}%</p>
            </div>
          </div>
        </Card>

        <Card className="rounded-[2rem] border bg-white p-6 shadow-sm dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-blue-500/10 p-3 text-blue-600">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Submission Conversion</p>
              <p className="text-2xl font-bold">{stats.submissionConversion.toFixed(1)}%</p>
            </div>
          </div>
        </Card>

        <Card className="rounded-[2rem] border bg-white p-6 shadow-sm dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-purple-500/10 p-3 text-purple-600">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Admission Conversion</p>
              <p className="text-2xl font-bold">{stats.admissionConversion.toFixed(1)}%</p>
            </div>
          </div>
        </Card>

        <Card className="rounded-[2rem] border bg-white p-6 shadow-sm dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-orange-500/10 p-3 text-orange-600">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Overall Conversion</p>
              <p className="text-2xl font-bold">{stats.overallConversion.toFixed(1)}%</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="rounded-[2rem] border bg-white p-6 shadow-sm dark:bg-slate-900">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Conversion Funnel
        </h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Applications</span>
                <span className="text-sm text-muted-foreground">{stats.totalApplications}</span>
              </div>
              <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: '100%' }} />
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Paid ({stats.paymentConversion.toFixed(1)}%)</span>
                <span className="text-sm text-muted-foreground">{stats.totalPaid}</span>
              </div>
              <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${stats.paymentConversion}%` }} />
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Submitted ({stats.submissionConversion.toFixed(1)}%)</span>
                <span className="text-sm text-muted-foreground">{stats.totalSubmitted}</span>
              </div>
              <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${stats.submissionConversion}%` }} />
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Admitted ({stats.admissionConversion.toFixed(1)}%)</span>
                <span className="text-sm text-muted-foreground">{stats.totalAdmitted}</span>
              </div>
              <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full" style={{ width: `${stats.admissionConversion}%` }} />
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
