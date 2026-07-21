'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { BarChart3, TrendingUp, Users, CheckCircle, Clock, AlertCircle, Award } from 'lucide-react'

export default function AdminScreeningAnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalSessions: 0,
    averageScore: 0,
    passRate: 0,
    averageDuration: 0,
    violations: 0,
    disqualified: 0
  })

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/admin/screening/analytics')
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
        <h1 className="mt-3 text-3xl font-extrabold">Screening Analytics</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-foreground/70">
          Comprehensive analytics and insights for entrance exam performance.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="rounded-[2rem] border bg-white p-6 shadow-sm dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-primary/10 p-3 text-primary">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Sessions</p>
              <p className="text-2xl font-bold">{stats.totalSessions}</p>
            </div>
          </div>
        </Card>

        <Card className="rounded-[2rem] border bg-white p-6 shadow-sm dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-600">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Average Score</p>
              <p className="text-2xl font-bold">{stats.averageScore.toFixed(1)}%</p>
            </div>
          </div>
        </Card>

        <Card className="rounded-[2rem] border bg-white p-6 shadow-sm dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-blue-500/10 p-3 text-blue-600">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pass Rate</p>
              <p className="text-2xl font-bold">{stats.passRate.toFixed(1)}%</p>
            </div>
          </div>
        </Card>

        <Card className="rounded-[2rem] border bg-white p-6 shadow-sm dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-orange-500/10 p-3 text-orange-600">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Duration</p>
              <p className="text-2xl font-bold">{Math.floor(stats.averageDuration / 60)}m</p>
            </div>
          </div>
        </Card>

        <Card className="rounded-[2rem] border bg-white p-6 shadow-sm dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-red-500/10 p-3 text-red-600">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Violations</p>
              <p className="text-2xl font-bold">{stats.violations}</p>
            </div>
          </div>
        </Card>

        <Card className="rounded-[2rem] border bg-white p-6 shadow-sm dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-purple-500/10 p-3 text-purple-600">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Disqualified</p>
              <p className="text-2xl font-bold">{stats.disqualified}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="rounded-[2rem] border bg-white p-6 shadow-sm dark:bg-slate-900">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Performance Overview
        </h2>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">Average Score</span>
              <span className="text-sm text-muted-foreground">{stats.averageScore.toFixed(1)}%</span>
            </div>
            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(stats.averageScore, 100)}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">Pass Rate</span>
              <span className="text-sm text-muted-foreground">{stats.passRate.toFixed(1)}%</span>
            </div>
            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(stats.passRate, 100)}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">Disqualification Rate</span>
              <span className="text-sm text-muted-foreground">{stats.totalSessions > 0 ? ((stats.disqualified / stats.totalSessions) * 100).toFixed(1) : 0}%</span>
            </div>
            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-red-500 rounded-full transition-all duration-500" style={{ width: `${stats.totalSessions > 0 ? Math.min((stats.disqualified / stats.totalSessions) * 100, 100) : 0}%` }} />
            </div>
          </div>
        </div>
      </Card>

      <Card className="rounded-[2rem] border bg-white p-6 shadow-sm dark:bg-slate-900">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Session Distribution
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl">
            <p className="text-3xl font-bold text-emerald-600">{stats.totalSessions - stats.disqualified}</p>
            <p className="text-sm text-muted-foreground mt-1">Completed</p>
          </div>
          <div className="text-center p-4 bg-red-50 dark:bg-red-950/20 rounded-xl">
            <p className="text-3xl font-bold text-red-600">{stats.disqualified}</p>
            <p className="text-sm text-muted-foreground mt-1">Disqualified</p>
          </div>
          <div className="text-center p-4 bg-orange-50 dark:bg-orange-950/20 rounded-xl">
            <p className="text-3xl font-bold text-orange-600">{stats.violations}</p>
            <p className="text-sm text-muted-foreground mt-1">Violations</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
