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
import { Plus, Edit2, Trash2, Save, X, ClipboardList, CalendarDays, Clock3, Users, Award } from 'lucide-react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'

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

type ExamQuestion = {
  id: string
  exam_id: string
  question_text: string
  question_type: string
  options: string[]
  correct_answer: string
  points: number
  question_order: number
  is_active: boolean
}

export default function TeacherExamsPage() {
  const [exams, setExams] = useState<TeacherExam[]>([])
  const [questions, setQuestions] = useState<ExamQuestion[]>([])
  const [selectedExam, setSelectedExam] = useState<TeacherExam | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<ExamQuestion | null>(null)
  const [isCreatingQuestion, setIsCreatingQuestion] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [examToDelete, setExamToDelete] = useState<string | null>(null)

  const [examForm, setExamForm] = useState({
    exam_name: '',
    exam_description: '',
    course_id: '',
    exam_date: '',
    duration_minutes: 60,
    total_questions: 10,
    passing_score: 50,
    instructions: '',
    is_active: true,
  })

  const [questionForm, setQuestionForm] = useState({
    question_text: '',
    question_type: 'multiple_choice' as string,
    options: ['', '', '', ''],
    correct_answer: '',
    points: 10,
    question_order: 1,
    is_active: true,
  })

  useEffect(() => {
    loadExams()
  }, [])

  useEffect(() => {
    if (selectedExam) {
      loadQuestions(selectedExam.id)
    }
  }, [selectedExam])

  const loadExams = async () => {
    try {
      const res = await fetch('/api/v1/teacher/exams')
      if (!res.ok) throw new Error('Failed to load exams')
      const data = await res.json()
      setExams(data.data || [])
      if (data.data?.length > 0 && !selectedExam) {
        setSelectedExam(data.data[0])
      }
    } catch (error) {
      toast.error('Failed to load exams')
      console.error(error)
    }
  }

  const loadQuestions = async (examId: string) => {
    try {
      const res = await fetch(`/api/v1/teacher/exams/${examId}/questions`)
      if (!res.ok) throw new Error('Failed to load questions')
      const data = await res.json()
      setQuestions(data.data || [])
    } catch (error) {
      toast.error('Failed to load questions')
      console.error(error)
    }
  }

  const saveExam = async () => {
    try {
      const method = isCreating ? 'POST' : 'PUT'
      const url = isCreating ? '/api/v1/teacher/exams' : `/api/v1/teacher/exams/${selectedExam?.id}`
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(examForm),
      })

      if (!res.ok) throw new Error('Failed to save exam')
      
      toast.success(isCreating ? 'Exam created' : 'Exam updated')
      setIsCreating(false)
      setIsEditing(false)
      loadExams()
    } catch (error) {
      toast.error('Failed to save exam')
      console.error(error)
    }
  }

  const deleteExam = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/teacher/exams/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete exam')
      
      toast.success('Exam deleted')
      setSelectedExam(null)
      setDeleteDialogOpen(false)
      loadExams()
    } catch (error) {
      toast.error('Failed to delete exam')
      console.error(error)
    }
  }

  const saveQuestion = async () => {
    try {
      const method = editingQuestion ? 'PUT' : 'POST'
      const url = editingQuestion 
        ? `/api/v1/teacher/exams/questions/${editingQuestion.id}` 
        : '/api/v1/teacher/exams/questions'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...questionForm,
          exam_id: selectedExam?.id,
        }),
      })

      if (!res.ok) throw new Error('Failed to save question')
      
      toast.success(editingQuestion ? 'Question updated' : 'Question created')
      setEditingQuestion(null)
      setIsCreatingQuestion(false)
      loadQuestions(selectedExam!.id)
    } catch (error) {
      toast.error('Failed to save question')
      console.error(error)
    }
  }

  const deleteQuestion = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return
    
    try {
      const res = await fetch(`/api/v1/teacher/exams/questions/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete question')
      
      toast.success('Question deleted')
      loadQuestions(selectedExam!.id)
    } catch (error) {
      toast.error('Failed to delete question')
      console.error(error)
    }
  }

  const startEditExam = () => {
    if (!selectedExam) return
    setExamForm({
      exam_name: selectedExam.exam_name,
      exam_description: selectedExam.exam_description,
      course_id: selectedExam.course_id,
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
      course_id: '',
      exam_date: '',
      duration_minutes: 60,
      total_questions: 10,
      passing_score: 50,
      instructions: '',
      is_active: true,
    })
    setIsCreating(true)
    setIsEditing(false)
  }

  const startEditQuestion = (question: ExamQuestion) => {
    setQuestionForm({
      question_text: question.question_text,
      question_type: question.question_type,
      options: question.options,
      correct_answer: question.correct_answer,
      points: question.points,
      question_order: question.question_order,
      is_active: question.is_active,
    })
    setEditingQuestion(question)
    setIsCreatingQuestion(false)
  }

  const startCreateQuestion = () => {
    setQuestionForm({
      question_text: '',
      question_type: 'multiple_choice',
      options: ['', '', '', ''],
      correct_answer: '',
      points: 10,
      question_order: questions.length + 1,
      is_active: true,
    })
    setIsCreatingQuestion(true)
    setEditingQuestion(null)
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
        <Button onClick={startCreateExam} className="rounded-xl">
          <Plus className="mr-2 h-4 w-4" />
          Create Exam
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Exams List */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">My Exams</h2>
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
                      {exam.course_name || 'No course'} • {exam.exam_date || 'No date'} • {exam.duration_minutes} min
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
              <h3 className="text-xl font-bold">{isCreating ? 'Create New Exam' : 'Edit Exam'}</h3>
              
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
                  <Label htmlFor="course_id">Course</Label>
                  <Select value={examForm.course_id} onValueChange={(value) => setExamForm({ ...examForm, course_id: value })}>
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
                  <p className="text-xs text-muted-foreground">Course</p>
                  <p className="text-lg font-bold">{selectedExam.course_name || 'Not assigned'}</p>
                </div>
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
              Select or create an exam to manage questions
            </div>
          )}
        </Card>
      </div>

      {/* Questions Management */}
      {selectedExam && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Exam Questions</h2>
            <Button onClick={startCreateQuestion} size="sm" className="rounded-xl">
              <Plus className="mr-2 h-4 w-4" />
              Add Question
            </Button>
          </div>

          {(isCreatingQuestion || editingQuestion) && (
            <Card className="p-6 mb-6">
              <h3 className="text-lg font-bold mb-4">
                {editingQuestion ? 'Edit Question' : 'Create New Question'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="question_text">Question Text</Label>
                  <Textarea
                    id="question_text"
                    value={questionForm.question_text}
                    onChange={(e) => setQuestionForm({ ...questionForm, question_text: e.target.value })}
                    className="rounded-xl"
                  />
                </div>

                <div>
                  <Label htmlFor="question_type">Question Type</Label>
                  <select
                    id="question_type"
                    value={questionForm.question_type}
                    onChange={(e) => setQuestionForm({ ...questionForm, question_type: e.target.value })}
                    className="w-full rounded-xl border border-input bg-background px-4 py-2"
                  >
                    <option value="multiple_choice">Multiple Choice</option>
                    <option value="true_false">True/False</option>
                    <option value="essay">Essay</option>
                  </select>
                </div>

                {questionForm.question_type === 'multiple_choice' && (
                  <div className="space-y-2">
                    <Label>Options</Label>
                    {questionForm.options.map((option, index) => (
                      <Input
                        key={index}
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...questionForm.options]
                          newOptions[index] = e.target.value
                          setQuestionForm({ ...questionForm, options: newOptions })
                        }}
                        placeholder={`Option ${index + 1}`}
                        className="rounded-xl"
                      />
                    ))}
                  </div>
                )}

                <div>
                  <Label htmlFor="correct_answer">Correct Answer</Label>
                  <Input
                    id="correct_answer"
                    value={questionForm.correct_answer}
                    onChange={(e) => setQuestionForm({ ...questionForm, correct_answer: e.target.value })}
                    className="rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="points">Points</Label>
                    <Input
                      id="points"
                      type="number"
                      value={questionForm.points}
                      onChange={(e) => setQuestionForm({ ...questionForm, points: parseInt(e.target.value) })}
                      className="rounded-xl"
                    />
                  </div>

                  <div>
                    <Label htmlFor="question_order">Order</Label>
                    <Input
                      id="question_order"
                      type="number"
                      value={questionForm.question_order}
                      onChange={(e) => setQuestionForm({ ...questionForm, question_order: parseInt(e.target.value) })}
                      className="rounded-xl"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    id="is_active"
                    checked={questionForm.is_active}
                    onCheckedChange={(checked) => setQuestionForm({ ...questionForm, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>

                <div className="flex gap-3">
                  <Button onClick={saveQuestion} className="flex-1 rounded-xl">
                    <Save className="mr-2 h-4 w-4" />
                    Save Question
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditingQuestion(null)
                      setIsCreatingQuestion(false)
                    }}
                    className="rounded-xl"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          )}

          <div className="space-y-3">
            {questions.map((question, index) => (
              <Card key={question.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-bold text-primary">Q{index + 1}</span>
                      <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                        {question.points} {question.points === 1 ? 'point' : 'points'}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        question.is_active 
                          ? 'bg-emerald-500/10 text-emerald-600' 
                          : 'bg-gray-500/10 text-gray-600'
                      }`}>
                        {question.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-sm font-medium mb-2">{question.question_text}</p>
                    {question.options.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        Options: {question.options.join(', ')}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground mt-1">
                      Correct answer: <span className="font-semibold text-emerald-600">{question.correct_answer}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEditQuestion(question)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteQuestion(question.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      )}

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
