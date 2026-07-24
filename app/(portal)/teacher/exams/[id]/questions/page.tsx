'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

const emptyQuestion = { question_text: '', question_type: 'multiple_choice', options: ['', '', '', ''], correct_answer: '', points: 1, question_order: 1, is_active: true }

export default function TeacherExamQuestionsPage() {
  const params = useParams()
  const [questions, setQuestions] = useState<any[]>([])
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState<any>(emptyQuestion)

  const load = async () => {
    if (!params.id) return
    const res = await fetch(`/api/v1/teacher/exams/${params.id}/questions`)
    const data = await res.json()
    setQuestions(data.data || [])
  }

  useEffect(() => { load() }, [params.id])

  const save = async () => {
    const url = editing ? `/api/v1/teacher/exams/questions/${editing.id}` : '/api/v1/teacher/exams/questions'
    const res = await fetch(url, { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, exam_id: params.id }) })
    const data = await res.json()
    if (!res.ok) return toast.error(data?.error || 'Unable to save question')
    toast.success('Question saved')
    setEditing(null); setForm(emptyQuestion); load()
  }

  const remove = async (id: string) => {
    const res = await fetch(`/api/v1/teacher/exams/questions/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) return toast.error(data?.error || 'Unable to delete question')
    toast.success('Question deleted'); load()
  }

  return (
    <div className="space-y-6">
      <Card className="p-5 space-y-3">
        <h2 className="text-xl font-semibold">{editing ? 'Edit Question' : 'Add Question'}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2"><Label>Question</Label><Textarea value={form.question_text} onChange={(e) => setForm({ ...form, question_text: e.target.value })} /></div>
          <div><Label>Type</Label><Input value={form.question_type} onChange={(e) => setForm({ ...form, question_type: e.target.value })} /></div>
          <div><Label>Points</Label><Input type="number" value={form.points} onChange={(e) => setForm({ ...form, points: Number(e.target.value) })} /></div>
          <div><Label>Order</Label><Input type="number" value={form.question_order} onChange={(e) => setForm({ ...form, question_order: Number(e.target.value) })} /></div>
          <div><Label>Correct Answer</Label><Input value={form.correct_answer} onChange={(e) => setForm({ ...form, correct_answer: e.target.value })} /></div>
        </div>
        <Button onClick={save}>{editing ? 'Update Question' : 'Create Question'}</Button>
      </Card>
      <div className="grid gap-4">
        {questions.map((q) => (
          <Card key={q.id} className="p-5">
            <p className="font-semibold">{q.question_number}. {q.question_text}</p>
            <div className="mt-3 flex gap-2">
              <Button variant="outline" onClick={() => { setEditing(q); setForm({ question_text: q.question_text, question_type: q.question_type, options: q.options || ['', '', '', ''], correct_answer: q.correct_answer || '', points: q.marks || q.points || 1, question_order: q.question_number || q.question_order || 1, is_active: q.is_active }) }}>Edit</Button>
              <Button variant="destructive" onClick={() => remove(q.id)}>Delete</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
