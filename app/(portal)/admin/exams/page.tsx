'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react'

type ExamConfig = {
  id: string
  exam_name: string
  exam_description: string
  duration_minutes: number
  total_questions: number
  passing_score: number
  is_active: boolean
  instructions: string
}

type ExamQuestion = {
  id: string
  exam_config_id: string
  question_text: string
  question_type: string
  options: string[]
  correct_answer: string
  points: number
  question_order: number
  is_active: boolean
}

export default function AdminExamsPage() {
  const [configs, setConfigs] = useState<ExamConfig[]>([])
  const [questions, setQuestions] = useState<ExamQuestion[]>([])
  const [selectedConfig, setSelectedConfig] = useState<ExamConfig | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<ExamQuestion | null>(null)
  const [isCreatingQuestion, setIsCreatingQuestion] = useState(false)

  // Form states
  const [configForm, setConfigForm] = useState({
    exam_name: '',
    exam_description: '',
    duration_minutes: 10,
    total_questions: 4,
    passing_score: 50,
    instructions: '',
    is_active: true,
  })

  const [questionForm, setQuestionForm] = useState({
    question_text: '',
    question_type: 'multiple_choice' as string,
    options: ['', '', '', ''],
    correct_answer: '',
    points: 1,
    question_order: 1,
    is_active: true,
  })

  useEffect(() => {
    loadConfigs()
  }, [])

  useEffect(() => {
    if (selectedConfig) {
      loadQuestions(selectedConfig.id)
    }
  }, [selectedConfig])

  const loadConfigs = async () => {
    try {
      const res = await fetch('/api/v1/admin/exams/config')
      if (!res.ok) throw new Error('Failed to load exam configs')
      const data = await res.json()
      setConfigs(data.data || [])
      if (data.data?.length > 0 && !selectedConfig) {
        setSelectedConfig(data.data[0])
      }
    } catch (error) {
      toast.error('Failed to load exam configurations')
      console.error(error)
    }
  }

  const loadQuestions = async (configId: string) => {
    try {
      const res = await fetch(`/api/v1/admin/exams/questions?configId=${configId}`)
      if (!res.ok) throw new Error('Failed to load questions')
      const data = await res.json()
      setQuestions(data.data || [])
    } catch (error) {
      toast.error('Failed to load questions')
      console.error(error)
    }
  }

  const saveConfig = async () => {
    try {
      const method = isCreating ? 'POST' : 'PUT'
      const url = isCreating ? '/api/v1/admin/exams/config' : `/api/v1/admin/exams/config/${selectedConfig?.id}`
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configForm),
      })

      if (!res.ok) throw new Error('Failed to save config')
      
      toast.success(isCreating ? 'Exam configuration created' : 'Exam configuration updated')
      setIsCreating(false)
      setIsEditing(false)
      loadConfigs()
    } catch (error) {
      toast.error('Failed to save configuration')
      console.error(error)
    }
  }

  const deleteConfig = async (id: string) => {
    if (!confirm('Are you sure? This will also delete all questions for this exam.')) return
    
    try {
      const res = await fetch(`/api/v1/admin/exams/config/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete config')
      
      toast.success('Exam configuration deleted')
      setSelectedConfig(null)
      loadConfigs()
    } catch (error) {
      toast.error('Failed to delete configuration')
      console.error(error)
    }
  }

  const saveQuestion = async () => {
    try {
      const method = editingQuestion ? 'PUT' : 'POST'
      const url = editingQuestion 
        ? `/api/v1/admin/exams/questions/${editingQuestion.id}` 
        : '/api/v1/admin/exams/questions'
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...questionForm,
          exam_config_id: selectedConfig?.id,
        }),
      })

      if (!res.ok) throw new Error('Failed to save question')
      
      toast.success(editingQuestion ? 'Question updated' : 'Question created')
      setEditingQuestion(null)
      setIsCreatingQuestion(false)
      loadQuestions(selectedConfig!.id)
    } catch (error) {
      toast.error('Failed to save question')
      console.error(error)
    }
  }

  const deleteQuestion = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return
    
    try {
      const res = await fetch(`/api/v1/admin/exams/questions/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete question')
      
      toast.success('Question deleted')
      loadQuestions(selectedConfig!.id)
    } catch (error) {
      toast.error('Failed to delete question')
      console.error(error)
    }
  }

  const startEditConfig = () => {
    if (!selectedConfig) return
    setConfigForm({
      exam_name: selectedConfig.exam_name,
      exam_description: selectedConfig.exam_description,
      duration_minutes: selectedConfig.duration_minutes,
      total_questions: selectedConfig.total_questions,
      passing_score: selectedConfig.passing_score,
      instructions: selectedConfig.instructions || '',
      is_active: selectedConfig.is_active,
    })
    setIsEditing(true)
    setIsCreating(false)
  }

  const startCreateConfig = () => {
    setConfigForm({
      exam_name: '',
      exam_description: '',
      duration_minutes: 10,
      total_questions: 4,
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
      points: 1,
      question_order: questions.length + 1,
      is_active: true,
    })
    setIsCreatingQuestion(true)
    setEditingQuestion(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Entrance Exam Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">Configure entrance examinations and manage questions</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Exam Configurations List */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Exam Configurations</h2>
            <Button onClick={startCreateConfig} size="sm" className="rounded-xl">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            {configs.map((config) => (
              <div
                key={config.id}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                  selectedConfig?.id === config.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setSelectedConfig(config)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold">{config.exam_name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {config.duration_minutes} min • {config.total_questions} questions • {config.passing_score}% pass
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        config.is_active 
                          ? 'bg-emerald-500/10 text-emerald-600' 
                          : 'bg-gray-500/10 text-gray-600'
                      }`}>
                        {config.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        startEditConfig()
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteConfig(config.id)
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

        {/* Configuration Editor */}
        <Card className="p-6 lg:col-span-2">
          {(isEditing || isCreating) ? (
            <div className="space-y-4">
              <h3 className="text-xl font-bold">{isCreating ? 'Create New Exam' : 'Edit Exam Configuration'}</h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="exam_name">Exam Name</Label>
                  <Input
                    id="exam_name"
                    value={configForm.exam_name}
                    onChange={(e) => setConfigForm({ ...configForm, exam_name: e.target.value })}
                    className="rounded-xl"
                  />
                </div>

                <div>
                  <Label htmlFor="exam_description">Description</Label>
                  <Textarea
                    id="exam_description"
                    value={configForm.exam_description}
                    onChange={(e) => setConfigForm({ ...configForm, exam_description: e.target.value })}
                    className="rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="duration_minutes">Duration (minutes)</Label>
                    <Input
                      id="duration_minutes"
                      type="number"
                      value={configForm.duration_minutes}
                      onChange={(e) => setConfigForm({ ...configForm, duration_minutes: parseInt(e.target.value) })}
                      className="rounded-xl"
                    />
                  </div>

                  <div>
                    <Label htmlFor="total_questions">Total Questions</Label>
                    <Input
                      id="total_questions"
                      type="number"
                      value={configForm.total_questions}
                      onChange={(e) => setConfigForm({ ...configForm, total_questions: parseInt(e.target.value) })}
                      className="rounded-xl"
                    />
                  </div>

                  <div>
                    <Label htmlFor="passing_score">Passing Score (%)</Label>
                    <Input
                      id="passing_score"
                      type="number"
                      value={configForm.passing_score}
                      onChange={(e) => setConfigForm({ ...configForm, passing_score: parseInt(e.target.value) })}
                      className="rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="instructions">Instructions</Label>
                  <Textarea
                    id="instructions"
                    value={configForm.instructions}
                    onChange={(e) => setConfigForm({ ...configForm, instructions: e.target.value })}
                    className="rounded-xl"
                    rows={4}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    id="is_active"
                    checked={configForm.is_active}
                    onCheckedChange={(checked) => setConfigForm({ ...configForm, is_active: checked })}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>

                <div className="flex gap-3">
                  <Button onClick={saveConfig} className="flex-1 rounded-xl">
                    <Save className="mr-2 h-4 w-4" />
                    Save Configuration
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
          ) : selectedConfig ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">{selectedConfig.exam_name}</h3>
                <Button onClick={startEditConfig} variant="outline" size="sm" className="rounded-xl">
                  <Edit2 className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-xs text-muted-foreground">Duration</p>
                  <p className="text-lg font-bold">{selectedConfig.duration_minutes} minutes</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-xs text-muted-foreground">Questions</p>
                  <p className="text-lg font-bold">{selectedConfig.total_questions}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-xs text-muted-foreground">Passing Score</p>
                  <p className="text-lg font-bold">{selectedConfig.passing_score}%</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className="text-lg font-bold">{selectedConfig.is_active ? 'Active' : 'Inactive'}</p>
                </div>
              </div>

              {selectedConfig.instructions && (
                <div className="p-4 rounded-xl border border-border">
                  <p className="text-sm font-semibold mb-2">Instructions:</p>
                  <p className="text-sm text-muted-foreground">{selectedConfig.instructions}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              Select or create an exam configuration to manage questions
            </div>
          )}
        </Card>
      </div>

      {/* Questions Management */}
      {selectedConfig && (
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
    </div>
  )
}