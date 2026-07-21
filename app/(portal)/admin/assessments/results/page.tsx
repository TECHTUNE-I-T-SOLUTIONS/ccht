'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Search, FileEdit, CheckCircle, XCircle, Clock, User, X, Download, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { getAssessmentsAction } from '@/app/actions/admin/assessment-actions'
import { getAssessmentDetailsAction } from '@/app/actions/admin/assessment-actions'
import Link from 'next/link'

type Submission = {
  id: string
  student_id: string
  student_name: string
  student_email: string
  matric_number: string
  score: number
  percentage: number
  grade: string
  status: string
  submitted_at: string
  proctoring_alerts: number
}

export default function AdminAssessmentsResultsPage() {
  const [assessments, setAssessments] = useState<any[]>([])
  const [selectedAssessment, setSelectedAssessment] = useState<any>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showResultModal, setShowResultModal] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)

  useEffect(() => {
    loadAssessments()
  }, [])

  const loadAssessments = async () => {
    setLoading(true)
    try {
      const res = await getAssessmentsAction()
      if (res.success) {
        setAssessments(res.data || [])
      } else {
        toast.error('Failed to load assessments')
      }
    } catch (err) {
      toast.error('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const loadSubmissions = async (assessmentId: string) => {
    setLoading(true)
    try {
      const res = await getAssessmentDetailsAction(assessmentId)
      if (res.success && res.data) {
        setSelectedAssessment(res.data)
        const formattedSubmissions = (res.data.submissions || []).map((sub: any) => {
          const percentage = res.data.total_marks > 0 ? (sub.score / res.data.total_marks) * 100 : 0
          let grade = 'F'
          if (percentage >= 70) grade = 'A'
          else if (percentage >= 60) grade = 'B'
          else if (percentage >= 50) grade = 'C'
          else if (percentage >= 45) grade = 'D'
          else if (percentage >= 40) grade = 'E'

          return {
            id: sub.id,
            student_id: sub.student?.id,
            student_name: `${sub.student?.first_name} ${sub.student?.last_name}`,
            student_email: sub.student?.email || '',
            matric_number: sub.student?.student_profiles?.[0]?.matric_number || '',
            score: sub.score || 0,
            percentage,
            grade,
            status: sub.status,
            submitted_at: sub.created_at,
            proctoring_alerts: 0
          }
        })
        setSubmissions(formattedSubmissions)
      } else {
        toast.error('Failed to load submissions')
      }
    } catch (err) {
      toast.error('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'bg-emerald-100 text-emerald-700'
      case 'B': return 'bg-blue-100 text-blue-700'
      case 'C': return 'bg-green-100 text-green-700'
      case 'D': return 'bg-yellow-100 text-yellow-700'
      case 'E': return 'bg-orange-100 text-orange-700'
      default: return 'bg-red-100 text-red-700'
    }
  }

  const filteredSubmissions = submissions.filter(sub =>
    sub.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sub.matric_number.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="rounded-[2.5rem] border border-border bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.12),transparent_30%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--accent-soft)))] p-6 md:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Admin</p>
        <h1 className="mt-3 text-3xl font-extrabold">Assessment Results</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-foreground/70">
          View and analyze student assessment results and performance.
        </p>
      </div>

      <Card className="rounded-[2rem] border bg-white p-6 shadow-sm dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 rounded-xl bg-slate-50 dark:bg-slate-800 border-none"
            />
          </div>
          <Select value={selectedAssessment?.id || ''} onValueChange={loadSubmissions}>
            <SelectTrigger className="w-[300px] rounded-xl bg-slate-50 dark:bg-slate-800 border-none">
              <SelectValue placeholder="Select Assessment" />
            </SelectTrigger>
            <SelectContent>
              {assessments.map(a => (
                <SelectItem key={a.id} value={a.id}>
                  {a.title} ({a.course?.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {!selectedAssessment ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileEdit className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Select an assessment to view results</p>
          </div>
        ) : (
          <div className="rounded-xl border overflow-hidden hidden md:block">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Matric No</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Percentage</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">Loading results...</TableCell>
                  </TableRow>
                ) : filteredSubmissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">No results found.</TableCell>
                  </TableRow>
                ) : (
                  filteredSubmissions.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <User className="h-4 w-4" />
                          </div>
                          <div>
                            <div>{sub.student_name}</div>
                            <div className="text-xs text-muted-foreground">{sub.student_email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{sub.matric_number || 'N/A'}</TableCell>
                      <TableCell>
                        <span className="font-bold">{sub.score}</span> <span className="text-muted-foreground text-xs">/ {selectedAssessment.total_marks}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-bold">{sub.percentage.toFixed(1)}%</span>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2.5 py-1 text-xs font-bold rounded ${getGradeColor(sub.grade)}`}>
                          {sub.grade}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full capitalize ${
                          sub.status === 'graded' ? 'bg-emerald-100 text-emerald-700' :
                          sub.status === 'submitted' ? 'bg-blue-100 text-blue-700' :
                            'bg-slate-100 text-slate-700'
                        }`}>
                          {sub.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl"
                          onClick={() => {
                            setSelectedSubmission(sub)
                            setShowResultModal(true)
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Mobile Cards */}
        {!selectedAssessment ? null : (
          <div className="md:hidden space-y-4">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading results...</div>
            ) : filteredSubmissions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No results found.</div>
            ) : (
              filteredSubmissions.map((sub) => (
                <Card key={sub.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
                        <User className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold break-words">{sub.student_name}</p>
                        <p className="text-xs text-muted-foreground break-words">{sub.student_email}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Matric No</p>
                        <p className="text-sm font-medium">{sub.matric_number || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Score</p>
                        <p className="text-sm font-bold">{sub.score}/{selectedAssessment.total_marks}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Percentage</p>
                        <p className="text-sm font-bold">{sub.percentage.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Grade</p>
                        <span className={`px-2 py-1 text-xs font-bold rounded ${getGradeColor(sub.grade)}`}>
                          {sub.grade}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Status</p>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${
                        sub.status === 'graded' ? 'bg-emerald-100 text-emerald-700' :
                        sub.status === 'submitted' ? 'bg-blue-100 text-blue-700' :
                          'bg-slate-100 text-slate-700'
                      }`}>
                        {sub.status}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full rounded-xl"
                      onClick={() => {
                        setSelectedSubmission(sub)
                        setShowResultModal(true)
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </Card>

      {/* Result Details Modal */}
      <Dialog open={showResultModal} onOpenChange={setShowResultModal}>
        <DialogContent className="max-w-md w-full max-h-[85vh] bg-white dark:bg-slate-950 overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0 pb-2">
            <div className="flex items-center justify-between">
              <DialogTitle>Result Details</DialogTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowResultModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <DialogDescription className="hidden">
              View detailed result information
            </DialogDescription>
          </DialogHeader>
          {selectedSubmission && (
            <div className="flex-1 overflow-y-auto space-y-3 px-1">
              <div>
                <p className="text-xs text-muted-foreground">Student</p>
                <p className="font-semibold break-words">{selectedSubmission.student_name}</p>
                <p className="text-sm text-muted-foreground break-words">{selectedSubmission.student_email}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Matric Number</p>
                  <p className="text-sm">{selectedSubmission.matric_number || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Score</p>
                  <p className="text-xl font-bold">{selectedSubmission.score}/{selectedAssessment?.total_marks}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Percentage</p>
                  <p className="text-2xl font-bold text-primary">{selectedSubmission.percentage.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Grade</p>
                  <span className={`px-3 py-1 text-lg font-bold rounded ${getGradeColor(selectedSubmission.grade)}`}>
                    {selectedSubmission.grade}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <span className={`px-2.5 py-1 text-sm font-semibold rounded-full capitalize ${
                  selectedSubmission.status === 'graded' ? 'bg-emerald-100 text-emerald-700' :
                  selectedSubmission.status === 'submitted' ? 'bg-blue-100 text-blue-700' :
                    'bg-slate-100 text-slate-700'
                }`}>
                  {selectedSubmission.status}
                </span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Submitted At</p>
                <p className="text-sm">{new Date(selectedSubmission.submitted_at).toLocaleString()}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
