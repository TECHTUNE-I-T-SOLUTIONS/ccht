'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card } from '@/components/ui/card'

export default function TeacherSessionDetailPage() {
  const params = useParams()
  const [session, setSession] = useState<any>(null)

  useEffect(() => {
    if (!params.id) return
    fetch(`/api/v1/teacher/sessions/${params.id}`).then((r) => r.json()).then((d) => setSession(d.data || null))
  }, [params.id])

  if (!session) return <div className="p-8">Loading session...</div>

  return (
    <Card className="space-y-4 p-6">
      <h1 className="text-2xl font-bold">{session.course?.code || 'Session'}</h1>
      <p>{session.course?.title}</p>
      <p>{session.session?.name}</p>
      <p>{session.semester?.semester_name}</p>
      <p>Published: {session.is_published ? 'Yes' : 'No'}</p>
    </Card>
  )
}
