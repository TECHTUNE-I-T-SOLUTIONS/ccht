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
import { Plus, Edit2, Trash2, Save, X, FileText, CalendarDays, Clock3, Users, Paperclip } from 'lucide-react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'

type Assignment = {
  id: string
  title: string
  description: string
  course_id: string
  course_name?: string
  due_date: string
  total_points: number
  is_published: boolean
  allow_late_submission: boolean
  late_penalty: number
  created_at: string
}

type Submission = {
  id: string
  assignment_id: string
  student_id: string
  student_name?: string
  file_url: string
  submitted_at: string
  grade: number | null
  feedback: string | null
}

export default function TeacherAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [assignmentToDelete, setAssignmentToDelete] = useState<string | null>(null)

  const [assignmentForm, setAssignmentForm] = useState({
    title: '',
    description: '',
    course_id: '',
    due_date: '',
    total_points: 100,
    is_published: true,
    allow_late_submission: false,
    late_penalty: 10,
  })

  useEffect(() => {
    loadAssignments()
  }, [])

  useEffect(() => {
    if (selectedAssignment) {
      loadSubmissions(selectedAssignment.id)
    }
  }, [selectedAssignment])

  const loadAssignments = async () => {
    try {
      const res = await fetch('/api/v1/teacher/assignments')
      if (!res.ok) throw new Error('Failed to load assignments')
      const data = await res.json()
      setAssignments(data.data || [])
      if (data.data?.length > 0 && !selectedAssignment) {
        setSelectedAssignment(data.data[0])
      }
    } catch (error) {
      toast.error('Failed to load assignments')
      console.error(error)
    }
  }

  const loadSubmissions = async (assignmentId: string) => {
    try {
      const res = await fetch(`/api/v1/teacher/assignments/${assignmentId}/submissions`)
      if (!res.ok) throw new Error('Failed to load submissions')
      const data = await res.json()
      setSubmissions(data.data || [])
    } catch (error) {
      toast.error('Failed to load submissions')
      console.error(error)
    }
  }

  const saveAssignment = async () => {
    try {
      const method = isCreating ? 'POST' : 'PUT'
      const url = isCreating ? '/api/v1/teacher/assignments' : `/api/v1/teacher/assignments/${selectedAssignment?.id}`
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignmentForm),
      })

      if (!res.ok) throw new Error('Failed to save assignment')
      
      toast.success(isCreating ? 'Assignment created' : 'Assignment updated')
      setIsCreating(false)
      setIsEditing(false)
      loadAssignments()
    } catch (error) {
      toast.error('Failed to save assignment')
      console.error(error)
    }
  }

  const deleteAssignment = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/teacher/assignments/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete assignment')
      
      toast.success('Assignment deleted')
      setSelectedAssignment(null)
      setDeleteDialogOpen(false)
      loadAssignments()
    } catch (error) {
      toast.error('Failed to delete assignment')
      console.error(error)
    }
  }

  const gradeSubmission = async (submissionId: string, grade: number, feedback: string) => {
    try {
      const res = await fetch(`/api/v1/teacher/assignments/submissions/${submissionId}/grade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grade, feedback }),
      })

      if (!res.ok) throw new Error('Failed to grade submission')
      
      toast.success('Submission graded')
      loadSubmissions(selectedAssignment!.id)
    } catch (error) {
      toast.error('Failed to grade submission')
      console.error(error)
    }
  }

  const startEditAssignment = () => {
    if (!selectedAssignment) return
    setAssignmentForm({
      title: selectedAssignment.title,
      description: selectedAssignment.description,
      course_id: selectedAssignment.course_id,
      due_date: selectedAssignment.due_date,
      total_points: selectedAssignment.total_points,
      is_published: selectedAssignment.is_published,
      allow_late_submission: selectedAssignment.allow_late_submission,
      late_penalty: selectedAssignment.late_penalty,
    })
    setIsEditing(true)
    setIsCreating(false)
  }

  const startCreateAssignment = () => {
    setAssignmentForm({
      title: '',
      description: '',
      course_id: '',
      due_date: '',
      total_points: 100,
      is_published: true,
      allow_late_submission: false,
      late_penalty: 10,
    })
    setIsCreating(true)
    setIsEditing(false)
  }

  const confirmDelete = (id: string) => {
    setAssignmentToDelete(id)
    setDeleteDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Assignments</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create and manage course assignments</p>
        </div>
        <Button onClick={startCreateAssignment} className="rounded-xl">
          <Plus className="mr-2 h-4 w-4" />
          Create Assignment
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Assignments List */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">My Assignments</h2>
          </div>

          <div className="space-y-2">
            {assignments.map((assignment) => (
              <div
                key={assignment.id}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                  selectedAssignment?.id === assignment.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setSelectedAssignment(assignment)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold">{assignment.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {assignment.course_name || 'No course'} • Due: {assignment.due_date || 'No date'}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        assignment.is_published 
                          ? 'bg-emerald-500/10 text-emerald-600' 
                          : 'bg-gray-500/10 text-gray-600'
                      }`}>
                        {assignment.is_published ? 'Published' : 'Draft'}
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                        {assignment.total_points} pts
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedAssignment(assignment)
                        startEditAssignment()
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        confirmDelete(assignment.id)
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

        {/* Assignment Editor */}
        <Card className="p-6 lg:col-span-2">
          {(isEditing || isCreating) ? (
            <div className="space-y-4">
              <h3 className="text-xl font-bold">{isCreating ? 'Create New Assignment' : 'Edit Assignment'}</h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Assignment Title</Label>
                  <Input
                    id="title"
                    value={assignmentForm.title}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })}
                    className="rounded-xl"
                  />
                </div>

                <div>
                  <Label htmlFor="course_id">Course</Label>
                  <Select value={assignmentForm.course_id} onValueChange={(value) => setAssignmentForm({ ...assignmentForm, course_id: value })}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select a course" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="course1">Introduction to Computing</SelectItem>
                      <SelectItem value="course2">Data Structures</SelectItem>
                      <SelectItem value="course3">Database Systems</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={assignmentForm.description}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, description: e.target.value })}
                    className="rounded-xl"
                    rows={6}
                  />
                </div>

                <div>
                  <Label htmlFor="due_date">Due Date</Label>
                  <Input
                    id="due_date"
                    type="datetime-local"
                    value={assignmentForm.due_date}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, due_date: e.target.value })}
                    className="rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="total_points">Total Points</Label>
                    <Input
                      id="total_points"
                      type="number"
                      value={assignmentForm.total_points}
                      onChange={(e) => setAssignmentForm({ ...assignmentForm, total_points: parseInt(e.target.value) })}
                      className="rounded-xl"
                    />
                  </div>

                  {assignmentForm.allow_late_submission && (
                    <div>
                      <Label htmlFor="late_penalty">Late Penalty (%)</Label>
                      <Input
                        id="late_penalty"
                        type="number"
                        value={assignmentForm.late_penalty}
                        onChange={(e) => setAssignmentForm({ ...assignmentForm, late_penalty: parseInt(e.target.value) })}
                        className="rounded-xl"
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    id="is_published"
                    checked={assignmentForm.is_published}
                    onCheckedChange={(checked) => setAssignmentForm({ ...assignmentForm, is_published: checked })}
                  />
                  <Label htmlFor="is_published">Publish immediately</Label>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    id="allow_late_submission"
                    checked={assignmentForm.allow_late_submission}
                    onCheckedChange={(checked) => setAssignmentForm({ ...assignmentForm, allow_late_submission: checked })}
                  />
                  <Label htmlFor="allow_late_submission">Allow late submissions</Label>
                </div>

                <div className="flex gap-3">
                  <Button onClick={saveAssignment} className="flex-1 rounded-xl">
                    <Save className="mr-2 h-4 w-4" />
                    Save Assignment
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
          ) : selectedAssignment ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">{selectedAssignment.title}</h3>
                <Button onClick={startEditAssignment} variant="outline" size="sm" className="rounded-xl">
                  <Edit2 className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-xs text-muted-foreground">Course</p>
                  <p className="text-lg font-bold">{selectedAssignment.course_name || 'Not assigned'}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-xs text-muted-foreground">Due Date</p>
                  <p className="text-lg font-bold">{selectedAssignment.due_date || 'Not set'}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-xs text-muted-foreground">Total Points</p>
                  <p className="text-lg font-bold">{selectedAssignment.total_points}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className="text-lg font-bold">{selectedAssignment.is_published ? 'Published' : 'Draft'}</p>
                </div>
              </div>

              {selectedAssignment.description && (
                <div className="p-4 rounded-xl border border-border">
                  <p className="text-sm font-semibold mb-2">Description:</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedAssignment.description}</p>
                </div>
              )}

              {selectedAssignment.allow_late_submission && (
                <div className="p-4 rounded-xl border border-border">
                  <p className="text-sm font-semibold">Late submissions allowed with {selectedAssignment.late_penalty}% penalty</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              Select or create an assignment to view details
            </div>
          )}
        </Card>
      </div>

      {/* Submissions */}
      {selectedAssignment && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Student Submissions</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              {submissions.length} submissions
            </div>
          </div>

          <div className="space-y-3">
            {submissions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No submissions yet.</p>
            ) : (
              submissions.map((submission) => (
                <Card key={submission.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-semibold">{submission.student_name || 'Unknown Student'}</p>
                        <span className="text-xs text-muted-foreground">
                          Submitted: {new Date(submission.submitted_at).toLocaleDateString()}
                        </span>
                      </div>
                      {submission.file_url && (
                        <a 
                          href={submission.file_url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                        >
                          <Paperclip className="h-4 w-4" />
                          View submission
                        </a>
                      )}
                      {submission.feedback && (
                        <div className="mt-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                          <p className="text-xs text-muted-foreground">Feedback:</p>
                          <p className="text-sm">{submission.feedback}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-semibold">Grade: {submission.grade ?? 'Not graded'}/{selectedAssignment.total_points}</p>
                      </div>
                      {submission.grade === null && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            const grade = prompt('Enter grade (0-' + selectedAssignment.total_points + '):')
                            const feedback = prompt('Enter feedback (optional):')
                            if (grade !== null) {
                              gradeSubmission(submission.id, parseInt(grade), feedback || '')
                            }
                          }}
                          className="rounded-xl"
                        >
                          Grade
                        </Button>
                      )}
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
            <AlertDialogTitle>Delete Assignment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this assignment and all associated submissions. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => assignmentToDelete && deleteAssignment(assignmentToDelete)}
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
