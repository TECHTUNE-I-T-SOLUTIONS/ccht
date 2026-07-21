'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Users, TrendingUp, CheckCircle, Clock, AlertCircle, GraduationCap, BarChart3 } from 'lucide-react'

export default function AdminAnalyticsAspirantsPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inReview: 0,
    approved: 0,
    rejected: 0,
    admitted: 0,
    conversionRate: 0
  })

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/admin/management/aspirants/stats')
      if (res.ok) {
        const data = await res.json()
        const apiStats = data.data || stats
        // Calculate conversion rate if not provided
        const conversionRate = apiStats.conversionRate !== undefined 
          ? apiStats.conversionRate 
          : (apiStats.total > 0 ? (apiStats.admitted / apiStats.total) * 100 : 0)
        setStats({
          ...apiStats,
          conversionRate
        })
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
        <h1 className="mt-3 text-3xl font-extrabold">Aspirant Analytics</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-foreground/70">
          Comprehensive analytics and insights for aspirant applications and conversions.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-[2rem] border bg-white p-6 shadow-sm dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-primary/10 p-3 text-primary">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Aspirants</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </Card>

        <Card className="rounded-[2rem] border bg-white p-6 shadow-sm dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-yellow-500/10 p-3 text-yellow-600">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold">{stats.pending}</p>
            </div>
          </div>
        </Card>

        <Card className="rounded-[2rem] border bg-white p-6 shadow-sm dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-blue-500/10 p-3 text-blue-600">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">In Review</p>
              <p className="text-2xl font-bold">{stats.inReview}</p>
            </div>
          </div>
        </Card>

        <Card className="rounded-[2rem] border bg-white p-6 shadow-sm dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-600">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Approved</p>
              <p className="text-2xl font-bold">{stats.approved}</p>
            </div>
          </div>
        </Card>

        <Card className="rounded-[2rem] border bg-white p-6 shadow-sm dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-red-500/10 p-3 text-red-600">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Rejected</p>
              <p className="text-2xl font-bold">{stats.rejected}</p>
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
              <p className="text-2xl font-bold">{stats.admitted}</p>
            </div>
          </div>
        </Card>

        <Card className="rounded-[2rem] border bg-white p-6 shadow-sm dark:bg-slate-900 md:col-span-2">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-green-500/10 p-3 text-green-600">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Conversion Rate</p>
              <p className="text-2xl font-bold">{stats.conversionRate.toFixed(1)}%</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="rounded-[2rem] border bg-white p-6 shadow-sm dark:bg-slate-900">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Application Trends
        </h2>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">Pending</span>
              <span className="text-sm text-muted-foreground">{stats.pending}</span>
            </div>
            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-yellow-500 rounded-full transition-all duration-500" style={{ width: `${stats.total > 0 ? (stats.pending / stats.total) * 100 : 0}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">In Review</span>
              <span className="text-sm text-muted-foreground">{stats.inReview}</span>
            </div>
            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${stats.total > 0 ? (stats.inReview / stats.total) * 100 : 0}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">Approved</span>
              <span className="text-sm text-muted-foreground">{stats.approved}</span>
            </div>
            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${stats.total > 0 ? (stats.approved / stats.total) * 100 : 0}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">Rejected</span>
              <span className="text-sm text-muted-foreground">{stats.rejected}</span>
            </div>
            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-red-500 rounded-full transition-all duration-500" style={{ width: `${stats.total > 0 ? (stats.rejected / stats.total) * 100 : 0}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">Admitted</span>
              <span className="text-sm text-muted-foreground">{stats.admitted}</span>
            </div>
            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-purple-500 rounded-full transition-all duration-500" style={{ width: `${stats.total > 0 ? (stats.admitted / stats.total) * 100 : 0}%` }} />
            </div>
          </div>
        </div>
      </Card>

      <Card className="rounded-[2rem] border bg-white p-6 shadow-sm dark:bg-slate-900">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Conversion Funnel
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-xl">
            <p className="text-3xl font-bold text-blue-600">{stats.pending + stats.inReview}</p>
            <p className="text-sm text-muted-foreground mt-1">In Process</p>
          </div>
          <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl">
            <p className="text-3xl font-bold text-emerald-600">{stats.approved}</p>
            <p className="text-sm text-muted-foreground mt-1">Approved</p>
          </div>
          <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-xl">
            <p className="text-3xl font-bold text-purple-600">{stats.admitted}</p>
            <p className="text-sm text-muted-foreground mt-1">Admitted</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
