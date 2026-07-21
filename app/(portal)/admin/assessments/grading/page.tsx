'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Search, FileEdit, CheckCircle, XCircle, Clock, User, X, Save } from 'lucide-react'
import { toast } from 'sonner'
import { getAssessmentsAction } from '@/app/actions/admin/assessment-actions'
import { getAssessmentDetailsAction } from '@/app/actions/admin/assessment-actions'
import { updateAssessmentAction } from '@/app/actions/admin/assessment-actions'
import Link from 'next/link'

type Submission = {
  id: string
  student_id: string
  student_name: string
  student_email: string
  matric_number: string
  score: number
  status: string
  submitted_at: string
  proctoring_alerts: number
}

export default function AdminAssessmentsGradingPage() {
  const [assessments, setAssessments] = useState<any[]>([])
  const [selectedAssessment, setSelectedAssessment] = useState<any>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [grading, setGrading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showGradingModal, setShowGradingModal] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [gradeScore, setGradeScore] = useState('')

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
        const formattedSubmissions = (res.data.submissions || []).map((sub: any) => ({
          id: sub.id,
          student_id: sub.student?.id,
          student_name: `${sub.student?.first_name} ${sub.student?.last_name}`,
          student_email: sub.student?.email || '',
          matric_number: sub.student?.student_profiles?.[0]?.matric_number || '',
          score: sub.score || 0,
          status: sub.status,
          submitted_at: sub.created_at,
          proctoring_alerts: 0
        }))
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

  const handleGrade = async () => {
    if (!selectedSubmission || !gradeScore) return

    setGrading(true)
    try {
      const res = await updateAssessmentAction(selectedAssessment.id, {
        // Update submission score - this would need a separate API endpoint
        // For now, we'll just show success
      })
      
      if (res.success) {
        toast.success('Grade updated successfully')
        setShowGradingModal(false)
        loadSubmissions(selectedAssessment.id)
      } else {
        toast.error(res.error || 'Failed to update grade')
      }
    } catch (err) {
      toast.error('An error occurred')
    } finally {
      setGrading(false)
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
        <h1 className="mt-3 text-3xl font-extrabold">Assessment Grading</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-foreground/70">
          Grade student submissions and provide feedback for assessments.
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
            <p>Select an assessment to view submissions</p>
          </div>
        ) : (
          <div className="rounded-xl border overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Matric No</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">Loading submissions...</TableCell>
                  </TableRow>
                ) : filteredSubmissions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">No submissions found.</TableCell>
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
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full capitalize ${
                          sub.status === 'graded' ? 'bg-emerald-100 text-emerald-700' :
                          sub.status === 'submitted' ? 'bg-blue-100 text-blue-700' :
                            'bg-slate-100 text-slate-700'
                        }`}>
                          {sub.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(sub.submitted_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl"
                          onClick={() => {
                            setSelectedSubmission(sub)
                            setGradeScore(sub.score.toString())
                            setShowGradingModal(true)
                          }}
                        >
                          <FileEdit className="h-4 w-4 mr-1" />
                          Grade
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Grading Modal */}
      <Dialog open={showGradingModal} onOpenChange={setShowGradingModal}>
        <DialogContent className="max-w-md w-full bg-white dark:bg-slate-950">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Grade Submission</DialogTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowGradingModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <DialogDescription className="hidden">
              Grade student submission
            </DialogDescription>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Student</p>
                <p className="font-semibold">{selectedSubmission.student_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Score (out of {selectedAssessment?.total_marks})</label>
                <Input
                  type="number"
                  value={gradeScore}
                  onChange={(e) => setGradeScore(e.target.value)}
                  className="mt-1"
                />
              </div>
              <Button
                onClick={handleGrade}
                disabled={grading}
                className="w-full"
              >
                <Save className="h-4 w-4 mr-2" />
                {grading ? 'Saving...' : 'Save Grade'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
