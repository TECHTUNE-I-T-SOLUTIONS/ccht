'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, BarChart3, Loader2, Users, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export default function LecturerRetentionPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      const { data: lecturers } = await supabase
        .from('profiles')
        .select('*, teacher_profiles(*)')
        .eq('role', 'lecturer')

      const total = lecturers?.length || 0
      const active = lecturers?.filter((l: any) => l.teacher_profiles?.employment_status === 'active').length || 0
      const retentionRate = total > 0 ? (active / total) * 100 : 0

      setStats({
        total,
        active,
        retentionRate: Math.round(retentionRate)
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
          <h1 className="text-3xl font-bold">Lecturer Retention</h1>
          <p className="mt-1 text-sm text-muted-foreground">Lecturer retention metrics and trends</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Lecturers</p>
              <p className="text-3xl font-bold">{stats?.total || 0}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-3xl font-bold text-emerald-600">{stats?.active || 0}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-emerald-600" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Retention Rate</p>
              <p className="text-3xl font-bold">{stats?.retentionRate || 0}%</p>
            </div>
            <BarChart3 className="h-8 w-8 text-purple-600" />
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Retention Overview</h3>
        <div className="text-center py-12 text-muted-foreground">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Detailed retention analytics will be available with more data</p>
        </div>
      </Card>
    </div>
  )
}