'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { TrendingUp, Award, Target, BarChart3, Zap, BookOpen } from 'lucide-react'

export default function AdminAnalyticsPerformancePage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    averageScore: 0,
    highestScore: 0,
    lowestScore: 0,
    passRate: 0,
    totalAssessments: 0,
    totalSubmissions: 0
  })

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/admin/analytics/performance')
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
        <h1 className="mt-3 text-3xl font-extrabold">Performance Analytics</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-foreground/70">
          Comprehensive analytics and insights for student assessment performance.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="rounded-[2rem] border bg-white p-6 shadow-sm dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-primary/10 p-3 text-primary">
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
            <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-600">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Highest Score</p>
              <p className="text-2xl font-bold">{stats.highestScore}%</p>
            </div>
          </div>
        </Card>

        <Card className="rounded-[2rem] border bg-white p-6 shadow-sm dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-red-500/10 p-3 text-red-600">
              <Target className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Lowest Score</p>
              <p className="text-2xl font-bold">{stats.lowestScore}%</p>
            </div>
          </div>
        </Card>

        <Card className="rounded-[2rem] border bg-white p-6 shadow-sm dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-blue-500/10 p-3 text-blue-600">
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pass Rate</p>
              <p className="text-2xl font-bold">{stats.passRate.toFixed(1)}%</p>
            </div>
          </div>
        </Card>

        <Card className="rounded-[2rem] border bg-white p-6 shadow-sm dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-purple-500/10 p-3 text-purple-600">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Assessments</p>
              <p className="text-2xl font-bold">{stats.totalAssessments}</p>
            </div>
          </div>
        </Card>

        <Card className="rounded-[2rem] border bg-white p-6 shadow-sm dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-orange-500/10 p-3 text-orange-600">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Submissions</p>
              <p className="text-2xl font-bold">{stats.totalSubmissions}</p>
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
              <span className="text-sm font-medium">Highest Score</span>
              <span className="text-sm text-muted-foreground">{stats.highestScore}%</span>
            </div>
            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-purple-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(stats.highestScore, 100)}%` }} />
            </div>
          </div>
        </div>
      </Card>

      <Card className="rounded-[2rem] border bg-white p-6 shadow-sm dark:bg-slate-900">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Assessment Statistics
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-primary/10 rounded-xl">
            <p className="text-3xl font-bold text-primary">{stats.totalAssessments}</p>
            <p className="text-sm text-muted-foreground mt-1">Total Assessments</p>
          </div>
          <div className="text-center p-4 bg-orange-500/10 rounded-xl">
            <p className="text-3xl font-bold text-orange-600">{stats.totalSubmissions}</p>
            <p className="text-sm text-muted-foreground mt-1">Total Submissions</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
