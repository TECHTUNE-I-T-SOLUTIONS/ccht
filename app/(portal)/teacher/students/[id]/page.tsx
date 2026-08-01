'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, User, Mail, Phone, MapPin, GraduationCap, BookOpen, Award } from 'lucide-react'
import Link from 'next/link'

export default function TeacherStudentDetailPage() {
  const params = useParams()
  const [student, setStudent] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!params.id) return
    setLoading(true)
    fetch(`/api/v1/teacher/students/${params.id}`)
      .then((r) => r.json())
      .then((d) => {
        setStudent(d.data || null)
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [params.id])

  if (loading) return <div className="p-8">Loading student...</div>
  if (!student) return <div className="p-8">Student not found</div>

  const gradePoints: { [key: string]: number } = { A: 5, B: 4, C: 3, D: 2, E: 1, F: 0 }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/teacher/students">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Students
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Student Details</h1>
      </div>

      {/* Personal Information */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <User className="h-5 w-5 text-primary" /> Personal Information
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Full Name</p>
            <p className="font-medium">{student.profile?.first_name} {student.profile?.middle_name} {student.profile?.last_name}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium flex items-center gap-2">
              <Mail className="h-4 w-4" /> {student.profile?.email}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Phone</p>
            <p className="font-medium flex items-center gap-2">
              <Phone className="h-4 w-4" /> {student.profile?.phone || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Student Number</p>
            <p className="font-medium">{student.student_number || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Matric Number</p>
            <p className="font-medium">{student.matric_number || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Gender</p>
            <p className="font-medium">{student.gender || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Date of Birth</p>
            <p className="font-medium">{student.date_of_birth || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Blood Group</p>
            <p className="font-medium">{student.blood_group || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Genotype</p>
            <p className="font-medium">{student.genotype || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">State of Origin</p>
            <p className="font-medium">{student.state_of_origin || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">LGA</p>
            <p className="font-medium">{student.local_government_area || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Nationality</p>
            <p className="font-medium">{student.nationality || 'N/A'}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-muted-foreground">Address</p>
            <p className="font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4" /> {student.address_line_1}{student.address_line_2 && `, ${student.address_line_2}`}, {student.city}, {student.state}
            </p>
          </div>
        </div>
      </Card>

      {/* Academic Information */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-primary" /> Academic Information
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Current Level</p>
            <p className="font-medium">{student.current_level || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Admission Status</p>
            <p className="font-medium">{student.admission_status || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Admission Session</p>
            <p className="font-medium">{student.admission_session || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Admission Date</p>
            <p className="font-medium">{student.admission_date || 'N/A'}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-muted-foreground">CGPA</p>
            <p className="text-3xl font-bold text-primary">{student.cgpa || '0.00'}</p>
            <p className="text-xs text-muted-foreground">Total Credit Units: {student.total_credit_units || 0} | Total Grade Points: {student.total_grade_points || 0}</p>
          </div>
        </div>
      </Card>

      {/* Enrollment Information */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" /> Enrollment Information
        </h2>
        {student.enrollments && student.enrollments.length > 0 ? (
          <div className="space-y-4">
            {student.enrollments.map((enrollment: any) => (
              <div key={enrollment.id} className="border rounded-lg p-4">
                <div className="grid gap-2 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Program</p>
                    <p className="font-medium">{enrollment.program?.title || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Department</p>
                    <p className="font-medium">{enrollment.program?.department?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Session</p>
                    <p className="font-medium">{enrollment.session?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="font-medium">{enrollment.status || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Enrollment Date</p>
                    <p className="font-medium">{enrollment.enrollment_date ? new Date(enrollment.enrollment_date).toLocaleDateString() : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Expected Graduation</p>
                    <p className="font-medium">{enrollment.expected_graduation_date || 'N/A'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No enrollment information available</p>
        )}
      </Card>

      {/* Registered Courses */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" /> Registered Courses
        </h2>
        {student.selected_courses && student.selected_courses.length > 0 ? (
          <div className="space-y-4">
            {student.selected_courses.map((sc: any) => (
              <div key={sc.id} className="border rounded-lg p-4">
                <div className="grid gap-2 md:grid-cols-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Course Code</p>
                    <p className="font-medium">{sc.course?.code || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Course Title</p>
                    <p className="font-medium">{sc.course?.title || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Credit Units</p>
                    <p className="font-medium">{sc.course?.credit_units || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Level</p>
                    <p className="font-medium">{sc.course?.level || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Semester</p>
                    <p className="font-medium">{sc.course?.semester || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Session</p>
                    <p className="font-medium">{sc.session || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="font-medium">{sc.status || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Program</p>
                    <p className="font-medium">{sc.course?.program?.title || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Department</p>
                    <p className="font-medium">{sc.course?.program?.department?.name || 'N/A'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No registered courses found</p>
        )}
      </Card>

      {/* Results */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" /> Academic Results
        </h2>
        {student.results && student.results.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Course</th>
                  <th className="text-left p-2">Code</th>
                  <th className="text-left p-2">Score</th>
                  <th className="text-left p-2">Grade</th>
                  <th className="text-left p-2">GP</th>
                  <th className="text-left p-2">Credits</th>
                  <th className="text-left p-2">Session</th>
                </tr>
              </thead>
              <tbody>
                {student.results.map((result: any) => (
                  <tr key={result.id} className="border-b">
                    <td className="p-2">{result.course_name}</td>
                    <td className="p-2">{result.course_code || 'N/A'}</td>
                    <td className="p-2">{result.score || 'N/A'}</td>
                    <td className="p-2 font-semibold">{result.grade || 'N/A'}</td>
                    <td className="p-2">{result.grade_point || 'N/A'}</td>
                    <td className="p-2">{result.credit_units || 'N/A'}</td>
                    <td className="p-2">{result.academic_year || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted-foreground">No published results found</p>
        )}
      </Card>

      {/* Guardian Information */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Guardian Information</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Guardian Name</p>
            <p className="font-medium">{student.guardian_name || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Guardian Phone</p>
            <p className="font-medium">{student.guardian_phone || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Guardian Email</p>
            <p className="font-medium">{student.guardian_email || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Emergency Contact</p>
            <p className="font-medium">{student.emergency_contact_name || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Emergency Phone</p>
            <p className="font-medium">{student.emergency_contact_phone || 'N/A'}</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
