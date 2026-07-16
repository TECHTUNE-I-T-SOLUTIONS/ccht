'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Plus, Edit2, Trash2, Save, X, ShieldCheck, CalendarDays, Clock3, Users, Award } from 'lucide-react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'

type ScreeningExam = {
  id: string
  exam_name: string
  exam_description: string
  exam_date: string
  duration_minutes: number
  total_questions: number
  passing_score: number
  is_active: boolean
  instructions: string
  created_at: string
}

type ScreeningCandidate = {
  id: string
  profile_id: string
  exam_id: string
  score: number | null
  grade: string | null
  status: string
  submitted_at: string | null
  profile?: {
    first_name: string
    last_name: string
    email: string
  }
}

export default function AdminScreeningPage() {
  const [exams, setExams] = useState<ScreeningExam[]>([])
  const [candidates, setCandidates] = useState<ScreeningCandidate[]>([])
  const [selectedExam, setSelectedExam] = useState<ScreeningExam | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [examToDelete, setExamToDelete] = useState<string | null>(null)

  const [examForm, setExamForm] = useState({
    exam_name: '',
    exam_description: '',
    exam_date: '',
    duration_minutes: 30,
    total_questions: 20,
    passing_score: 50,
    instructions: '',
    is_active: true,
  })

  useEffect(() => {
    loadExams()
  }, [])

  useEffect(() => {
    if (selectedExam) {
      loadCandidates(selectedExam.id)
    }
  }, [selectedExam])

  const loadExams = async () => {
    try {
      const res = await fetch('/api/v1/admin/screening/exams')
      if (!res.ok) throw new Error('Failed to load screening exams')
      const data = await res.json()
      setExams(data.data || [])
      if (data.data?.length > 0 && !selectedExam) {
        setSelectedExam(data.data[0])
      }
    } catch (error) {
      toast.error('Failed to load screening exams')
      console.error(error)
    }
  }

  const loadCandidates = async (examId: string) => {
    try {
      const res = await fetch(`/api/v1/admin/screening/candidates?examId=${examId}`)
      if (!res.ok) throw new Error('Failed to load candidates')
      const data = await res.json()
      setCandidates(data.data || [])
    } catch (error) {
      toast.error('Failed to load candidates')
      console.error(error)
    }
  }

  const saveExam = async () => {
    try {
      const method = isCreating ? 'POST' : 'PUT'
      const url = isCreating ? '/api/v1/admin/screening/exams' : `/api/v1/admin/screening/exams/${selectedExam?.id}`
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(examForm),
      })

      if (!res.ok) throw new Error('Failed to save screening exam')
      
      toast.success(isCreating ? 'Screening exam created' : 'Screening exam updated')
      setIsCreating(false)
      setIsEditing(false)
      loadExams()
    } catch (error) {
      toast.error('Failed to save screening exam')
      console.error(error)
    }
  }

  const deleteExam = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/admin/screening/exams/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete screening exam')
      
      toast.success('Screening exam deleted')
      setSelectedExam(null)
      setDeleteDialogOpen(false)
      loadExams()
    } catch (error) {
      toast.error('Failed to delete screening exam')
      console.error(error)
    }
  }

  const startEditExam = () => {
    if (!selectedExam) return
    setExamForm({
      exam_name: selectedExam.exam_name,
      exam_description: selectedExam.exam_description,
      exam_date: selectedExam.exam_date,
      duration_minutes: selectedExam.duration_minutes,
      total_questions: selectedExam.total_questions,
      passing_score: selectedExam.passing_score,
      instructions: selectedExam.instructions || '',
      is_active: selectedExam.is_active,
    })
    setIsEditing(true)
    setIsCreating(false)
  }

  const startCreateExam = () => {
    setExamForm({
      exam_name: '',
      exam_description: '',
      exam_date: '',
      duration_minutes: 30,
      total_questions: 20,
      passing_score: 50,
      instructions: '',
      is_active: true,
    })
    setIsCreating(true)
    setIsEditing(false)
  }

  const confirmDelete = (id: string) => {
    setExamToDelete(id)
    setDeleteDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Screening & Entrance Exams</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage screening examinations and candidate results</p>
        </div>
        <Button onClick={startCreateExam} className="rounded-xl">
          <Plus className="mr-2 h-4 w-4" />
          Create Screening Exam
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Screening Exams List */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Screening Exams</h2>
          </div>

          <div className="space-y-2">
            {exams.map((exam) => (
              <div
                key={exam.id}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                  selectedExam?.id === exam.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setSelectedExam(exam)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold">{exam.exam_name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {exam.exam_date || 'No date set'} • {exam.duration_minutes} min • {exam.total_questions} questions
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        exam.is_active 
                          ? 'bg-emerald-500/10 text-emerald-600' 
                          : 'bg-gray-500/10 text-gray-600'
                      }`}>
                        {exam.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedExam(exam)
                        startEditExam()
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
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
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Exam Editor */}
        <Card className="p-6 lg:col-span-2">
          {(isEditing || isCreating) ? (
            <div className="space-y-4">
              <h3 className="text-xl font-bold">{isCreating ? 'Create New Screening Exam' : 'Edit Screening Exam'}</h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="exam_name">Exam Name</Label>
                  <Input
                    id="exam_name"
                    value={examForm.exam_name}
                    onChange={(e) => setExamForm({ ...examForm, exam_name: e.target.value })}
                    className="rounded-xl"
                  />
                </div>

                <div>
                  <Label htmlFor="exam_description">Description</Label>
                  <Textarea
                    id="exam_description"
                    value={examForm.exam_description}
                    onChange={(e) => setExamForm({ ...examForm, exam_description: e.target.value })}
                    className="rounded-xl"
                  />
                </div>

                <div>
                  <Label htmlFor="exam_date">Exam Date</Label>
                  <Input
                    id="exam_date"
                    type="date"
                    value={examForm.exam_date}
                    onChange={(e) => setExamForm({ ...examForm, exam_date: e.target.value })}
                    className="rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="duration_minutes">Duration (minutes)</Label>
                    <Input
                      id="duration_minutes"
                      type="number"
                      value={examForm.duration_minutes}
                      onChange={(e) => setExamForm({ ...examForm, duration_minutes: parseInt(e.target.value) })}
                      className="rounded-xl"
                    />
                  </div>

                  <div>
                    <Label htmlFor="total_questions">Total Questions</Label>
                    <Input
                      id="total_questions"
                      type="number"
                      value={examForm.total_questions}
                      onChange={(e) => setExamForm({ ...examForm, total_questions: parseInt(e.target.value) })}
                      className="rounded-xl"
                    />
                  </div>

                  <div>
                    <Label htmlFor="passing_score">Passing Score (%)</Label>
                    <Input
                      id="passing_score"
                      type="number"
                      value={examForm.passing_score}
                      onChange={(e) => setExamForm({ ...examForm, passing_score: parseInt(e.target.value) })}
                      className="rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="instructions">Instructions</Label>
                  <Textarea
                    id="instructions"
                    value={examForm.instructions}
                    onChange={(e) => setExamForm({ ...examForm, instructions: e.target.value })}
                    className="rounded-xl"
                    rows={4}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    id="is_active"
                    checked={examForm.is_active}
                    onCheckedChange={(checked) => setExamForm({ ...examForm, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>

                <div className="flex gap-3">
                  <Button onClick={saveExam} className="flex-1 rounded-xl">
                    <Save className="mr-2 h-4 w-4" />
                    Save Exam
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false)
                      setIsCreating(false)
                    }}
                    className="rounded-xl"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          ) : selectedExam ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">{selectedExam.exam_name}</h3>
                <Button onClick={startEditExam} variant="outline" size="sm" className="rounded-xl">
                  <Edit2 className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-xs text-muted-foreground">Exam Date</p>
                  <p className="text-lg font-bold">{selectedExam.exam_date || 'Not set'}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-xs text-muted-foreground">Duration</p>
                  <p className="text-lg font-bold">{selectedExam.duration_minutes} minutes</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-xs text-muted-foreground">Questions</p>
                  <p className="text-lg font-bold">{selectedExam.total_questions}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-xs text-muted-foreground">Passing Score</p>
                  <p className="text-lg font-bold">{selectedExam.passing_score}%</p>
                </div>
              </div>

              {selectedExam.instructions && (
                <div className="p-4 rounded-xl border border-border">
                  <p className="text-sm font-semibold mb-2">Instructions:</p>
                  <p className="text-sm text-muted-foreground">{selectedExam.instructions}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              Select or create a screening exam to view details
            </div>
          )}
        </Card>
      </div>

      {/* Candidates Results */}
      {selectedExam && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Candidate Results</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              {candidates.length} candidates
            </div>
          </div>

          <div className="space-y-3">
            {candidates.length === 0 ? (
              <p className="text-sm text-muted-foreground">No candidates have taken this exam yet.</p>
            ) : (
              candidates.map((candidate) => (
                <Card key={candidate.id} className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-semibold">
                        {candidate.profile?.first_name} {candidate.profile?.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">{candidate.profile?.email}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-semibold">Score: {candidate.score ?? 'N/A'}</p>
                        <p className="text-xs text-muted-foreground">Grade: {candidate.grade || 'N/A'}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        candidate.status === 'passed' 
                          ? 'bg-emerald-500/10 text-emerald-600' 
                          : candidate.status === 'failed'
                          ? 'bg-red-500/10 text-red-600'
                          : 'bg-gray-500/10 text-gray-600'
                      }`}>
                        {candidate.status || 'Pending'}
                      </span>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="border-border bg-white text-foreground dark:bg-slate-950">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Screening Exam?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this screening exam and all associated candidate results. This action cannot be undone.
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
