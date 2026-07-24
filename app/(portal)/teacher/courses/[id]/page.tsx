'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card } from '@/components/ui/card'

export default function TeacherCourseDetailPage() {
  const params = useParams()
  const [assignment, setAssignment] = useState<any>(null)

  useEffect(() => {
    if (!params.id) return
    fetch(`/api/v1/teacher/courses/${params.id}`).then((r) => r.json()).then((d) => setAssignment(d.data || null))
  }, [params.id])

  if (!assignment) return <div className="p-8">Loading course...</div>

  return (
    <Card className="space-y-4 p-6">
      <h1 className="text-2xl font-bold">{assignment.course?.code}</h1>
      <p>{assignment.course?.title}</p>
      <p>Status: {assignment.is_active ? 'Active' : 'Inactive'}</p>
    </Card>
  )
}
