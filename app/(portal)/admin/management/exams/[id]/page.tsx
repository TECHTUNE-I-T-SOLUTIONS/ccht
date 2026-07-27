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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { ArrowLeft, Plus, Edit2, Trash2, Save, X, Upload, FileSpreadsheet, FileText, Shield, User, Sparkles, Download, FileUp } from 'lucide-react'

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
  const [uploadingFile, setUploadingFile] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [activeTab, setActiveTab] = useState('manual')

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

  const handleFileUpload = async () => {
    if (!uploadedFile) {
      toast.error('Please select a file first')
      return
    }

    setUploadingFile(true)
    try {
      const formData = new FormData()
      formData.append('file', uploadedFile)
      formData.append('examId', params.id as string)

      const res = await fetch('/api/v1/admin/exams/upload-questions', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload questions')
      }

      toast.success(`Successfully imported ${data.data.inserted} questions`)
      setUploadDialogOpen(false)
      setUploadedFile(null)
      loadData()
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload questions')
      console.error(error)
    } finally {
      setUploadingFile(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadedFile(file)
    }
  }

  const downloadTemplate = () => {
    const template = `1. What is the capital of France?
A. London
B. Paris
C. Berlin
D. Madrid
Answer: Paris
Points: 1
Explanation: Paris is the capital and largest city of France.

2. Which planet is known as the Red Planet?
A. Venus
B. Mars
C. Jupiter
D. Saturn
Answer: Mars
Points: 1
Explanation: Mars appears red due to iron oxide on its surface.`

    const blob = new Blob([template], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'questions-template.txt'
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Template downloaded')
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
          <Button onClick={() => setUploadDialogOpen(true)} variant="outline" className="rounded-xl">
            <Upload className="mr-2 h-4 w-4" />
            Import Questions
          </Button>
          <Button onClick={startCreateQuestion} className="rounded-xl">
            <Plus className="mr-2 h-4 w-4" />
            Add Question
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Exam Information</h3>
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

      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-2xl bg-white dark:bg-black">
          <DialogHeader>
            <DialogTitle>Import Questions</DialogTitle>
            <DialogDescription>
              Upload a file to import questions. Supports plain text files with formatted questions.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual">Manual Upload</TabsTrigger>
              <TabsTrigger value="ai">AI-Powered Parse</TabsTrigger>
            </TabsList>

            <TabsContent value="manual" className="space-y-4 mt-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">Download Template</p>
                    <p className="text-xs text-muted-foreground">Get a sample format for your questions</p>
                  </div>
                </div>
                <Button onClick={downloadTemplate} variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>

              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <FileUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground mb-4">
                  Drag and drop your file here, or click to browse
                </p>
                <Input
                  type="file"
                  accept=".txt,.pdf,.doc,.docx,.xlsx,.xls"
                  onChange={handleFileChange}
                  className="max-w-xs mx-auto"
                />
                {uploadedFile && (
                  <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <p className="text-sm text-green-700 dark:text-green-400">
                      ✓ {uploadedFile.name}
                    </p>
                  </div>
                )}
              </div>

              <div className="text-xs text-muted-foreground">
                <p className="font-medium mb-1">Supported file types:</p>
                <p>Plain text (.txt) - Currently supported</p>
                <p>PDF, Word, Excel - Coming soon</p>
              </div>
            </TabsContent>

            <TabsContent value="ai" className="space-y-4 mt-4">
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <Sparkles className="h-12 w-12 mx-auto text-purple-600 mb-4" />
                <p className="text-sm text-muted-foreground mb-4">
                  AI-powered question parsing coming soon
                </p>
                <p className="text-xs text-muted-foreground">
                  Upload any document and let AI automatically extract and format questions
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setUploadDialogOpen(false)
              setUploadedFile(null)
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleFileUpload} 
              disabled={!uploadedFile || uploadingFile || activeTab === 'ai'}
            >
              {uploadingFile ? 'Uploading...' : 'Import Questions'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
