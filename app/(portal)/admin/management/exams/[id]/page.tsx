'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { ArrowLeft, Plus, Edit2, Trash2, Save, X, Upload, FileSpreadsheet, FileText, Shield } from 'lucide-react'

type ExamQuestion = {
  id: string
  exam_id: string
  question_text: string
  question_type: string
  options: string[]
  correct_answer: string
  marks: number
  question_number: number
  is_active: boolean
  explanation?: string
}

export default function AdminExamDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [exam, setExam] = useState<any>(null)
  const [questions, setQuestions] = useState<ExamQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<ExamQuestion | null>(null)
  const [isCreatingQuestion, setIsCreatingQuestion] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [questionToDelete, setQuestionToDelete] = useState<ExamQuestion | null>(null)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [parsedQuestions, setParsedQuestions] = useState<any[]>([])
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0)
  const [examDialogOpen, setExamDialogOpen] = useState(false)
  const [editingExam, setEditingExam] = useState<any>(null)
  const [savingExam, setSavingExam] = useState(false)

  const [questionForm, setQuestionForm] = useState({
    question_text: '',
    question_type: 'multiple_choice' as string,
    options: ['', '', '', ''],
    correct_answer: '',
    marks: 10,
    question_number: 1,
    is_active: true,
    explanation: '',
  })

  const [examForm, setExamForm] = useState({
    exam_title: '',
    exam_type: '',
    exam_description: '',
    duration_minutes: 60,
    total_marks: 100,
    passing_marks: 50,
    is_published: false,
    instructions: '',
    session_id: '',
    semester_id: '',
    course_id: '',
    start_date: '',
    end_date: '',
    allow_review: false,
    review_start_date: '',
    review_end_date: '',
  })

  useEffect(() => {
    if (!params.id) return
    loadData()
  }, [params.id])

  const loadData = async () => {
    setLoading(true)
    try {
      const [examRes, qRes] = await Promise.all([
        fetch(`/api/v1/admin/exams/${params.id}`).then((r) => r.json()),
        fetch(`/api/v1/admin/exams/${params.id}/questions`).then((r) => r.json()),
      ])
      setExam(examRes.data || null)
      const mappedQuestions = (qRes.data || []).map((q: any) => ({
        ...q,
        marks: q.marks || q.points || 10,
        question_number: q.question_number || q.question_order || 1,
      }))
      setQuestions(mappedQuestions)
    } catch (error) {
      toast.error('Failed to load exam')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const saveQuestion = async () => {
    try {
      const method = editingQuestion ? 'PUT' : 'POST'
      const url = editingQuestion 
        ? `/api/v1/admin/exams/questions/${editingQuestion.id}` 
        : `/api/v1/admin/exams/${params.id}/questions`
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...questionForm,
          exam_session_id: params.id,
        }),
      })

      if (!res.ok) throw new Error('Failed to save question')
      
      toast.success(editingQuestion ? 'Question updated' : 'Question created')
      setEditingQuestion(null)
      setIsCreatingQuestion(false)
      setQuestionDialogOpen(false)
      loadData()
    } catch (error) {
      toast.error('Failed to save question')
      console.error(error)
    }
  }

  const deleteQuestion = async (id: string) => {
    try {
      const res = await fetch(`/api/v1/admin/exams/questions/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete question')
      
      toast.success('Question deleted')
      setDeleteDialogOpen(false)
      setQuestionToDelete(null)
      loadData()
    } catch (error) {
      toast.error('Failed to delete question')
      console.error(error)
    }
  }

  const startDeleteQuestion = (question: ExamQuestion) => {
    setQuestionToDelete(question)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (questionToDelete) {
      deleteQuestion(questionToDelete.id)
    }
  }

  const startEditQuestion = (question: ExamQuestion) => {
    setQuestionForm({
      question_text: question.question_text,
      question_type: question.question_type,
      options: question.options,
      correct_answer: question.correct_answer,
      marks: question.marks,
      question_number: question.question_number,
      is_active: question.is_active,
      explanation: question.explanation || '',
    })
    setEditingQuestion(question)
    setIsCreatingQuestion(false)
    setQuestionDialogOpen(true)
  }

  const startCreateQuestion = () => {
    setQuestionForm({
      question_text: '',
      question_type: 'multiple_choice',
      options: ['', '', '', ''],
      correct_answer: '',
      marks: 10,
      question_number: questions.length + 1,
      is_active: true,
      explanation: '',
    })
    setEditingQuestion(null)
    setIsCreatingQuestion(true)
    setQuestionDialogOpen(true)
  }

  const getCreatorBadge = () => {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Shield className="h-4 w-4 text-purple-600" />
        <span className="font-medium">Admin</span>
      </div>
    )
  }

  const downloadCSVTemplate = () => {
    const headers = ['question_text', 'question_type', 'options', 'correct_answer', 'marks', 'question_number', 'is_active']
    const sampleData = [
      'What is the capital of France?,multiple_choice,"Paris,London,Berlin,Rome",Paris,10,1,true',
      'The Earth is flat.,true_false,,false,5,2,true',
      'Explain the concept of photosynthesis.,essay,,A detailed explanation...,15,3,true',
      'Fill in the blank: Photosynthesis occurs in the _____ of plant cells.,fill_blank,,chloroplasts,5,4,true',
    ]
    
    const csvContent = [headers.join(','), ...sampleData].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'questions_template.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const fileName = file.name.toLowerCase()
    const isAIParsed = fileName.endsWith('.pdf') || fileName.endsWith('.doc') || fileName.endsWith('.docx')

    try {
      let questions: any[] = []

      if (isAIParsed) {
        // Use AI parsing for PDF/Word documents
        const formData = new FormData()
        formData.append('file', file)
        
        const res = await fetch('/api/v1/admin/exams/parse-document', {
          method: 'POST',
          body: formData,
        })

        if (!res.ok) throw new Error('Failed to parse document with AI')
        
        const data = await res.json()
        questions = data.data || []
      } else {
        // Parse CSV/Excel for review (without saving)
        const formData = new FormData()
        formData.append('file', file)
        
        const res = await fetch('/api/v1/admin/exams/parse-questions', {
          method: 'POST',
          body: formData,
        })

        if (!res.ok) throw new Error('Failed to parse file')
        
        const data = await res.json()
        questions = data.data || []
      }

      // Debug: Log first question to see structure
      if (questions.length > 0) {
        console.log('First question received:', JSON.stringify(questions[0], null, 2))
      }

      // Show review modal
      if (questions.length > 0) {
        setParsedQuestions(questions)
        setCurrentReviewIndex(0)
        setReviewDialogOpen(true)
        setUploadDialogOpen(false)
      } else {
        toast.warning('No questions found in document')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to parse questions')
      console.error(error)
    }
  }

  const saveReviewedQuestions = async () => {
    try {
      const importPromises = parsedQuestions.map((q: any) =>
        fetch('/api/v1/admin/exams/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...q,
            exam_session_id: params.id,
            question_number: q.question_number,
            marks: q.marks,
          }),
        })
      )

      const results = await Promise.allSettled(importPromises)
      const failed = results.filter(r => r.status === 'rejected')
      
      if (failed.length > 0) {
        console.error('Failed to import some questions:', failed)
        toast.error(`Failed to import ${failed.length} of ${parsedQuestions.length} questions`)
      } else {
        toast.success(`${parsedQuestions.length} questions imported successfully`)
      }
      
      setReviewDialogOpen(false)
      setParsedQuestions([])
      loadData()
    } catch (error: any) {
      toast.error('Failed to import questions')
      console.error(error)
    }
  }

  const updateParsedQuestion = (index: number, field: string, value: any) => {
    const updated = [...parsedQuestions]
    updated[index] = { ...updated[index], [field]: value }
    setParsedQuestions(updated)
  }

  const startEditExam = () => {
    if (!exam) return
    // Format dates for datetime-local input (YYYY-MM-DDTHH:MM)
    const formatDateForInput = (dateStr: string | null) => {
      if (!dateStr) return ''
      const date = new Date(dateStr)
      return date.toISOString().slice(0, 16)
    }

    setExamForm({
      exam_title: exam.exam_title || '',
      exam_type: exam.exam_type || '',
      exam_description: exam.exam_description || '',
      duration_minutes: exam.duration_minutes || 60,
      total_marks: exam.total_marks || 100,
      passing_marks: exam.passing_marks || 50,
      is_published: exam.is_published || false,
      instructions: exam.instructions || '',
      session_id: exam.session_id || '',
      semester_id: exam.semester_id || '',
      course_id: exam.course_id || '',
      start_date: formatDateForInput(exam.start_date),
      end_date: formatDateForInput(exam.end_date),
      allow_review: exam.allow_review || false,
      review_start_date: formatDateForInput(exam.review_start_date),
      review_end_date: formatDateForInput(exam.review_end_date),
    })
    setEditingExam(exam)
    setExamDialogOpen(true)
  }

  const saveExam = async () => {
    setSavingExam(true)
    try {
      // Convert empty date strings to null for PostgreSQL
      const dataToSave = {
        ...examForm,
        start_date: examForm.start_date || null,
        end_date: examForm.end_date || null,
        review_start_date: examForm.review_start_date || null,
        review_end_date: examForm.review_end_date || null,
      }

      const res = await fetch(`/api/v1/admin/exams/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSave),
      })

      if (!res.ok) throw new Error('Failed to save exam')

      toast.success('Exam updated successfully')
      setExamDialogOpen(false)
      setEditingExam(null)
      loadData()
    } catch (error) {
      toast.error('Failed to save exam')
      console.error(error)
    } finally {
      setSavingExam(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading exam...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{exam?.exam_title || 'Exam Details'}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {exam?.course?.code} - {exam?.course?.title}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setUploadDialogOpen(true)} variant="outline" className="rounded-xl border border-primary hover:text-blue-600 hover:shadow-lg hover:shadow-blue-200">
            <Upload className="mr-2 h-4 w-4" />
            Import Questions
          </Button>
          <Button onClick={startCreateQuestion} className="rounded-xl border border-primary hover:text-blue-600 hover:shadow-lg hover:shadow-blue-200">
            <Plus className="mr-2 h-4 w-4" />
            Add Question
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Exam Information</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={startEditExam}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Session:</span>
              <span className="font-medium">{exam?.session?.name || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Semester:</span>
              <span className="font-medium">{exam?.semester?.semester_name || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type:</span>
              <span className="font-medium">{exam?.exam_type || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Duration:</span>
              <span className="font-medium">{exam?.duration_minutes} min</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Marks:</span>
              <span className="font-medium">{exam?.total_marks}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Passing Marks:</span>
              <span className="font-medium">{exam?.passing_marks}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <span className={`font-medium ${exam?.is_published ? 'text-emerald-600' : 'text-gray-600'}`}>
                {exam?.is_published ? 'Published' : 'Draft'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Start Date:</span>
              <span className="font-medium">{exam?.start_date ? new Date(exam.start_date).toLocaleString() : 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">End Date:</span>
              <span className="font-medium">{exam?.end_date ? new Date(exam.end_date).toLocaleString() : 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Instructions:
              </span>
              <span className="font-medium break-words">{exam?.instructions}</span>
            </div>
            <div className="pt-2 border-t">
              {getCreatorBadge()}
              <div className="text-xs text-muted-foreground mt-1">
                {exam?.creator ? `${exam.creator.first_name} ${exam.creator.last_name}` : 'Unknown'}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Questions ({questions.length})</h3>
          </div>

          {questions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No questions yet. Click "Add Question" to get started.
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {questions.map((question) => (
                <Card key={question.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-sm">Q{question.question_number}</span>
                        <span className="text-xs text-muted-foreground">({question.marks} marks)</span>
                        {!question.is_active && (
                          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">Inactive</span>
                        )}
                      </div>
                      <p className="text-sm">{question.question_text}</p>
                      {question.question_type === 'multiple_choice' && question.options && (
                        <div className="mt-2 space-y-1">
                          {question.options.map((option, idx) => (
                            <div key={idx} className={`text-xs ${option === question.correct_answer ? 'text-emerald-600 font-medium' : 'text-muted-foreground'}`}>
                              {String.fromCharCode(65 + idx)}. {option}
                              {option === question.correct_answer && ' ✓'}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
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
                        onClick={() => startDeleteQuestion(question)}
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
      </div>

      <Card className="p-6">
        <h3 className="font-semibold mb-4">Instructions</h3>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
          {exam?.instructions || 'No instructions provided.'}
        </p>
      </Card>

      <Dialog open={questionDialogOpen} onOpenChange={setQuestionDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-black">
          <DialogHeader>
            <DialogTitle>
              {editingQuestion ? 'Edit Question' : 'Create Question'}
            </DialogTitle>
            <DialogDescription>
              {editingQuestion ? 'Update the question details below.' : 'Add a new question to this exam.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="question_text">Question Text *</Label>
              <Textarea
                id="question_text"
                value={questionForm.question_text}
                onChange={(e) => setQuestionForm({ ...questionForm, question_text: e.target.value })}
                placeholder="Enter the question..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="question_type">Question Type</Label>
                <Select
                  value={questionForm.question_type}
                  onValueChange={(value) => setQuestionForm({ ...questionForm, question_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                    <SelectItem value="true_false">True/False</SelectItem>
                    <SelectItem value="short_answer">Short Answer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="marks">Marks</Label>
                <Input
                  id="marks"
                  type="number"
                  value={questionForm.marks}
                  onChange={(e) => setQuestionForm({ ...questionForm, marks: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="question_number">Question Number</Label>
              <Input
                id="question_number"
                type="number"
                value={questionForm.question_number}
                onChange={(e) => setQuestionForm({ ...questionForm, question_number: parseInt(e.target.value) })}
              />
            </div>

            {questionForm.question_type === 'multiple_choice' && (
              <div className="space-y-2">
                <Label>Options</Label>
                {questionForm.options.map((option, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Input
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...questionForm.options]
                        newOptions[idx] = e.target.value
                        setQuestionForm({ ...questionForm, options: newOptions })
                      }}
                      placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                    />
                    <Button
                      type="button"
                      variant={questionForm.correct_answer === option ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setQuestionForm({ ...questionForm, correct_answer: option })}
                    >
                      {questionForm.correct_answer === option ? '✓' : String.fromCharCode(65 + idx)}
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {questionForm.question_type === 'true_false' && (
              <div>
                <Label>Correct Answer</Label>
                <Select
                  value={questionForm.correct_answer}
                  onValueChange={(value) => setQuestionForm({ ...questionForm, correct_answer: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">True</SelectItem>
                    <SelectItem value="false">False</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="explanation">Explanation (Optional)</Label>
              <Textarea
                id="explanation"
                value={questionForm.explanation}
                onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                placeholder="Explanation for the correct answer..."
                rows={2}
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="is_active"
                checked={questionForm.is_active}
                onCheckedChange={(checked) => setQuestionForm({ ...questionForm, is_active: checked as boolean })}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setQuestionDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveQuestion}>
              <Save className="mr-2 h-4 w-4" />
              {editingQuestion ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Question?</DialogTitle>
            <DialogDescription>
              This will permanently delete this question. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="bg-white dark:bg-black">
          <DialogHeader>
            <DialogTitle>Import Questions</DialogTitle>
            <DialogDescription>
              Upload a CSV, Excel, PDF, or Word document to import questions. For CSV/Excel, use the template below. For PDF/Word, AI will extract questions automatically.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <Button onClick={downloadCSVTemplate} variant="outline" className="w-full">
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Download CSV Template
            </Button>
            
            <div>
              <Label htmlFor="file_upload">Select File</Label>
              <Input
                id="file_upload"
                type="file"
                accept=".csv,.xlsx,.xls,.pdf,.doc,.docx"
                onChange={handleFileUpload}
              />
            </div>

            <div className="flex gap-3">
              <Button onClick={() => document.getElementById('file_upload')?.click()} className="flex-1 border border-primary hover:shadow-lg hover:shadow-blue-600">
                <Upload className="mr-2 h-4 w-4" />
                Upload File
              </Button>
              <Button
                variant="outline"
                onClick={() => setUploadDialogOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Review Questions Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-black">
          <DialogHeader>
            <DialogTitle>Review Imported Questions</DialogTitle>
            <DialogDescription>
              Review and edit questions before importing. Question {currentReviewIndex + 1} of {parsedQuestions.length}
            </DialogDescription>
          </DialogHeader>
          
          {parsedQuestions.length > 0 && (
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="review_question_text">Question Text</Label>
                <Textarea
                  id="review_question_text"
                  value={parsedQuestions[currentReviewIndex]?.question_text || ''}
                  onChange={(e) => updateParsedQuestion(currentReviewIndex, 'question_text', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="review_question_type">Question Type</Label>
                  <Select 
                    value={parsedQuestions[currentReviewIndex]?.question_type || 'multiple_choice'} 
                    onValueChange={(value) => updateParsedQuestion(currentReviewIndex, 'question_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                      <SelectItem value="true_false">True/False</SelectItem>
                      <SelectItem value="short_answer">Short Answer</SelectItem>
                      <SelectItem value="essay">Essay</SelectItem>
                      <SelectItem value="fill_blank">Fill in the Blank</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="review_marks">Marks</Label>
                  <Input
                    id="review_marks"
                    type="number"
                    value={parsedQuestions[currentReviewIndex]?.marks || 10}
                    onChange={(e) => updateParsedQuestion(currentReviewIndex, 'marks', parseInt(e.target.value))}
                  />
                </div>
              </div>

              {(parsedQuestions[currentReviewIndex]?.question_type === 'multiple_choice' || 
                parsedQuestions[currentReviewIndex]?.question_type?.includes('multiple') ||
                parsedQuestions[currentReviewIndex]?.question_type?.includes('choice')) && (
                <div className="space-y-2">
                  <Label>Options</Label>
                  {parsedQuestions[currentReviewIndex]?.options?.map((option: string, idx: number) => (
                    <div key={idx} className="flex gap-2">
                      <Input
                        value={option || ''}
                        onChange={(e) => {
                          const newOptions = [...(parsedQuestions[currentReviewIndex]?.options || [])]
                          newOptions[idx] = e.target.value
                          updateParsedQuestion(currentReviewIndex, 'options', newOptions)
                        }}
                        placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant={parsedQuestions[currentReviewIndex]?.correct_answer === option ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateParsedQuestion(currentReviewIndex, 'correct_answer', option)}
                      >
                        {parsedQuestions[currentReviewIndex]?.correct_answer === option ? '✓' : String.fromCharCode(65 + idx)}
                      </Button>
                    </div>
                  ))}
                  {(!parsedQuestions[currentReviewIndex]?.options || parsedQuestions[currentReviewIndex]?.options.length === 0) && (
                    <p className="text-xs text-muted-foreground">No options found. Add options above.</p>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const currentOptions = parsedQuestions[currentReviewIndex]?.options || []
                      updateParsedQuestion(currentReviewIndex, 'options', [...currentOptions, ''])
                    }}
                    className="w-full"
                  >
                    + Add Option
                  </Button>
                </div>
              )}

              <div>
                <Label htmlFor="review_correct_answer">Correct Answer</Label>
                {parsedQuestions[currentReviewIndex]?.question_type === 'multiple_choice' ? (
                  <Select 
                    value={parsedQuestions[currentReviewIndex]?.correct_answer || ''} 
                    onValueChange={(value) => updateParsedQuestion(currentReviewIndex, 'correct_answer', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select correct option" />
                    </SelectTrigger>
                    <SelectContent>
                      {parsedQuestions[currentReviewIndex]?.options?.map((option: string, idx: number) => (
                        option && <SelectItem key={idx} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : parsedQuestions[currentReviewIndex]?.question_type === 'true_false' ? (
                  <Select 
                    value={parsedQuestions[currentReviewIndex]?.correct_answer || ''} 
                    onValueChange={(value) => updateParsedQuestion(currentReviewIndex, 'correct_answer', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select answer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">True</SelectItem>
                      <SelectItem value="false">False</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="review_correct_answer"
                    value={parsedQuestions[currentReviewIndex]?.correct_answer || ''}
                    onChange={(e) => updateParsedQuestion(currentReviewIndex, 'correct_answer', e.target.value)}
                    placeholder="Enter correct answer"
                  />
                )}
              </div>

              <div>
                <Label htmlFor="review_explanation">Explanation (Optional)</Label>
                <Textarea
                  id="review_explanation"
                  value={parsedQuestions[currentReviewIndex]?.explanation || ''}
                  onChange={(e) => updateParsedQuestion(currentReviewIndex, 'explanation', e.target.value)}
                  rows={2}
                  placeholder="Provide an explanation..."
                />
              </div>
            </div>
          )}
          
          <DialogFooter className="flex justify-between">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentReviewIndex(Math.max(0, currentReviewIndex - 1))}
                disabled={currentReviewIndex === 0}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentReviewIndex(Math.min(parsedQuestions.length - 1, currentReviewIndex + 1))}
                disabled={currentReviewIndex === parsedQuestions.length - 1}
              >
                Next
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setReviewDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={saveReviewedQuestions}>
                Import All Questions
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={examDialogOpen} onOpenChange={setExamDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-black">
          <DialogHeader>
            <DialogTitle>Edit Exam Details</DialogTitle>
            <DialogDescription>
              Update the exam information below.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="exam_title">Exam Title *</Label>
              <Input
                id="exam_title"
                value={examForm.exam_title}
                onChange={(e) => setExamForm({ ...examForm, exam_title: e.target.value })}
                placeholder="Enter exam title..."
              />
            </div>

            <div>
              <Label htmlFor="exam_description">Description</Label>
              <Textarea
                id="exam_description"
                value={examForm.exam_description}
                onChange={(e) => setExamForm({ ...examForm, exam_description: e.target.value })}
                placeholder="Enter exam description..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="exam_type">Exam Type *</Label>
                <Select
                  value={examForm.exam_type}
                  onValueChange={(value) => setExamForm({ ...examForm, exam_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="regular">Regular</SelectItem>
                    <SelectItem value="midterm">Midterm</SelectItem>
                    <SelectItem value="final">Final</SelectItem>
                    <SelectItem value="quiz">Quiz</SelectItem>
                    <SelectItem value="assignment">Assignment</SelectItem>
                    <SelectItem value="practical">Practical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="duration_minutes">Duration (minutes) *</Label>
                <Input
                  id="duration_minutes"
                  type="number"
                  value={examForm.duration_minutes}
                  onChange={(e) => setExamForm({ ...examForm, duration_minutes: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="total_marks">Total Marks *</Label>
                <Input
                  id="total_marks"
                  type="number"
                  value={examForm.total_marks}
                  onChange={(e) => setExamForm({ ...examForm, total_marks: parseInt(e.target.value) })}
                />
              </div>

              <div>
                <Label htmlFor="passing_marks">Passing Marks *</Label>
                <Input
                  id="passing_marks"
                  type="number"
                  value={examForm.passing_marks}
                  onChange={(e) => setExamForm({ ...examForm, passing_marks: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="datetime-local"
                  value={examForm.start_date}
                  onChange={(e) => setExamForm({ ...examForm, start_date: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  type="datetime-local"
                  value={examForm.end_date}
                  onChange={(e) => setExamForm({ ...examForm, end_date: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="instructions">Instructions</Label>
              <Textarea
                id="instructions"
                value={examForm.instructions}
                onChange={(e) => setExamForm({ ...examForm, instructions: e.target.value })}
                placeholder="Enter exam instructions..."
                rows={4}
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="is_published"
                checked={examForm.is_published}
                onCheckedChange={(checked) => setExamForm({ ...examForm, is_published: checked as boolean })}
              />
              <Label htmlFor="is_published">Published</Label>
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-3">Review Settings</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="allow_review"
                    checked={examForm.allow_review}
                    onCheckedChange={(checked) => setExamForm({ ...examForm, allow_review: checked as boolean })}
                  />
                  <Label htmlFor="allow_review">Allow Review</Label>
                </div>

                {examForm.allow_review && (
                  <div className="grid grid-cols-2 gap-4 ml-6">
                    <div>
                      <Label htmlFor="review_start_date">Review Start Date</Label>
                      <Input
                        id="review_start_date"
                        type="datetime-local"
                        value={examForm.review_start_date}
                        onChange={(e) => setExamForm({ ...examForm, review_start_date: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="review_end_date">Review End Date</Label>
                      <Input
                        id="review_end_date"
                        type="datetime-local"
                        value={examForm.review_end_date}
                        onChange={(e) => setExamForm({ ...examForm, review_end_date: e.target.value })}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setExamDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveExam} disabled={savingExam} className="border border-primary hover:text-blue-600 hover:shadow-lg hover:shadow-blue-200">
              <Save className="mr-2 h-4 w-4" />
              {savingExam ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}