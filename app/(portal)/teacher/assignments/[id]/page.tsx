'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

export default function TeacherAssignmentDetailPage() {
  const params = useParams()
  const [assignment, setAssignment] = useState<any>(null)
  const [form, setForm] = useState<any>(null)

  const load = async () => {
    if (!params.id) return
    const res = await fetch(`/api/v1/teacher/assignments/${params.id}`)
    const data = await res.json()
    setAssignment(data.data || null)
    setForm(data.data ? { title: data.data.title || '', description: data.data.description || '', due_date: data.data.due_date || '', total_points: data.data.total_points || 100 } : null)
  }
  useEffect(() => { load() }, [params.id])

  const save = async () => {
    const res = await fetch(`/api/v1/teacher/assignments/${params.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, course_id: assignment.course_id, is_published: assignment.is_published, allow_late_submission: assignment.allow_late_submission, late_penalty: assignment.late_penalty }) })
    const data = await res.json()
    if (!res.ok) return toast.error(data?.error || 'Unable to save')
    toast.success('Assignment updated'); load()
  }

  const remove = async () => {
    const res = await fetch(`/api/v1/teacher/assignments/${params.id}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) return toast.error(data?.error || 'Unable to delete')
    toast.success('Assignment deleted')
  }

  if (!assignment || !form) return <div className="p-8">Loading assignment...</div>

  return (
    <div className="space-y-6">
      <Card className="space-y-4 p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div className="md:col-span-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div><Label>Due Date</Label><Input type="datetime-local" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
          <div><Label>Total Points</Label><Input type="number" value={form.total_points} onChange={(e) => setForm({ ...form, total_points: Number(e.target.value) })} /></div>
        </div>
        <div className="flex gap-2">
          <Button onClick={save}>Save Assignment</Button>
          <Button variant="destructive" onClick={remove}>Delete Assignment</Button>
        </div>
      </Card>
      <Card className="p-6">
        <h2 className="text-lg font-semibold">Submissions</h2>
        <p className="text-sm text-muted-foreground">Assignment submissions will be wired from the dedicated submissions table when available.</p>
      </Card>
    </div>
  )
}
