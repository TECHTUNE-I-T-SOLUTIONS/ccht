'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card } from '@/components/ui/card'

export default function TeacherStudentDetailPage() {
  const params = useParams()
  const [student, setStudent] = useState<any>(null)

  useEffect(() => {
    if (!params.id) return
    fetch(`/api/v1/teacher/students/${params.id}`).then((r) => r.json()).then((d) => setStudent(d.data || null))
  }, [params.id])

  if (!student) return <div className="p-8">Loading student...</div>

  return (
    <Card className="space-y-4 p-6">
      <h1 className="text-2xl font-bold">{student.profile?.first_name} {student.profile?.last_name}</h1>
      <p>{student.profile?.email}</p>
      <p>Student No: {student.student_number || 'N/A'}</p>
      <p>Matric No: {student.matric_number || 'N/A'}</p>
      <p>Program: {student.enrollment?.[0]?.program?.title || 'N/A'}</p>
    </Card>
  )
}
