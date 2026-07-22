'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, BarChart3, Loader2, BookOpen, Clock, Calendar } from 'lucide-react'
import Link from 'next/link'

export default function TeachingAnalyticsPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      const { data: entries } = await supabase
        .from('timetable_entries')
        .select('course_id, day_of_week, start_time, end_time')

      const totalClasses = entries?.length || 0
      const courseIds = entries?.map((e: any) => e.course_id) || []
      const uniqueCourses = new Set(courseIds).size
      
      // Calculate total hours
      let totalHours = 0
      ;(entries || []).forEach((entry: any) => {
        const start = new Date(`2000-01-01T${entry.start_time}`)
        const end = new Date(`2000-01-01T${entry.end_time}`)
        totalHours += (end.getTime() - start.getTime()) / (1000 * 60 * 60)
      })

      setStats({
        totalClasses,
        uniqueCourses,
        totalHours: Math.round(totalHours * 100) / 100
      })
    } catch (error) {
      console.error('Failed to load analytics:', error)
      toast.error('Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/management/lecturers">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Teaching Statistics</h1>
          <p className="mt-1 text-sm text-muted-foreground">Overall teaching activity metrics</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Classes</p>
              <p className="text-3xl font-bold">{stats?.totalClasses || 0}</p>
            </div>
            <Calendar className="h-8 w-8 text-blue-600" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Courses</p>
              <p className="text-3xl font-bold">{stats?.uniqueCourses || 0}</p>
            </div>
            <BookOpen className="h-8 w-8 text-purple-600" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Hours</p>
              <p className="text-3xl font-bold">{stats?.totalHours || 0}</p>
            </div>
            <Clock className="h-8 w-8 text-emerald-600" />
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Teaching Overview</h3>
        <div className="text-center py-12 text-muted-foreground">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Detailed teaching statistics will be available with more data</p>
        </div>
      </Card>
    </div>
  )
}