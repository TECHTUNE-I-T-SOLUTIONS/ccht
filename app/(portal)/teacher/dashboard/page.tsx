'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen, Users, FileText, ClipboardCheck, Video, ArrowRight, UserRound, Award, CalendarDays, Bell, Clock3 } from 'lucide-react'

export default function TeacherDashboard() {
  const [user, setUser] = useState<any>(null)
  const [assignments, setAssignments] = useState<any[]>([])
  const [exams, setExams] = useState<any[]>([])
  const [notices, setNotices] = useState<any[]>([])
  const [stats, setStats] = useState({ coursesCount: 0, noticesCount: 0, resultsCount: 0 })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const [meRes, dashboardRes] = await Promise.all([
        fetch('/api/v1/auth/me').then((res) => res.json()),
        fetch('/api/v1/teacher/dashboard').then((res) => res.json()),
      ])

      const me = meRes?.user || null
      const dashboard = dashboardRes?.data || {}
      if (me) {
        setUser({
          id: me.id,
          email: me.email,
          first_name: me.firstName,
          last_name: me.lastName,
          phone: me.phone,
          role: me.role,
          avatar_url: me.avatarUrl,
        })
        setAssignments(dashboard.assignments || [])
        setExams(dashboard.exams || [])
        setNotices(dashboard.notices || [])
        setStats({
          coursesCount: dashboard.coursesCount || 0,
          noticesCount: dashboard.noticeCount || 0,
          resultsCount: dashboard.resultsCount || 0,
        })
      }
      setLoading(false)
    }
    getUser()
  }, [])

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="space-y-8">
      <div className="rounded-[2rem] border border-border bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.12),transparent_30%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--accent-soft)))] p-6 md:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-border bg-white">
              {typeof user?.avatar_url === 'string' && user.avatar_url.startsWith('http') ? (
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
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: 'Courses', value: String(stats.coursesCount), icon: BookOpen },
              { label: 'Assessments', value: String(exams.length), icon: FileText },
              { label: 'Class sessions', value: String(exams.length), icon: CalendarDays },
            ].map((item) => {
              const Icon = item.icon
              return (
                <div key={item.label} className="rounded-2xl border border-border bg-white p-4 dark:bg-blue-800/20">
                  <Icon className="h-5 w-5 text-primary" />
                  <p className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">{item.label}</p>
                  <p className="mt-1 text-2xl font-black">{item.value}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: 'My courses', value: String(stats.coursesCount), icon: BookOpen },
          { label: 'Lecturer notices', value: String(stats.noticesCount), icon: Bell },
          { label: 'Results uploaded', value: String(stats.resultsCount), icon: Award },
        ].map((item) => {
          const Icon = item.icon
          return (
            <Card key={item.label} className="rounded-3xl border bg-white p-6 shadow-sm dark:bg-blue-800/20">
              <Icon className="h-5 w-5 text-primary" />
              <p className="mt-4 text-sm text-muted-foreground">{item.label}</p>
              <p className="mt-1 text-2xl font-bold">{item.value}</p>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="rounded-[2rem] border bg-white p-6 shadow-sm dark:bg-blue-800/20">
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
              <div key={item} className="rounded-2xl border border-border bg-slate-50 p-4 text-sm dark:bg-blue-800/20">{item}</div>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-[2rem] border bg-white p-6 shadow-sm dark:bg-blue-800/20">
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
              <Button asChild variant="outline" className="w-full justify-start rounded-2xl">
                <Link href="/teacher/notifications">
                  <Bell className="mr-2 h-4 w-4" />
                  View notifications
                </Link>
              </Button>
            </div>
          </Card>

          <Card className="rounded-[2rem] border bg-white p-6 shadow-sm dark:bg-blue-800/20">
            <h2 className="text-2xl font-bold">Recent activity</h2>
            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
              {assignments.length === 0 ? (
                <p>No courses assigned yet.</p>
              ) : (
                assignments.map((assignment) => (
                  <div key={assignment.id} className="rounded-2xl border border-border bg-slate-50 p-4 dark:bg-blue-800/20">
                    <p className="font-semibold text-foreground">{assignment.title}</p>
                    <p className="text-xs text-muted-foreground">{assignment.course_name || assignment.course?.code || 'Assigned course'}</p>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="rounded-[2rem] border bg-white p-6 shadow-sm dark:bg-blue-800/20">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-orange-500/10 p-3 text-orange-600"><Clock3 className="h-5 w-5" /></div>
              <div>
                <h2 className="text-2xl font-bold">Notices</h2>
                <p className="text-sm text-muted-foreground">Important information</p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {notices.length === 0 ? (
                <p className="text-sm text-muted-foreground">No notices yet.</p>
              ) : (
                notices.map((notice) => (
                  <div key={notice.id} className={`rounded-2xl border border-border p-4 ${
                    notice.priority === 'urgent' ? 'bg-red-50 dark:bg-red-900/10' :
                    notice.priority === 'high' ? 'bg-orange-50 dark:bg-orange-900/10' :
                    'bg-slate-50'
                  }`}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-foreground">{notice.title}</p>
                      <span className={`text-xs px-2 py-1 rounded ${
                        notice.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                        notice.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {notice.priority}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{notice.content}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {new Date(notice.published_at || notice.created_at).toLocaleDateString()}
                    </p>
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
