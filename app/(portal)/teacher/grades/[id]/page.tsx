'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card } from '@/components/ui/card'

export default function TeacherGradeDetailPage() {
  const params = useParams()
  const [grade, setGrade] = useState<any>(null)

  useEffect(() => {
    if (!params.id) return
    fetch(`/api/v1/teacher/grades/${params.id}`).then((r) => r.json()).then((d) => setGrade(d.data || null))
  }, [params.id])

  if (!grade) return <div className="p-8">Loading grade...</div>

  return (
    <Card className="space-y-4 p-6">
      <h1 className="text-2xl font-bold">{grade.student?.first_name} {grade.student?.last_name}</h1>
      <p>Course: {grade.course?.code || grade.course?.title || 'N/A'}</p>
      <p>CA: {grade.continuous_assessment ?? 0}</p>
      <p>Exam Score: {grade.exam_score ?? 0}</p>
      <p>Total Score: {grade.total_score ?? 0}</p>
      <p>Status: {grade.score_status || 'draft'}</p>
    </Card>
  )
}
