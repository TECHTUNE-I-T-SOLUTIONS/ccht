'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { ClipboardCheck, Edit2, Save, X } from 'lucide-react'
import { toast } from 'sonner'

type Grade = {
  id: string
  student_id: string
  course_id: string
  enrollment_id: string
  exam_score?: number
  ca_1?: number
  ca_2?: number
  assignments?: number
  continuous_assessment?: number
  total_score?: number
  grade?: string
  score_status?: string
  student?: { id: string; first_name: string; last_name: string; email: string; avatar_url?: string }
  course?: { id: string; code: string; title: string }
  enrollment?: { id: string; program?: { id: string; title: string } }
}

export default function TeacherGradesPage() {
  const [grades, setGrades] = useState<Grade[]>([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const perPage = 6
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedGrade, setSelectedGrade] = useState<Grade | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  const [form, setForm] = useState({
    ca_1: 0,
    ca_2: 0,
    assignments: 0,
    exam_score: 0,
  })

  useEffect(() => {
    fetch('/api/v1/teacher/grades')
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          console.error('Failed to load grades:', d.error)
          setGrades([])
        } else {
          setGrades(d.data || [])
        }
      })
      .catch((err) => {
        console.error('Failed to load grades:', err)
        setGrades([])
      })
      .finally(() => setLoading(false))
  }, [])

  const filtered = grades.filter((grade) =>
    `${grade.student?.first_name} ${grade.student?.last_name} ${grade.course?.code || ''} ${grade.course?.title || ''}`.toLowerCase().includes(search.toLowerCase())
  )
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const paged = filtered.slice((page - 1) * perPage, page * perPage)

  const startEdit = (grade: Grade) => {
    setForm({
      ca_1: grade.ca_1 || 0,
      ca_2: grade.ca_2 || 0,
      assignments: grade.assignments || 0,
      exam_score: grade.exam_score || 0,
    })
    setSelectedGrade(grade)
    setIsEditing(true)
    setDialogOpen(true)
  }

  const calculateTotal = () => {
    return (form.ca_1 || 0) + (form.ca_2 || 0) + (form.assignments || 0) + (form.exam_score || 0)
  }

  const calculateGrade = (score: number) => {
    if (score >= 70) return 'A'
    if (score >= 60) return 'B'
    if (score >= 50) return 'C'
    if (score >= 45) return 'D'
    if (score >= 40) return 'E'
    return 'F'
  }

  const saveGrade = async () => {
    if (!selectedGrade) return
    
    try {
      const totalScore = calculateTotal()
      const grade = calculateGrade(totalScore)
      
      const res = await fetch(`/api/v1/teacher/grades/${selectedGrade.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          continuous_assessment: (form.ca_1 || 0) + (form.ca_2 || 0) + (form.assignments || 0),
          total_score: totalScore,
          grade: grade,
          score_status: 'graded',
        }),
      })

      if (!res.ok) throw new Error('Failed to save grade')
      
      toast.success('Grade saved successfully')
      setDialogOpen(false)
      
      // Reload grades
      fetch('/api/v1/teacher/grades')
        .then((r) => r.json())
        .then((d) => setGrades(d.data || []))
    } catch (error) {
      toast.error('Failed to save grade')
      console.error(error)
    }
  }

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ClipboardCheck className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-bold">Student Grades</h1>
      </div>
      
      <Input placeholder="Search grades..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
      
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {paged.map((grade) => (
          <Card key={grade.id} className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-semibold">{grade.student?.first_name} {grade.student?.last_name}</p>
                <p className="text-sm text-muted-foreground">{grade.course?.code || grade.course?.title || 'Course'}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => startEdit(grade)}>
                <Edit2 className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">CA 1:</span>
                <span className="font-medium">{grade.ca_1 ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">CA 2:</span>
                <span className="font-medium">{grade.ca_2 ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Assignments:</span>
                <span className="font-medium">{grade.assignments ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Exam:</span>
                <span className="font-medium">{grade.exam_score ?? 0}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-1 mt-1">
                <span className="text-muted-foreground">Total:</span>
                <span className="font-bold">{grade.total_score ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Grade:</span>
                <span className={`font-bold ${grade.grade === 'A' || grade.grade === 'B' ? 'text-green-600' : grade.grade === 'F' ? 'text-red-600' : 'text-blue-600'}`}>
                  {grade.grade || 'N/A'}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>
      
      <div className="flex items-center justify-between">
        <Button variant="outline" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</Button>
        <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
        <Button variant="outline" disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</Button>
      </div>

      {/* Edit Grade Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-black">
          <DialogHeader>
            <DialogTitle>Edit Grade</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Update scores for {selectedGrade?.student?.first_name} {selectedGrade?.student?.last_name}
            </p>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="ca_1">CA 1 (0-20)</Label>
              <Input
                id="ca_1"
                type="number"
                min="0"
                max="20"
                value={form.ca_1}
                onChange={(e) => setForm({ ...form, ca_1: parseInt(e.target.value) || 0 })}
                className="rounded-xl"
              />
            </div>

            <div>
              <Label htmlFor="ca_2">CA 2 (0-20)</Label>
              <Input
                id="ca_2"
                type="number"
                min="0"
                max="20"
                value={form.ca_2}
                onChange={(e) => setForm({ ...form, ca_2: parseInt(e.target.value) || 0 })}
                className="rounded-xl"
              />
            </div>

            <div>
              <Label htmlFor="assignments">Assignments (0-10)</Label>
              <Input
                id="assignments"
                type="number"
                min="0"
                max="10"
                value={form.assignments}
                onChange={(e) => setForm({ ...form, assignments: parseInt(e.target.value) || 0 })}
                className="rounded-xl"
              />
            </div>

            <div>
              <Label htmlFor="exam_score">Exam Score (0-50)</Label>
              <Input
                id="exam_score"
                type="number"
                min="0"
                max="50"
                value={form.exam_score}
                onChange={(e) => setForm({ ...form, exam_score: parseInt(e.target.value) || 0 })}
                className="rounded-xl"
              />
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <div className="flex justify-between mb-2">
                <span className="text-muted-foreground">Total Score:</span>
                <span className="font-bold text-lg">{calculateTotal()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Grade:</span>
                <span className={`font-bold text-lg ${calculateGrade(calculateTotal()) === 'A' || calculateGrade(calculateTotal()) === 'B' ? 'text-green-600' : calculateGrade(calculateTotal()) === 'F' ? 'text-red-600' : 'text-blue-600'}`}>
                  {calculateGrade(calculateTotal())}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={saveGrade} className="flex-1 rounded-xl border border-primary hover:shadow-lg hover:shadow-blue-600">
                <Save className="mr-2 h-4 w-4" />
                Save Grade
              </Button>
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="rounded-xl"
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
