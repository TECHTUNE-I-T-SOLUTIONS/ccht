'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Download, GraduationCap, ShieldCheck, Calendar, User } from 'lucide-react'
import { toast } from 'sonner'
import { generateAdmissionLetter } from '@/lib/templates/admission-letter'
import { generateOathForm } from '@/lib/templates/oath-form'

export default function StudentDocumentsPage() {
  const [loading, setLoading] = useState(true)
  const [studentData, setStudentData] = useState<any>(null)
  const [programData, setProgramData] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    loadStudentData()
  }, [])

  const loadStudentData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [profileRes, studentProfileRes, enrollmentRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('student_profiles').select('*').eq('profile_id', user.id).single(),
        supabase.from('enrollments').select('*, program:programs(title, department:departments(name))').eq('student_id', user.id).eq('status', 'active').single()
      ])

      if (profileRes.data && studentProfileRes.data) {
        setStudentData({
          profiles: profileRes.data,
          ...studentProfileRes.data
        })
        setProgramData(enrollmentRes.data?.program || null)
      }
    } catch (error) {
      console.error('Failed to load student data:', error)
    } finally {
      setLoading(false)
    }
  }

  const downloadAdmissionLetter = () => {
    if (!studentData || !programData) {
      toast.error('Student data not loaded')
      return
    }

    const admissionDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    
    const doc = generateAdmissionLetter({
      firstName: studentData.profiles?.first_name || '',
      lastName: studentData.profiles?.last_name || '',
      matricNumber: studentData.matric_number || '',
      program: programData?.title || '',
      department: programData?.department?.name || '',
      level: studentData.current_level || '100',
      admissionDate
    })

    doc.save(`Admission_Letter_${studentData.matric_number}.pdf`)
    toast.success('Admission letter downloaded')
  }

  const downloadOathForm = () => {
    if (!studentData || !programData) {
      toast.error('Student data not loaded')
      return
    }

    const oathDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    
    const doc = generateOathForm({
      firstName: studentData.profiles?.first_name || '',
      lastName: studentData.profiles?.last_name || '',
      matricNumber: studentData.matric_number || '',
      program: programData?.title || '',
      department: programData?.department?.name || '',
      oathDate
    })

    doc.save(`School_Oath_Form_${studentData.matric_number}.pdf`)
    toast.success('Oath form downloaded')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-sm text-muted-foreground">Loading documents...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[2.5rem] border border-border bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.12),transparent_30%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--accent-soft)))] p-6 md:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Student Portal</p>
        <h1 className="mt-3 text-3xl font-extrabold">Documents</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-foreground/70">
          Access your official admission letter, school oath form, and other important documents.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="rounded-[2rem] border bg-white p-6 shadow-sm dark:bg-slate-900">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-primary/10 p-4 text-primary">
              <GraduationCap className="h-8 w-8" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold">Admission Letter</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Your official admission letter containing program details, school rules, regulations, and guidelines.
              </p>
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>{studentData?.profiles?.first_name} {studentData?.profiles?.last_name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span>Matric: {studentData?.matric_number}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Program: {programData?.title}</span>
                </div>
              </div>
              <Button
                className="mt-4 w-full rounded-xl border border-primary hover:text-blue-500"
                onClick={downloadAdmissionLetter}
                disabled={!studentData}
              >
                <Download className="h-4 w-4 mr-2" />
                Download Admission Letter
              </Button>
            </div>
          </div>
        </Card>

        <Card className="rounded-[2rem] border bg-white p-6 shadow-sm dark:bg-slate-900">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-emerald-500/10 p-4 text-emerald-600">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold">School Oath Form</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Formal agreement to adhere to all school rules, regulations, and guidelines throughout your studies.
              </p>
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>{studentData?.profiles?.first_name} {studentData?.profiles?.last_name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span>Matric: {studentData?.matric_number}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Department: {programData?.department?.name}</span>
                </div>
              </div>
              <Button
                className="mt-4 w-full rounded-xl border border-primary hover:text-blue-500"
                onClick={downloadOathForm}
                disabled={!studentData}
              >
                <Download className="h-4 w-4 mr-2" />
                Download Oath Form
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <Card className="rounded-[2rem] border bg-white p-6 shadow-sm dark:bg-slate-900">
        <h3 className="text-xl font-bold mb-4">Important Information</h3>
        <div className="space-y-4 text-sm text-muted-foreground">
          <div>
            <p className="font-semibold text-foreground mb-1">Document Requirements</p>
            <p>Please ensure you download, read, and sign the oath form. Submit the signed form to the student affairs office during registration.</p>
          </div>
          <div>
            <p className="font-semibold text-foreground mb-1">Admission Letter</p>
            <p>Keep your admission letter safe as it contains important information about your program, fees, and school regulations.</p>
          </div>
          <div>
            <p className="font-semibold text-foreground mb-1">Contact Information</p>
            <p>If you have any questions about these documents, please contact the student affairs office at students@ccht.edu.ng</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
