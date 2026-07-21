'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { GraduationCap, Search, Filter, Download, Eye, TrendingUp, Award, Clock, CheckCircle, XCircle, AlertCircle, Video, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { ExamService } from '@/lib/services/exam.service'

type ExamResult = {
  id: string
  aspirant_id: string
  aspirant_name?: string
  aspirant_email?: string
  exam_type: string
  score: number
  total_questions: number
  percentage: number
  grade: string
  status: string
  submitted_at: string
  started_at?: string
  completed_at?: string
  recording?: {
    id: string
    recording_url?: string
    created_at: string
  } | null
  answers?: Array<{
    questionId: string
    question: string
    answer: string
    correctAnswer?: string
    isCorrect?: boolean
  }> | null
}

export default function AdminScreeningResultsPage() {
  const [results, setResults] = useState<ExamResult[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [gradeFilter, setGradeFilter] = useState('all')
  const [selectedResult, setSelectedResult] = useState<ExamResult | null>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    loadResults()
  }, [])

  const loadResults = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/v1/admin/screening/results')
      const data = await response.json()
      
      if (!response.ok) throw new Error(data.error || 'Failed to load results')
      
      setResults(data.results || [])
    } catch (error) {
      console.error('Failed to load exam results:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewResult = (result: ExamResult) => {
    setSelectedResult(result)
    setShowModal(true)
  }

  const getGradeColor = (grade: string) => {
    const colors: Record<string, string> = {
      'A': 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
      'B': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      'C': 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
      'D': 'bg-orange-500/10 text-orange-600 border-orange-500/20',
      'E': 'bg-red-500/10 text-red-600 border-red-500/20',
      'F': 'bg-red-500/10 text-red-600 border-red-500/20',
    }
    return colors[grade] || 'bg-gray-500/10 text-gray-600 border-gray-500/20'
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'submitted': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      'reviewed': 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
      'graded': 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    }
    return colors[status] || 'bg-gray-500/10 text-gray-600 border-gray-500/20'
  }

  const filteredResults = results.filter(result => {
    const matchesSearch = 
      `${result.aspirant_name || ''} ${result.aspirant_email || ''} ${result.id}`.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || result.status === statusFilter
    const matchesGrade = gradeFilter === 'all' || result.grade === gradeFilter
    return matchesSearch && matchesStatus && matchesGrade
  })

  const stats = {
    total: results.length,
    average: results.length > 0 ? Math.round(results.reduce((sum, r) => sum + r.percentage, 0) / results.length) : 0,
    passed: results.filter(r => r.percentage >= 50).length,
    failed: results.filter(r => r.percentage < 50).length,
    aGrades: results.filter(r => r.grade === 'A').length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Screening Exam Results</h1>
          <p className="mt-1 text-sm text-muted-foreground">View and manage entrance examination results</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export Results
          </Button>
          <Button className="gap-2" onClick={loadResults}>
            <GraduationCap className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Exams</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <GraduationCap className="h-8 w-8 text-blue-600" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Average Score</p>
              <p className="text-2xl font-bold">{stats.average}%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-emerald-600" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Passed</p>
              <p className="text-2xl font-bold">{stats.passed}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-emerald-600" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Failed</p>
              <p className="text-2xl font-bold">{stats.failed}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">A Grades</p>
              <p className="text-2xl font-bold">{stats.aGrades}</p>
            </div>
            <Award className="h-8 w-8 text-purple-600" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by aspirant name, email, or result ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="reviewed">Reviewed</SelectItem>
              <SelectItem value="graded">Graded</SelectItem>
            </SelectContent>
          </Select>
          <Select value={gradeFilter} onValueChange={setGradeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by grade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Grades</SelectItem>
              <SelectItem value="A">A</SelectItem>
              <SelectItem value="B">B</SelectItem>
              <SelectItem value="C">C</SelectItem>
              <SelectItem value="D">D</SelectItem>
              <SelectItem value="E">E</SelectItem>
              <SelectItem value="F">F</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Loading exam results...</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredResults.length === 0 && (
        <Card className="p-12 text-center">
          <GraduationCap className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-semibold">No exam results found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {searchTerm || statusFilter !== 'all' || gradeFilter !== 'all' 
              ? 'Try adjusting your search or filters' 
              : 'No exam results have been submitted yet'}
          </p>
        </Card>
      )}

      {/* Results Table - Desktop/Tablet */}
      {!loading && filteredResults.length > 0 && (
        <Card className="overflow-hidden hidden md:block">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Aspirant</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Score</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Grade</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Submitted</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredResults.map((result) => (
                  <tr key={result.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold">{result.aspirant_name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">{result.aspirant_email || 'No email'}</p>
                      </div>
                    </td>
                    <td className=".px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold">{result.percentage}%</span>
                        <span className="text-xs text-muted-foreground">({result.score}/{result.total_questions})</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={getGradeColor(result.grade)}>{result.grade}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={getStatusColor(result.status)}>{result.status}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {new Date(result.submitted_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {result.recording?.recording_url && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="gap-2"
                            onClick={() => window.open(result.recording?.recording_url, '_blank')}
                          >
                            <Video className="h-4 w-4" />
                            Recording
                          </Button>
                        )}
                        <Button variant="outline" size="sm" className="gap-2" onClick={() => handleViewResult(result)}>
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Results Cards - Mobile */}
      {!loading && filteredResults.length > 0 && (
        <div className="md:hidden space-y-4">
          {filteredResults.map((result) => (
            <Card key={result.id} className="p-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold break-words">{result.aspirant_name || 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground break-words">{result.aspirant_email || 'No email'}</p>
                  </div>
                  <Badge className={getGradeColor(result.grade)}>{result.grade}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Score</p>
                    <p className="text-lg font-bold">{result.percentage}%</p>
                    <p className="text-xs text-muted-foreground">({result.score}/{result.total_questions})</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <Badge className={getStatusColor(result.status)}>{result.status}</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {new Date(result.submitted_at).toLocaleDateString()}
                </div>
                <div className="flex gap-2 pt-2">
                  {result.recording?.recording_url && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 gap-2"
                      onClick={() => window.open(result.recording?.recording_url, '_blank')}
                    >
                      <Video className="h-4 w-4" />
                      Recording
                    </Button>
                  )}
                  <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={() => handleViewResult(result)}>
                    <Eye className="h-4 w-4" />
                    View
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Result Details Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-4xl w-full max-h-[85vh] bg-white dark:bg-slate-950 overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0 pb-2">
            <div className="flex items-center justify-between">
              <DialogTitle>Exam Result Details</DialogTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <DialogDescription className="hidden">
              View detailed exam results, answers, and performance metrics for the selected aspirant.
            </DialogDescription>
          </DialogHeader>
          {selectedResult && (
            <div className="flex-1 overflow-y-auto space-y-3 px-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Aspirant Name</p>
                  <p className="font-semibold break-words text-sm">{selectedResult.aspirant_name || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-semibold break-words text-xs">{selectedResult.aspirant_email || 'N/A'}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Exam Type</p>
                  <p className="font-semibold break-words text-sm">{selectedResult.exam_type}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge className={getStatusColor(selectedResult.status)}>{selectedResult.status}</Badge>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Score</p>
                  <p className="text-xl font-bold">{selectedResult.percentage}%</p>
                  <p className="text-xs text-muted-foreground">({selectedResult.score}/{selectedResult.total_questions})</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Grade</p>
                  <Badge className={`${getGradeColor(selectedResult.grade)} text-base px-3 py-1`}>{selectedResult.grade}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Submitted</p>
                  <p className="text-xs">{new Date(selectedResult.submitted_at).toLocaleString()}</p>
                </div>
              </div>
              {selectedResult.started_at && (
                <div>
                  <p className="text-xs text-muted-foreground">Exam Duration</p>
                  <p className="text-xs">
                    {selectedResult.completed_at 
                      ? `${Math.round((new Date(selectedResult.completed_at).getTime() - new Date(selectedResult.started_at).getTime()) / 60000)} minutes`
                      : 'In progress'}
                  </p>
                </div>
              )}
              
              {selectedResult.answers && selectedResult.answers.length > 0 && (
                <div className="pt-3 border-t">
                  <h3 className="text-base font-semibold mb-3">Answers</h3>
                  <div className="space-y-2">
                    {selectedResult.answers.map((item, index) => (
                      <div key={item.questionId} className="rounded-lg border bg-slate-50 dark:bg-slate-900 p-3">
                        <div className="flex items-start gap-2">
                          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium mb-1 break-words">{item.question}</p>
                            <div className="space-y-0.5">
                              <p className="text-xs text-muted-foreground">
                                Answer: <span className={`font-medium ${item.isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{item.answer}</span>
                                {item.isCorrect !== undefined && (
                                  item.isCorrect ? (
                                    <CheckCircle className="inline-block ml-1 h-3 w-3 text-green-600 dark:text-green-400" />
                                  ) : (
                                    <XCircle className="inline-block ml-1 h-3 w-3 text-red-600 dark:text-red-400" />
                                  )
                                )}
                              </p>
                              {item.correctAnswer && (
                                <p className="text-xs text-muted-foreground">
                                  Correct: <span className="font-medium">{item.correctAnswer}</span>
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedResult.recording?.recording_url && (
                <div className="pt-3 border-t">
                  <Button 
                    variant="outline" 
                    className="w-full gap-2"
                    onClick={() => window.open(selectedResult.recording?.recording_url, '_blank')}
                  >
                    <Video className="h-4 w-4" />
                    View Exam Recording
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
