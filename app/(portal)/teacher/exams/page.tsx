'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'

type TeacherExam = {
  id: string
  exam_name: string
  exam_description: string
  course_id: string
  course_name?: string
  exam_date: string
  duration_minutes: number
  total_questions: number
  passing_score: number
  is_active: boolean
  instructions: string
  created_at: string
}

export default function TeacherExamsPage() {
  const router = useRouter()
  const [exams, setExams] = useState<TeacherExam[]>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [examToDelete, setExamToDelete] = useState<string | null>(null)

  useEffect(() => {
    loadExams()
  }, [])

  const loadExams = async () => {
    try {
      const res = await fetch('/api/v1/teacher/exams')
      if (!res.ok) throw new Error('Failed to load exams')
      const data = await res.json()
      setExams(data.data || [])
    } catch (error) {
      toast.error('Failed to load exams')
      console.error(error)
    }
  }

  const deleteExam = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/teacher/exams/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete exam')
      
      toast.success('Exam deleted')
      setDeleteDialogOpen(false)
      loadExams()
    } catch (error) {
      toast.error('Failed to delete exam')
      console.error(error)
    }
  }

  const confirmDelete = (id: string) => {
    setExamToDelete(id)
    setDeleteDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Course Exams</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create and manage course examinations</p>
        </div>
        <Button onClick={() => router.push('/teacher/exams/create')} className="rounded-xl">
          <Plus className="mr-2 h-4 w-4" />
          Create Exam
        </Button>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">My Exams</h2>
        </div>

        {exams.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No exams yet. Click "Create Exam" to get started.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {exams.map((exam) => (
              <Card
                key={exam.id}
                className="p-4 cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => router.push(`/teacher/exams/${exam.id}`)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold">{exam.exam_name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {exam.course_name || 'No course'}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      confirmDelete(exam.id)
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date:</span>
                    <span className="font-medium">{exam.exam_date || 'Not set'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration:</span>
                    <span className="font-medium">{exam.duration_minutes} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <span className={`font-medium ${
                      exam.is_active 
                        ? 'text-emerald-600' 
                        : 'text-gray-600'
                    }`}>
                      {exam.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="border-border bg-white text-foreground dark:bg-slate-950">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Exam?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this exam and all associated questions. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => examToDelete && deleteExam(examToDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
