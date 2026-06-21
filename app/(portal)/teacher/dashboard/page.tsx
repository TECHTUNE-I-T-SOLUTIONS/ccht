'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen, Users, FileText, ClipboardCheck, Video, ArrowRight, UserRound } from 'lucide-react'

export default function TeacherDashboard() {
  const [user, setUser] = useState<any>(null)
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const [profileRes, coursesRes] = await Promise.all([
          supabase.from('profiles').select('id, email, first_name, last_name, phone, role, avatar_url').eq('id', user.id).single(),
          supabase.from('programs').select('id, title, slug').order('created_at', { ascending: false }).limit(3),
        ])
        setUser(profileRes.data)
        setCourses(coursesRes.data || [])
      }
      setLoading(false)
    }
    getUser()
  }, [])

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="space-y-8">
      <div className="rounded-[2rem] border border-border bg-[linear-gradient(160deg,hsl(var(--primary)/0.12),hsl(var(--secondary)/0.08),hsl(var(--card)))] p-6 md:p-8">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-border bg-background">
            {user?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatar_url} alt={user?.first_name || 'Lecturer'} className="h-full w-full object-cover" />
            ) : (
              <UserRound className="h-8 w-8 text-primary" />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Lecturer dashboard</p>
            <h1 className="mt-2 text-3xl font-extrabold md:text-5xl">Teaching and assessment workspace</h1>
            <p className="mt-2 text-sm text-foreground/70">{user?.email}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: 'My courses', value: String(courses.length), icon: BookOpen },
          { label: 'Students assigned', value: '24', icon: Users },
          { label: 'Results uploaded', value: '12', icon: FileText },
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
              <Button asChild className="w-full justify-start rounded-2xl">
                <Link href="/teacher/grades">
                  <ClipboardCheck className="mr-2 h-4 w-4" />
                  Enter grades
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start rounded-2xl">
                <Link href="/teacher/sessions">
                  <Video className="mr-2 h-4 w-4" />
                  Start online class
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start rounded-2xl">
                <Link href="/teacher/students">
                  <ArrowRight className="mr-2 h-4 w-4" />
                  View assigned students
                </Link>
              </Button>
            </div>
          </Card>

          <Card className="rounded-[2rem] p-6">
            <h2 className="text-2xl font-bold">Recent activity</h2>
            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
              {courses.length === 0 ? (
                <p>No courses assigned yet.</p>
              ) : (
                courses.map((course) => (
                  <div key={course.id} className="rounded-2xl border border-border bg-background p-4">
                    <p className="font-semibold text-foreground">{course.title}</p>
                    <p className="text-xs text-muted-foreground">{course.slug}</p>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
