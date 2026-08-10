'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { BookOpen, CreditCard, FileText, ReceiptText, ArrowRight, BadgeCheck, UserRound, Award, Clock3, Bell, AlertTriangle, FolderOpen } from 'lucide-react'

export default function StudentDashboard() {
  const [user, setUser] = useState<any>(null)
  const [studentProfile, setStudentProfile] = useState<any>(null)
  const [payments, setPayments] = useState<any[]>([])
  const [results, setResults] = useState<any[]>([])
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [notices, setNotices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [missingFields, setMissingFields] = useState<string[]>([])
  const [profileForm, setProfileForm] = useState<Record<string, string>>({})
  const [savingProfile, setSavingProfile] = useState(false)
  const [academicSessions, setAcademicSessions] = useState<{ id: string; name: string }[]>([])
  const [examEligibility, setExamEligibility] = useState<any>(null)
  const [checkingEligibility, setCheckingEligibility] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const [profileRes, studentProfileRes, paymentsRes, aspirantPaymentsRes, resultsRes, enrollmentsRes, announcementsRes, noticesRes, sessionRes] = await Promise.all([
          supabase.from('profiles').select('id, email, first_name, last_name, phone, role, avatar_url').eq('id', user.id).single(),
          supabase.from('student_profiles').select('*').eq('profile_id', user.id).single(),
          supabase.from('payments').select('id, amount, status, created_at, description').order('created_at', { ascending: false }).limit(4),
          supabase.from('aspirant_admission_payments').select('id, amount, status, created_at, description').eq('profile_id', user.id).order('created_at', { ascending: false }).limit(4),
          supabase.from('results').select('id, course_name, score, grade, semester, academic_year, created_at').eq('student_id', user.id).order('created_at', { ascending: false }).limit(4),
          supabase.from('enrollments').select('*, program:programs(title)').eq('student_id', user.id).eq('status', 'active'),
          supabase.from('announcements').select('*').eq('is_published', true).order('published_at', { ascending: false }).limit(3),
          supabase.from('notices').select('*').eq('is_published', true).in('audience', ['all', 'students']).order('published_at', { ascending: false }).limit(3),
          supabase.from('academic_sessions').select('id, name').eq('is_active', true).order('name'),
        ])
        setUser(profileRes.data)
        setStudentProfile(studentProfileRes.data)
        setAcademicSessions(sessionRes.data || [])
        
        // Check for missing fields
        if (studentProfileRes.data) {
          const requiredFields = [
            { key: 'admission_session', label: 'Academic Session', type: 'select' },
            { key: 'admission_date', label: 'Admission Date', type: 'date' },
            { key: 'date_of_birth', label: 'Date of Birth', type: 'date' },
            { key: 'gender', label: 'Gender', type: 'select', options: ['male', 'female', 'other'] },
            { key: 'blood_group', label: 'Blood Group', type: 'select', options: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
            { key: 'genotype', label: 'Genotype', type: 'select', options: ['AA', 'AS', 'AC', 'SS', 'SC'] },
            { key: 'nationality', label: 'Nationality', type: 'select', options: ['Nigerian', 'Ghanaian', 'Beninese', 'Nigerien', 'Cameroonian', 'Other'] },
            { key: 'state_of_origin', label: 'State of Origin', type: 'text' },
            { key: 'local_government_area', label: 'Local Government Area', type: 'text' },
            { key: 'address_line_1', label: 'Address Line 1', type: 'text' },
            { key: 'city', label: 'City', type: 'text' },
            { key: 'state', label: 'State (Residence)', type: 'text' },
            { key: 'guardian_name', label: 'Guardian Name', type: 'text' },
            { key: 'guardian_phone', label: 'Guardian Phone', type: 'text' },
            { key: 'guardian_email', label: 'Guardian Email', type: 'email' },
            { key: 'emergency_contact_name', label: 'Emergency Contact Name', type: 'text' },
            { key: 'emergency_contact_phone', label: 'Emergency Contact Phone', type: 'text' },
            { key: 'current_level', label: 'Current Level', type: 'select', options: ['100', '200', '300', '400', '500'] },
          ]
          
          const missing = requiredFields.filter(field => {
            const value = studentProfileRes.data[field.key]
            return value === null || value === '' || value === undefined
          })
          
          if (missing.length > 0) {
            setMissingFields(missing.map(f => f.key))
            setProfileForm(missing.reduce((acc, field) => {
              acc[field.key] = studentProfileRes.data[field.key] || ''
              return acc
            }, {} as Record<string, string>))
            setShowProfileModal(true)
          }

          // Check exam eligibility when student profile is loaded
          if (studentProfileRes.data.admission_session) {
            checkExamEligibilityFunction(studentProfileRes.data.admission_session)
          }
        }
        
        // Combine regular payments and aspirant payments
        const allPayments = [
          ...(paymentsRes.data || []).map((p: any) => ({ ...p, source: 'payments' })),
          ...(aspirantPaymentsRes.data || []).map((p: any) => ({ ...p, source: 'aspirant' }))
        ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 4)
        
        setPayments(allPayments)
        setResults(resultsRes.data || [])
        setEnrollments(enrollmentsRes.data || [])
        setAnnouncements(announcementsRes.data || [])
        setNotices(noticesRes.data || [])
      }
      setLoading(false)
    }
    getUser()
  }, [])

  const checkExamEligibilityFunction = async (admissionSession: string) => {
    setCheckingEligibility(true)
    try {
      // Get current session ID
      const { data: sessionData } = await supabase
        .from('academic_sessions')
        .select('id')
        .eq('name', admissionSession)
        .single()

      if (!sessionData) return

      const response = await fetch(`/api/v1/student/exam-eligibility?sessionId=${sessionData.id}`)
      const data = await response.json()
      
      if (response.ok) {
        setExamEligibility(data.data)
      }
    } catch (error) {
      console.error('Error checking exam eligibility:', error)
    } finally {
      setCheckingEligibility(false)
    }
  }

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
      'emergency_contact_phone',
      'admission_session',
      'admission_date',
      'current_level'
    ]
    const filledFields = fields.filter(field => studentProfile[field] !== null && studentProfile[field] !== '').length
    return Math.round((filledFields / fields.length) * 100)
  }

  const saveProfile = async () => {
    setSavingProfile(true)
    try {
      const { error } = await supabase
        .from('student_profiles')
        .update(profileForm)
        .eq('profile_id', user.id)
      
      if (error) throw error
      
      // Refresh student profile
      const { data: updatedProfile } = await supabase.from('student_profiles').select('*').eq('profile_id', user.id).single()
      setStudentProfile(updatedProfile)
      setShowProfileModal(false)
      setMissingFields([])
      
      // Re-check eligibility after profile update
      if (updatedProfile?.admission_session) {
        checkExamEligibilityFunction(updatedProfile.admission_session)
      }
    } catch (error) {
      console.error('Failed to update profile:', error)
      alert('Failed to update profile. Please try again.')
    } finally {
      setSavingProfile(false)
    }
  }

  const requiredFields = [
    { key: 'admission_session', label: 'Academic Session', type: 'select' },
    { key: 'admission_date', label: 'Admission Date', type: 'date' },
    { key: 'date_of_birth', label: 'Date of Birth', type: 'date' },
    { key: 'gender', label: 'Gender', type: 'select', options: ['male', 'female', 'other'] },
    { key: 'blood_group', label: 'Blood Group', type: 'select', options: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
    { key: 'genotype', label: 'Genotype', type: 'select', options: ['AA', 'AS', 'AC', 'SS', 'SC'] },
    { key: 'nationality', label: 'Nationality', type: 'select', options: ['Nigerian', 'Ghanaian', 'Beninese', 'Nigerien', 'Cameroonian', 'Other'] },
    { key: 'state_of_origin', label: 'State of Origin', type: 'text' },
    { key: 'local_government_area', label: 'Local Government Area', type: 'text' },
    { key: 'address_line_1', label: 'Address Line 1', type: 'text' },
    { key: 'city', label: 'City', type: 'text' },
    { key: 'state', label: 'State (Residence)', type: 'text' },
    { key: 'guardian_name', label: 'Guardian Name', type: 'text' },
    { key: 'guardian_phone', label: 'Guardian Phone', type: 'text' },
    { key: 'guardian_email', label: 'Guardian Email', type: 'email' },
    { key: 'emergency_contact_name', label: 'Emergency Contact Name', type: 'text' },
    { key: 'emergency_contact_phone', label: 'Emergency Contact Phone', type: 'text' },
    { key: 'current_level', label: 'Current Level', type: 'select', options: ['100', '200', '300', '400', '500'] },
  ]

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
      <Dialog open={showProfileModal} onOpenChange={() => {}}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Complete Your Profile
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Please complete the following required fields to continue using the student portal. These fields are mandatory for your academic records.
            </p>
            <div className="grid gap-4">
              {requiredFields.filter(field => missingFields.includes(field.key)).map((field) => (
                <div key={field.key}>
                  <Label>{field.label}</Label>
                  {field.type === 'select' ? (
                    <Select 
                      value={profileForm[field.key] || ''} 
                      onValueChange={(value) => setProfileForm({ ...profileForm, [field.key]: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {field.key === 'admission_session' ? (
                          academicSessions.map((session) => (
                            <SelectItem key={session.id} value={session.name}>{session.name}</SelectItem>
                          ))
                        ) : (
                          field.options?.map((option) => (
                            <SelectItem key={option} value={option}>{option}</SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  ) : field.type === 'date' ? (
                    <Input 
                      type="date" 
                      value={profileForm[field.key] || ''} 
                      onChange={(e) => setProfileForm({ ...profileForm, [field.key]: e.target.value })} 
                    />
                  ) : (
                    <Input 
                      type={field.type} 
                      value={profileForm[field.key] || ''} 
                      onChange={(e) => setProfileForm({ ...profileForm, [field.key]: e.target.value })} 
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                    />
                  )}
                </div>
              ))}
            </div>
            <Button 
              className="w-full" 
              onClick={saveProfile} 
              disabled={savingProfile || missingFields.some(key => !profileForm[key] || profileForm[key] === '')}
            >
              {savingProfile ? 'Saving...' : 'Complete Profile'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
            <Button asChild className="justify-start rounded-2xl border border-primary">
              <Link href="/student/courses"><BookOpen className="mr-2 h-4 w-4" />Register courses</Link>
            </Button>
            <Button asChild variant="outline" className="justify-start rounded-2xl">
              <Link href="/student/results"><FileText className="mr-2 h-4 w-4" />View results</Link>
            </Button>
            <Button asChild variant="outline" className="justify-start rounded-2xl">
              <Link href="/student/fees"><CreditCard className="mr-2 h-4 w-4" />Pay fees</Link>
            </Button>
            <Button asChild variant="outline" className="justify-start rounded-2xl">
              <Link href="/student/payments"><ReceiptText className="mr-2 h-4 w-4" />Download receipt</Link>
            </Button>
          </div>
        </Card>

        {/* Exam Eligibility Status */}
        <Card className="rounded-[2rem] border bg-white p-6 shadow-sm dark:bg-blue-800/20">
          <div className="flex items-center gap-3">
            <div className={`rounded-2xl p-3 ${
              examEligibility?.is_eligible 
                ? 'bg-emerald-500/10 text-emerald-600' 
                : 'bg-red-500/10 text-red-600'
            }`}>
              <Award className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Exam Eligibility</h2>
              <p className="text-sm text-muted-foreground">Current session status</p>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {checkingEligibility ? (
              <p className="text-sm text-muted-foreground">Checking eligibility...</p>
            ) : examEligibility ? (
              <>
                <div className={`rounded-2xl border p-4 ${
                  examEligibility.is_eligible 
                    ? 'border-emerald-500/30 bg-emerald-500/5' 
                    : 'border-red-500/30 bg-red-500/5'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {examEligibility.is_eligible ? (
                      <BadgeCheck className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    )}
                    <span className={`font-semibold ${
                      examEligibility.is_eligible ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {examEligibility.is_eligible ? 'Eligible for Exams' : 'Not Eligible for Exams'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{examEligibility.message}</p>
                </div>
                <div className="grid gap-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Fees Status:</span>
                    <span className={`font-semibold ${
                      examEligibility.fees_paid ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {examEligibility.fees_paid ? 'Paid' : 'Unpaid'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Approved Courses:</span>
                    <span className={`font-semibold ${
                      examEligibility.courses_approved ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {examEligibility.approved_course_count || (examEligibility.courses_approved ? 'Yes' : 'No')}
                    </span>
                  </div>
                </div>
                {!examEligibility.is_eligible && (
                  <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3">
                    <p className="text-xs text-amber-700">
                      Complete the required actions above to become eligible for exams.
                    </p>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Unable to check eligibility status</p>
            )}
          </div>
        </Card>

        <Card className="rounded-[2rem] border bg-white p-6 shadow-sm dark:bg-blue-800/20">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-primary/10 p-3 text-primary"><Bell className="h-5 w-5" /></div>
            <div>
              <h2 className="text-2xl font-bold">Announcements</h2>
              <p className="text-sm text-muted-foreground">Latest updates</p>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {announcements.length === 0 ? (
              <p className="text-sm text-muted-foreground">No announcements yet.</p>
            ) : (
              announcements.map((announcement) => (
                <div key={announcement.id} className="rounded-2xl border border-border bg-background p-4">
                  <p className="font-semibold text-foreground">{announcement.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{announcement.content}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {new Date(announcement.published_at || announcement.created_at).toLocaleDateString()}
                  </p>
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
                <div key={notice.id} className="rounded-2xl border border-border p-4 bg-background">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-foreground">{notice.title}</p>
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
                  <div key={result.id} className="rounded-2xl border border-border bg-slate-50 dark:bg-background p-4">
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
                  <div key={payment.id} className="rounded-2xl border border-border bg-slate-50 dark:bg-primary p-4">
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
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-primary/10 p-3 text-primary"><FolderOpen className="h-5 w-5" /></div>
              <div>
                <h2 className="text-2xl font-bold">Aspirant Documents</h2>
                <p className="text-sm text-muted-foreground">View admission documents</p>
              </div>
            </div>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              Access your admission letter, oath form, and other documents from your aspirant dashboard.
            </p>
            <Link href="/aspirant/dashboard" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">
              Go to Aspirant Dashboard <ArrowRight className="h-4 w-4" />
            </Link>
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
