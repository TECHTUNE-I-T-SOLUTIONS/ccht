'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Download, Printer, UserRound, Mail, Phone, MapPin, CalendarDays, BadgeCheck, BookOpen } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

type Course = {
  id: string
  course_code: string
  course_title: string
  credit_units: number
  semester: string
  level: string
}

type StudentProfile = {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  matric_number: string | null
  department: string | null
  level: string | null
  admission_year: string | null
}

export default function StudentCourseFormPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [printing, setPrinting] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [profileRes, coursesRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('student_courses').select('*').eq('student_id', user.id),
      ])

      setProfile(profileRes.data)
      setCourses(coursesRes.data || [])
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

  const handleDownload = () => {
    const element = document.getElementById('course-form-content')
    if (!element) return

    const printContent = element.innerHTML
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Course Form - ${profile?.matric_number || 'Student'}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .student-info { margin-bottom: 30px; }
          .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
          .info-item { display: flex; gap: 10px; }
          .label { font-weight: bold; min-width: 120px; }
          .courses-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          .courses-table th, .courses-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          .courses-table th { background-color: #f5f5f5; }
          .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        ${printContent}
      </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  const totalCreditUnits = courses.reduce((sum, course) => sum + course.credit_units, 0)

  if (loading) return <div className="p-8">Loading course form...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Course Registration Form</h1>
          <p className="mt-1 text-sm text-muted-foreground">View and print your registered courses</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={handleDownload} variant="outline" className="rounded-xl">
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
          <Button onClick={handlePrint} disabled={printing} className="rounded-xl">
            <Printer className="mr-2 h-4 w-4" />
            {printing ? 'Printing...' : 'Print'}
          </Button>
        </div>
      </div>

      <div id="course-form-content" className="space-y-6">
        {/* Header */}
        <Card className="p-8 border-2">
          <div className="text-center">
            <h2 className="text-2xl font-bold">CROSS COLLEGE OF HEALTH TECHNOLOGY</h2>
            <p className="text-sm text-muted-foreground mt-2">Official Course Registration Form</p>
            <div className="mt-4 inline-block rounded-full border border-primary/20 bg-primary/10 px-4 py-2">
              <p className="text-sm font-semibold text-primary">Academic Session 2024/2025</p>
            </div>
          </div>
        </Card>

        {/* Student Information */}
        <Card className="p-6">
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
              <MapPin className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Department</p>
                <p className="font-semibold">{profile?.department || 'Not assigned'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <CalendarDays className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Admission Year</p>
                <p className="font-semibold">{profile?.admission_year || 'Not specified'}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Registered Courses */}
        <Card className="p-6">
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

          {courses.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No courses registered yet.</p>
              <Button asChild className="mt-4 rounded-xl">
                <a href="/student/courses">Register Courses</a>
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
                  </tr>
                </thead>
                <tbody>
                  {courses.map((course, index) => (
                    <tr key={course.id} className="border-b border-border hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-4 text-sm">{index + 1}</td>
                      <td className="p-4 text-sm font-semibold">{course.course_code}</td>
                      <td className="p-4 text-sm">{course.course_title}</td>
                      <td className="p-4 text-sm">{course.credit_units}</td>
                      <td className="p-4 text-sm capitalize">{course.semester}</td>
                      <td className="p-4 text-sm capitalize">{course.level}</td>
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
              <p className="text-2xl font-bold text-primary">{courses.length}</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-white dark:bg-slate-900">
              <p className="text-xs text-muted-foreground">Total Credit Units</p>
              <p className="text-2xl font-bold text-primary">{totalCreditUnits}</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-white dark:bg-slate-900">
              <p className="text-xs text-muted-foreground">Registration Status</p>
              <p className="text-2xl font-bold text-emerald-600">Complete</p>
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
