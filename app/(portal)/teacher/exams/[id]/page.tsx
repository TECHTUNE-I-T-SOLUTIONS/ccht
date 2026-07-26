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
import { ArrowLeft, Plus, Edit2, Trash2, Save, X, Upload, FileSpreadsheet, FileText } from 'lucide-react'

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

export default function TeacherExamDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [exam, setExam] = useState<any>(null)
  const [questions, setQuestions] = useState<ExamQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<ExamQuestion | null>(null)
  const [isCreatingQuestion, setIsCreatingQuestion] = useState(false)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [questionToDelete, setQuestionToDelete] = useState<ExamQuestion | null>(null)
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [parsedQuestions, setParsedQuestions] = useState<any[]>([])
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0)

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

  useEffect(() => {
    if (!params.id) return
    loadData()
  }, [params.id])

  const loadData = async () => {
    setLoading(true)
    try {
      const [examRes, qRes] = await Promise.all([
        fetch(`/api/v1/teacher/exams/${params.id}`).then((r) => r.json()),
        fetch(`/api/v1/teacher/exams/${params.id}/questions`).then((r) => r.json()),
      ])
      setExam(examRes.data || null)
      // Map API response to match our type (points -> marks, question_order -> question_number)
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
        ? `/api/v1/teacher/exams/questions/${editingQuestion.id}` 
        : '/api/v1/teacher/exams/questions'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...questionForm,
          exam_id: params.id,
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
      const res = await fetch(`/api/v1/teacher/exams/questions/${id}`, { method: 'DELETE' })
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
    setIsCreatingQuestion(true)
    setEditingQuestion(null)
    setQuestionDialogOpen(true)
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
        
        const res = await fetch('/api/v1/teacher/exams/parse-document', {
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
        
        const res = await fetch('/api/v1/teacher/exams/parse-questions', {
          method: 'POST',
          body: formData,
        })

        if (!res.ok) throw new Error('Failed to parse file')
        
        const data = await res.json()
        questions = data.data || []
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
        fetch('/api/v1/teacher/exams/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...q,
            exam_id: params.id,
            question_order: q.question_number, // Map to expected field name
            points: q.marks, // Map to expected field name
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

  if (loading) return <div className="p-8">Loading exam...</div>
  if (!exam) return <div className="p-8">Exam not found</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{exam.exam_title || exam.exam_name}</h1>
          <p className="text-sm text-muted-foreground">
            {exam.course?.code} - {exam.course?.title}
          </p>
        </div>
      </div>

      {/* Exam Details */}
      <Card className="p-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <p className="text-xs text-muted-foreground">Start Date</p>
            <p className="text-lg font-bold">{exam.start_date ? new Date(exam.start_date).toLocaleString() : 'Not set'}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <p className="text-xs text-muted-foreground">End Date</p>
            <p className="text-lg font-bold">{exam.end_date ? new Date(exam.end_date).toLocaleString() : 'Not set'}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <p className="text-xs text-muted-foreground">Duration</p>
            <p className="text-lg font-bold">{exam.duration_minutes} minutes</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <p className="text-xs text-muted-foreground">Total Marks</p>
            <p className="text-lg font-bold">{exam.total_marks}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <p className="text-xs text-muted-foreground">Passing Marks</p>
            <p className="text-lg font-bold">{exam.passing_marks}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <p className="text-xs text-muted-foreground">Questions</p>
            <p className="text-lg font-bold">{questions.length}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <p className="text-xs text-muted-foreground">Status</p>
            <p className="text-lg font-bold">{exam.is_published ? 'Published' : 'Draft'}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <p className="text-xs text-muted-foreground">Proctoring</p>
            <p className="text-lg font-bold">{exam.proctoring_enabled ? 'Enabled' : 'Disabled'}</p>
          </div>
        </div>
        {exam.instructions && (
          <div className="mt-4 p-4 rounded-xl border border-border">
            <p className="text-sm font-semibold mb-2">Instructions:</p>
            <p className="text-sm text-muted-foreground">{exam.instructions}</p>
          </div>
        )}
      </Card>

      {/* Questions Management */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Exam Questions</h2>
          <div className="flex gap-2">
            <Button onClick={() => setUploadDialogOpen(true)} variant="outline" size="sm">
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Button>
            <Button onClick={startCreateQuestion} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Question
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {questions.map((question, index) => (
            <Card key={question.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-bold text-primary">Q{index + 1}</span>
                    <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                      {question.marks} {question.marks === 1 ? 'mark' : 'marks'}
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
                    onClick={() => startDeleteQuestion(question)}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      {/* Question Dialog */}
      <Dialog open={questionDialogOpen} onOpenChange={setQuestionDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-black">
          <DialogHeader>
            <DialogTitle>{editingQuestion ? 'Edit Question' : 'Create New Question'}</DialogTitle>
            <DialogDescription>
              {editingQuestion ? 'Edit the question details below.' : 'Add a new question to this exam.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="question_text">Question Text</Label>
              <Textarea
                id="question_text"
                value={questionForm.question_text}
                onChange={(e) => setQuestionForm({ ...questionForm, question_text: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="question_type">Question Type</Label>
              <Select value={questionForm.question_type} onValueChange={(value) => setQuestionForm({ ...questionForm, question_type: value })}>
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
                  />
                ))}
              </div>
            )}

            <div>
              <Label htmlFor="correct_answer">Correct Answer</Label>
              {questionForm.question_type === 'multiple_choice' ? (
                <Select value={questionForm.correct_answer} onValueChange={(value) => setQuestionForm({ ...questionForm, correct_answer: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select correct option" />
                  </SelectTrigger>
                  <SelectContent>
                    {questionForm.options.map((option, index) => (
                      option && <SelectItem key={index} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : questionForm.question_type === 'true_false' ? (
                <Select value={questionForm.correct_answer} onValueChange={(value) => setQuestionForm({ ...questionForm, correct_answer: value })}>
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
                  id="correct_answer"
                  value={questionForm.correct_answer}
                  onChange={(e) => setQuestionForm({ ...questionForm, correct_answer: e.target.value })}
                  placeholder="Enter correct answer"
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="marks">Marks</Label>
                <Input
                  id="marks"
                  type="number"
                  value={questionForm.marks}
                  onChange={(e) => setQuestionForm({ ...questionForm, marks: parseInt(e.target.value) })}
                />
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
            </div>

            <div>
              <Label htmlFor="explanation">Explanation (Optional)</Label>
              <Textarea
                id="explanation"
                value={questionForm.explanation}
                onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                placeholder="Provide an explanation for the correct answer..."
                rows={3}
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

            <div className="flex gap-3">
              <Button onClick={saveQuestion} className="flex-1 border border-primary hover:shadow-xl hover:shadow-blue-800">
                <Save className="mr-2 h-4 w-4" />
                Save Question
              </Button>
              <Button
                variant="outline"
                onClick={() => setQuestionDialogOpen(false)}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </div>
          </div>
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
              <Button onClick={() => document.getElementById('file_upload')?.click()} className="flex-1">
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-white dark:bg-black">
          <DialogHeader>
            <DialogTitle>Delete Question</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this question? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {questionToDelete && (
            <div className="py-4">
              <p className="text-sm font-medium mb-2">{questionToDelete.question_text}</p>
              <p className="text-xs text-muted-foreground">
                Type: {questionToDelete.question_type} • Marks: {questionToDelete.marks}
              </p>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete Question
            </Button>
          </DialogFooter>
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

              {parsedQuestions[currentReviewIndex]?.question_type === 'multiple_choice' && (
                <div className="space-y-2">
                  <Label>Options</Label>
                  {parsedQuestions[currentReviewIndex]?.options?.map((option: string, idx: number) => (
                    <Input
                      key={idx}
                      value={option || ''}
                      onChange={(e) => {
                        const newOptions = [...(parsedQuestions[currentReviewIndex]?.options || [])]
                        newOptions[idx] = e.target.value
                        updateParsedQuestion(currentReviewIndex, 'options', newOptions)
                      }}
                      placeholder={`Option ${idx + 1}`}
                    />
                  ))}
                  {(!parsedQuestions[currentReviewIndex]?.options || parsedQuestions[currentReviewIndex]?.options.length === 0) && (
                    <p className="text-xs text-muted-foreground">No options found. Add options above.</p>
                  )}
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
    </div>
  )
}
