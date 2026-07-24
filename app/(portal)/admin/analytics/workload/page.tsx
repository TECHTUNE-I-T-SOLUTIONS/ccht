'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, BarChart3, Loader2, Clock, BookOpen, Users } from 'lucide-react'
import Link from 'next/link'

export default function WorkloadAnalyticsPage() {
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
        .select('lecturer_id, start_time, end_time')

      // Calculate workload by lecturer
      const workloadMap: Record<string, { hours: number; classes: number }> = {}
      ;(entries || []).forEach((entry: any) => {
        const start = new Date(`2000-01-01T${entry.start_time}`)
        const end = new Date(`2000-01-01T${entry.end_time}`)
        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
        
        if (!workloadMap[entry.lecturer_id]) {
          workloadMap[entry.lecturer_id] = { hours: 0, classes: 0 }
        }
        const workload = workloadMap[entry.lecturer_id]
        workload.hours += hours
        workload.classes += 1
      })

      const workloads = Object.values(workloadMap)

      setStats({
        totalLecturers: workloads.length,
        averageHours: workloads.reduce((sum, w) => sum + w.hours, 0) / (workloads.length || 1),
        totalClasses: workloads.reduce((sum, w) => sum + w.classes, 0)
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
          <h1 className="text-3xl font-bold">Workload Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">Workload distribution across lecturers</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Lecturers</p>
              <p className="text-3xl font-bold">{stats?.totalLecturers || 0}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Hours/Week</p>
              <p className="text-3xl font-bold">{Math.round(stats?.averageHours || 0)}</p>
            </div>
            <Clock className="h-8 w-8 text-purple-600" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Classes</p>
              <p className="text-3xl font-bold">{stats?.totalClasses || 0}</p>
            </div>
            <BookOpen className="h-8 w-8 text-emerald-600" />
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Workload Distribution</h3>
        <div className="text-center py-12 text-muted-foreground">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Detailed workload charts will be available with more data</p>
        </div>
      </Card>
    </div>
  )
}
