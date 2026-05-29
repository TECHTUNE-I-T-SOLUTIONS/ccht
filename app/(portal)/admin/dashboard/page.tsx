'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, BookOpen, FileText, CreditCard } from 'lucide-react'

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
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage school operations and content</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Users</p>
              <p className="text-3xl font-bold">{stats.users}</p>
            </div>
            <Users className="w-12 h-12 text-primary opacity-20" />
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Programs</p>
              <p className="text-3xl font-bold">{stats.programs}</p>
            </div>
            <BookOpen className="w-12 h-12 text-primary opacity-20" />
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Transactions</p>
              <p className="text-3xl font-bold">{stats.payments}</p>
            </div>
            <CreditCard className="w-12 h-12 text-primary opacity-20" />
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Blog Posts</p>
              <p className="text-3xl font-bold">{stats.posts}</p>
            </div>
            <FileText className="w-12 h-12 text-primary opacity-20" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Button className="w-full justify-start">
              <BookOpen className="w-4 h-4 mr-2" />
              Manage Programs
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Users className="w-4 h-4 mr-2" />
              Manage Users
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <FileText className="w-4 h-4 mr-2" />
              Create Blog Post
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <CreditCard className="w-4 h-4 mr-2" />
              View Payments
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">System Status</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Database</span>
              <span className="text-green-600 font-medium">Connected</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Auth Service</span>
              <span className="text-green-600 font-medium">Active</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Email Service</span>
              <span className="text-green-600 font-medium">Ready</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Paystack</span>
              <span className="text-green-600 font-medium">Connected</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
