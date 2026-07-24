'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function TeacherExamDetailPage() {
  const params = useParams()
  const [exam, setExam] = useState<any>(null)
  const [questions, setQuestions] = useState<any[]>([])

  useEffect(() => {
    if (!params.id) return
    Promise.all([
      fetch(`/api/v1/teacher/exams/${params.id}`).then((r) => r.json()),
      fetch(`/api/v1/teacher/exams/${params.id}/questions`).then((r) => r.json()),
    ]).then(([examRes, qRes]) => {
      setExam(examRes.data || null)
      setQuestions(qRes.data || [])
    })
  }, [params.id])

  if (!exam) return <div className="p-8">Loading exam...</div>

  return (
    <div className="space-y-6">
      <Card className="space-y-3 p-6">
        <h1 className="text-2xl font-bold">{exam.exam_title || exam.exam_name}</h1>
        <p>{exam.course?.code} - {exam.course?.title}</p>
        <div className="flex gap-3">
          <Link href={`/teacher/exams/${exam.id}/questions`}>
            <Button>Manage Questions</Button>
          </Link>
        </div>
      </Card>
      <div className="grid gap-4">
        {questions.map((question) => (
          <Card key={question.id} className="p-5">
            <p className="font-semibold">{question.question_number}. {question.question_text}</p>
            <p className="text-sm text-muted-foreground">Points: {question.marks}</p>
          </Card>
        ))}
      </div>
    </div>
  )
}
