'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, BookOpen, FileText } from 'lucide-react'

export default function TeacherDashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        setUser(data)
      }
      setLoading(false)
    }

    getUser()
  }, [])

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Welcome, {user?.first_name || 'Lecturer'}</h1>
        <p className="text-muted-foreground">Manage your courses, students, and grades</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">My Courses</p>
              <p className="text-3xl font-bold">0</p>
            </div>
            <BookOpen className="w-12 h-12 text-primary opacity-20" />
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Students</p>
              <p className="text-3xl font-bold">0</p>
            </div>
            <Users className="w-12 h-12 text-primary opacity-20" />
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Grades Entered</p>
              <p className="text-3xl font-bold">0</p>
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
              View My Courses
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Users className="w-4 h-4 mr-2" />
              Manage Students
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <FileText className="w-4 h-4 mr-2" />
              Enter Grades
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Account Info</h2>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-muted-foreground">Email</p>
              <p className="font-medium">{user?.email}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Phone</p>
              <p className="font-medium">{user?.phone || 'Not set'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Status</p>
              <p className={`font-medium ${user?.is_active ? 'text-green-600' : 'text-red-600'}`}>
                {user?.is_active ? 'Active' : 'Inactive'}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
