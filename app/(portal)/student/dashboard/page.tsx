'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen, CreditCard, FileText, ReceiptText, ArrowRight, BadgeCheck, UserRound, Award, Clock3 } from 'lucide-react'

export default function StudentDashboard() {
  const [user, setUser] = useState<any>(null)
  const [studentProfile, setStudentProfile] = useState<any>(null)
  const [payments, setPayments] = useState<any[]>([])
  const [results, setResults] = useState<any[]>([])
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const [profileRes, studentProfileRes, paymentsRes, aspirantPaymentsRes, resultsRes, enrollmentsRes] = await Promise.all([
          supabase.from('profiles').select('id, email, first_name, last_name, phone, role, avatar_url').eq('id', user.id).single(),
          supabase.from('student_profiles').select('*').eq('profile_id', user.id).single(),
          supabase.from('payments').select('id, amount, status, created_at, description').order('created_at', { ascending: false }).limit(4),
          supabase.from('aspirant_admission_payment').select('id, amount, status, created_at, description').eq('profile_id', user.id).order('created_at', { ascending: false }).limit(4),
          supabase.from('results').select('id, course_name, score, grade, semester, academic_year, created_at').eq('student_id', user.id).order('created_at', { ascending: false }).limit(4),
          supabase.from('enrollments').select('*, program:programs(title)').eq('student_id', user.id).eq('status', 'active'),
        ])
        setUser(profileRes.data)
        setStudentProfile(studentProfileRes.data)
        
        // Combine regular payments and aspirant payments
        const allPayments = [
          ...(paymentsRes.data || []).map((p: any) => ({ ...p, source: 'payments' })),
          ...(aspirantPaymentsRes.data || []).map((p: any) => ({ ...p, source: 'aspirant' }))
        ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 4)
        
        setPayments(allPayments)
        setResults(resultsRes.data || [])
        setEnrollments(enrollmentsRes.data || [])
      }
      setLoading(false)
    }
    getUser()
  }, [])

  if (loading) return <div className="p-8">Loading...</div>

  // Calculate profile completion based on student_profiles fields
  const calculateProfileCompletion = () => {
    if (!studentProfile) return 0
    const fields = [
      'date_of_birth',
      'gender',
      'blood_group',
      'genotype',
      'state_of_origin',
      'local_government_area',
      'nationality',
      'address_line_1',
      'city',
      'state',
      'guardian_name',
      'guardian_phone',
      'guardian_email',
      'emergency_contact_name',
      'emergency_contact_phone'
    ]
    const filledFields = fields.filter(field => studentProfile[field] !== null && studentProfile[field] !== '').length
    return Math.round((filledFields / fields.length) * 100)
  }

  // Calculate pending fees (unpaid payments)
  const pendingFees = payments.filter(p => p.status !== 'success' && p.status !== 'paid').reduce((sum, p) => sum + (p.amount || 0), 0)

  const stats = [
    { label: 'Registered courses', value: String(enrollments.length), icon: BookOpen },
    { label: 'Pending fees', value: pendingFees > 0 ? `₦${pendingFees.toLocaleString()}` : '₦0', icon: CreditCard },
    { label: 'Recent payments', value: String(payments.length), icon: FileText },
    { label: 'Profile completion', value: `${calculateProfileCompletion()}%`, icon: BadgeCheck },
  ]

  return (
    <div className="space-y-8">
      <div className="rounded-[2rem] border border-border bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.12),transparent_30%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--accent-soft)))] p-6 md:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-border bg-white">
              {user?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatar_url} alt={user?.first_name || 'Student'} className="h-full w-full object-cover" />
              ) : (
                <UserRound className="h-8 w-8 text-primary" />
              )}
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Student portal</p>
              <h1 className="mt-2 text-3xl font-extrabold md:text-5xl">Welcome, {user?.first_name || 'Student'}</h1>
              <p className="mt-2 text-sm text-foreground/70">{user?.email}</p>
            </div>
          </div>
          <p className="max-w-2xl text-sm leading-7 text-foreground/70">
            Manage your academic progress, course registration, results, payments, and records from one clean portal.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => {
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
          <h2 className="text-2xl font-bold">Quick actions</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Button asChild className="justify-start rounded-2xl">
              <Link href="/student/courses"><BookOpen className="mr-2 h-4 w-4" />Register courses</Link>
            </Button>
            <Button asChild variant="outline" className="justify-start rounded-2xl">
              <Link href="/student/results"><FileText className="mr-2 h-4 w-4" />View results</Link>
            </Button>
            <Button asChild variant="outline" className="justify-start rounded-2xl">
              <Link href="/student/payments"><CreditCard className="mr-2 h-4 w-4" />Pay fees</Link>
            </Button>
            <Button asChild variant="outline" className="justify-start rounded-2xl">
              <Link href="/student/payments"><ReceiptText className="mr-2 h-4 w-4" />Download receipt</Link>
            </Button>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-[2rem] border bg-white p-6 shadow-sm dark:bg-blue-800/20">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-primary/10 p-3 text-primary"><Award className="h-5 w-5" /></div>
              <div>
                <h2 className="text-2xl font-bold">Latest results</h2>
                <p className="text-sm text-muted-foreground">Recent academic entries</p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {results.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent results yet.</p>
              ) : (
                results.map((result) => (
                  <div key={result.id} className="rounded-2xl border border-border bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-foreground">{result.course_name}</p>
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                        {result.grade || 'N/A'}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Score: {result.score ?? 'N/A'} · Semester {result.semester || 1} · {result.academic_year || ''}
                    </p>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="rounded-[2rem] border bg-white p-6 shadow-sm dark:bg-blue-800/20">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-primary/10 p-3 text-primary"><Clock3 className="h-5 w-5" /></div>
              <div>
                <h2 className="text-2xl font-bold">Recent activity</h2>
                <p className="text-sm text-muted-foreground">Payment history</p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {payments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent payments found.</p>
              ) : (
                payments.map((payment) => (
                  <div key={payment.id} className="rounded-2xl border border-border bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold">Payment update</p>
                      <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{payment.status}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">Amount: ₦{payment.amount}</p>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card className="rounded-[2rem] border bg-white p-6 shadow-sm dark:bg-blue-800/20">
            <h2 className="text-2xl font-bold">Need help?</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              Contact support if a record is missing or a payment needs review.
            </p>
            <Link href="/contact" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">
              Contact support <ArrowRight className="h-4 w-4" />
            </Link>
          </Card>
        </div>
      </div>
    </div>
  )
}
