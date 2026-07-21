'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FileText, Download, Printer, UserRound, Mail, Phone, MapPin, CalendarDays, BadgeCheck, BookOpen, GraduationCap, Building2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

type Course = {
  id: string
  code: string
  title: string
  description: string
  credits: number
  level: string
  semester: string
}

type SelectedCourse = {
  id: string
  course_id: string
  status: 'pending' | 'approved' | 'rejected'
  session: string
  semester: string
  selected_at: string
  reviewed_at: string | null
  course: Course
}

type StudentProfile = {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  matric_number: string | null
  current_level: string | null
  admission_session: string | null
  admission_date: string | null
  program_title: string | null
  department_name: string | null
}

export default function StudentCourseFormPage() {
  const [selectedCourses, setSelectedCourses] = useState<SelectedCourse[]>([])
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [printing, setPrinting] = useState(false)
  const [selectedSession, setSelectedSession] = useState('2026/2027')
  const [selectedSemester, setSelectedSemester] = useState('all')
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [selectedSession, selectedSemester])

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [profileRes, studentProfileRes, enrollmentRes, selectedRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('student_profiles').select('*').eq('profile_id', user.id).single(),
        supabase.from('enrollments').select('*, program:programs(title, department:departments(name))').eq('student_id', user.id).eq('status', 'active').single(),
        supabase
          .from('selected_courses')
          .select('*, course:courses(*)')
          .eq('student_id', user.id)
          .eq('session', selectedSession)
          .eq('status', 'approved')
      ])

      const profileData = {
        ...profileRes.data,
        ...studentProfileRes.data,
        program_title: enrollmentRes.data?.program?.title || null,
        department_name: enrollmentRes.data?.program?.department?.name || null
      }

      setProfile(profileData)
      
      let filteredCourses = selectedRes.data || []
      if (selectedSemester !== 'all') {
        filteredCourses = filteredCourses.filter((sc: any) => sc.semester === selectedSemester)
      }
      
      setSelectedCourses(filteredCourses)
    } catch (error) {
      console.error(error)
      toast.error('Failed to load course form data')
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    setPrinting(true)
    window.print()
    setTimeout(() => setPrinting(false), 1000)
  }

  const handleDownload = async () => {
    try {
      const response = await fetch('/api/v1/student/course-form/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session: selectedSession,
          semester: selectedSemester
        })
      })
      
      if (!response.ok) throw new Error('Failed to generate PDF')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `course-form-${profile?.matric_number || 'student'}-${selectedSession}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Course form downloaded successfully')
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || 'Failed to download course form')
    }
  }

  const totalCreditUnits = selectedCourses.reduce((sum, sc) => sum + (sc.course?.credits || 0), 0)

  const sessions = ['2026/2027', '2025/2026', '2024/2025']
  const semesters = ['all', 'first', 'second']

  if (loading) return <div className="p-8">Loading course form...</div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Course Registration Form</h1>
          <p className="mt-1 text-sm text-muted-foreground">View and print your approved course registrations</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Select value={selectedSession} onValueChange={setSelectedSession}>
            <SelectTrigger className="w-[140px] rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sessions.map(session => (
                <SelectItem key={session} value={session}>{session}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedSemester} onValueChange={setSelectedSemester}>
            <SelectTrigger className="w-[140px] rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Semesters</SelectItem>
              <SelectItem value="first">First Semester</SelectItem>
              <SelectItem value="second">Second Semester</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleDownload} variant="outline" className="rounded-xl">
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
          <Button onClick={handlePrint} disabled={printing} className="rounded-xl">
            <Printer className="mr-2 h-4 w-4" />
            {printing ? 'Printing...' : 'Print'}
          </Button>
        </div>
      </div>

      <div id="course-form-content" className="space-y-6">
        {/* Header */}
        <Card className="p-8 border-2 bg-white dark:bg-slate-900">
          <div className="text-center">
            <h2 className="text-2xl font-bold">COVENANT COLLEGE OF HEALTH TECHNOLOGY</h2>
            <p className="text-sm text-muted-foreground mt-2">Official Course Registration Form</p>
            <div className="mt-4 inline-block rounded-full border border-primary/20 bg-primary/10 px-4 py-2">
              <p className="text-sm font-semibold text-primary">Academic Session {selectedSession}</p>
            </div>
            {selectedSemester !== 'all' && (
              <div className="mt-2 inline-block rounded-full border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 px-4 py-2">
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 capitalize">{selectedSemester} Semester</p>
              </div>
            )}
          </div>
        </Card>

        {/* Student Information */}
        <Card className="p-6 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-2xl bg-primary/10 p-3 text-primary">
              <UserRound className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold">Student Information</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <UserRound className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Full Name</p>
                <p className="font-semibold">{profile?.first_name} {profile?.last_name}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <BadgeCheck className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Matric Number</p>
                <p className="font-semibold">{profile?.matric_number || 'Not assigned'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <Mail className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Email Address</p>
                <p className="font-semibold">{profile?.email}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <Phone className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Phone Number</p>
                <p className="font-semibold">{profile?.phone || 'Not provided'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <Building2 className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Department</p>
                <p className="font-semibold">{profile?.department_name || 'Not assigned'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <GraduationCap className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Program</p>
                <p className="font-semibold">{profile?.program_title || 'Not assigned'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <CalendarDays className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Current Level</p>
                <p className="font-semibold">{profile?.current_level ? `${profile.current_level}L` : 'Not specified'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <MapPin className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Admission Session</p>
                <p className="font-semibold">{profile?.admission_session || 'Not specified'}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Registered Courses */}
        <Card className="p-6 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                <BookOpen className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-bold">Registered Courses</h2>
            </div>
            <div className="text-sm text-muted-foreground">
              Total Credit Units: <span className="font-bold text-primary">{totalCreditUnits}</span>
            </div>
          </div>

          {selectedCourses.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No approved courses found for this session.</p>
              <Button asChild className="mt-4 rounded-xl">
                <a href="/student/courses">Select Courses</a>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 text-sm font-semibold">S/N</th>
                    <th className="text-left p-4 text-sm font-semibold">Course Code</th>
                    <th className="text-left p-4 text-sm font-semibold">Course Title</th>
                    <th className="text-left p-4 text-sm font-semibold">Credit Units</th>
                    <th className="text-left p-4 text-sm font-semibold">Semester</th>
                    <th className="text-left p-4 text-sm font-semibold">Level</th>
                    <th className="text-left p-4 text-sm font-semibold">Approved Date</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedCourses.map((sc, index) => (
                    <tr key={sc.id} className="border-b border-border hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-4 text-sm">{index + 1}</td>
                      <td className="p-4 text-sm font-semibold">{sc.course?.code}</td>
                      <td className="p-4 text-sm">{sc.course?.title}</td>
                      <td className="p-4 text-sm">{sc.course?.credits}</td>
                      <td className="p-4 text-sm capitalize">{sc.semester}</td>
                      <td className="p-4 text-sm capitalize">{sc.course?.level}L</td>
                      <td className="p-4 text-sm">{sc.reviewed_at ? new Date(sc.reviewed_at).toLocaleDateString() : 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Summary */}
        <Card className="p-6 bg-primary/5 border-primary/20">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 rounded-xl bg-white dark:bg-slate-900">
              <p className="text-xs text-muted-foreground">Total Courses</p>
              <p className="text-2xl font-bold text-primary">{selectedCourses.length}</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-white dark:bg-slate-900">
              <p className="text-xs text-muted-foreground">Total Credit Units</p>
              <p className="text-2xl font-bold text-primary">{totalCreditUnits}</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-white dark:bg-slate-900">
              <p className="text-xs text-muted-foreground">Registration Status</p>
              <p className="text-2xl font-bold text-emerald-600">Approved</p>
            </div>
          </div>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground py-4">
          <p>This document is officially generated by the Cross College of Health Technology portal.</p>
          <p className="mt-1">Generated on {new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  )
}
