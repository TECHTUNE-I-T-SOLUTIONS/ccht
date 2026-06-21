'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen, Users, FileText, ClipboardCheck, Video, ArrowRight } from 'lucide-react'

export default function TeacherDashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        setUser(data)
      }
      setLoading(false)
    }
    getUser()
  }, [])

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="space-y-8">
      <div className="rounded-[2rem] border border-border bg-[linear-gradient(160deg,hsl(var(--primary)/0.12),hsl(var(--secondary)/0.08),hsl(var(--card)))] p-6 md:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Lecturer dashboard</p>
        <h1 className="mt-3 text-3xl font-extrabold md:text-5xl">Teaching and assessment workspace</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-foreground/70">
          Manage your course list, student records, assessments, class activity, and uploads from a clean academic dashboard.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: 'My courses', value: 0, icon: BookOpen },
          { label: 'Students assigned', value: 0, icon: Users },
          { label: 'Results uploaded', value: 0, icon: FileText },
        ].map((item) => {
          const Icon = item.icon
          return (
            <Card key={item.label} className="rounded-3xl p-6">
              <Icon className="h-5 w-5 text-primary" />
              <p className="mt-4 text-sm text-muted-foreground">{item.label}</p>
              <p className="mt-1 text-2xl font-bold">{item.value}</p>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="rounded-[2rem] p-6">
          <h2 className="text-2xl font-bold">Teaching modules</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              'Course outline and content management',
              'Assignments and continuous assessment',
              'Online class session links',
              'Exam schedules and quizzes',
              'Results upload and grade entry',
              'Student progress and feedback',
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-border bg-background p-4 text-sm">{item}</div>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-[2rem] p-6">
            <h2 className="text-2xl font-bold">Quick actions</h2>
            <div className="mt-4 space-y-3">
              <Button className="w-full justify-start rounded-2xl">
                <ClipboardCheck className="mr-2 h-4 w-4" />
                Enter grades
              </Button>
              <Button variant="outline" className="w-full justify-start rounded-2xl">
                <Video className="mr-2 h-4 w-4" />
                Start online class
              </Button>
              <Button variant="outline" className="w-full justify-start rounded-2xl">
                <ArrowRight className="mr-2 h-4 w-4" />
                View assigned students
              </Button>
            </div>
          </Card>

          <Card className="rounded-[2rem] p-6">
            <h2 className="text-2xl font-bold">Account info</h2>
            <p className="mt-3 text-sm text-muted-foreground">{user?.email}</p>
          </Card>
        </div>
      </div>
    </div>
  )
}
