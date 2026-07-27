'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Plus, Trash2, Edit, Shield, User } from 'lucide-react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'

type AdminExam = {
  id: string
  exam_title: string
  exam_description: string
  course_id: string
  course?: {
    code: string
    title: string
  }
  session?: {
    name: string
  }
  semester?: {
    semester_name: string
  }
  start_date: string
  end_date: string
  duration_minutes: number
  total_marks: number
  passing_marks: number
  is_published: boolean
  instructions: string
  created_at: string
  creator?: {
    first_name: string
    last_name: string
  }
  creator_role: string
}

export default function AdminExamsPage() {
  const router = useRouter()
  const [exams, setExams] = useState<AdminExam[]>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [examToDelete, setExamToDelete] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadExams()
  }, [])

  const loadExams = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/v1/admin/exams')
      if (!res.ok) throw new Error('Failed to load exams')
      const data = await res.json()
      setExams(data.data || [])
    } catch (error) {
      toast.error('Failed to load exams')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const deleteExam = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/admin/exams/${id}`, { method: 'DELETE' })
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

  const getCreatorBadge = (exam: AdminExam) => {
    return (
      <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
        <Shield className="h-3 w-3 mr-1" /> Admin
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Exam Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create and manage all examinations for the institution</p>
        </div>
        <Button onClick={() => router.push('/admin/management/exams/create')} className="rounded-xl border border-primary hover:text-blue-600 hover:shadow-lg hover:shadow-blue-600">
          <Plus className="mr-2 h-4 w-4" />
          Create Exam
        </Button>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">All Exams</h2>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading exams...</div>
        ) : exams.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No exams yet. Click "Create Exam" to get started.
          </div>
        ) : (
          <div className="space-y-4">
            {exams.map((exam) => (
              <Card
                key={exam.id}
                className="p-4 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{exam.exam_title}</h3>
                      {getCreatorBadge(exam)}
                      {exam.is_published ? (
                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                          Published
                        </Badge>
                      ) : (
                        <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400">
                          Draft
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {exam.course?.code} - {exam.course?.title}
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Session:</span>
                        <span className="ml-2 font-medium">{exam.session?.name || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Semester:</span>
                        <span className="ml-2 font-medium">{exam.semester?.semester_name || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Duration:</span>
                        <span className="ml-2 font-medium">{exam.duration_minutes} min</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Creator:</span>
                        <span className="ml-2 font-medium">
                          {exam.creator ? `${exam.creator.first_name} ${exam.creator.last_name}` : 'Unknown'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/admin/management/exams/${exam.id}`)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => confirmDelete(exam.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
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
