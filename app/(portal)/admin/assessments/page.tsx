'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Search, FileEdit, Plus, Eye, Trash2, Edit, MoreVertical, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'
import { getAssessmentsAction, createAssessmentAction, deleteAssessmentAction, getAllCoursesAction } from '@/app/actions/admin/assessment-actions'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import Link from 'next/link'
import { Switch } from '@/components/ui/switch'
import { set } from 'zod'

export default function AdminAssessmentsPage() {
  const [assessments, setAssessments] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    courseId: '',
    type: 'exam',
    totalMarks: 100,
    passingMarks: 50,
    isPublished: false,
    proctoringEnabled: false,
    proctoringStrictness: 'medium'
  })

  useEffect(() => {
    loadData()
  }, [typeFilter])

  const loadData = async () => {
    setLoading(true)
    try {
      const [assmRes, coursesRes] = await Promise.all([
        getAssessmentsAction(typeFilter),
        getAllCoursesAction()
      ])

      if (assmRes.success) setAssessments(assmRes.data || [])
      else toast.error('Failed to load assessments')

      if (coursesRes.success) setCourses(coursesRes.data || [])
    } catch (err) {
      toast.error('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAssessment = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const res = await createAssessmentAction(formData)
      if (res.success) {
        toast.success('Assessment created successfully')
        setIsCreateModalOpen(false)
        loadData()
        setFormData({ title: '', courseId: '', type: 'exam', totalMarks: 100, passingMarks: 50, isPublished: false, proctoringEnabled: false, proctoringStrictness: 'medium' })
      } else {
        toast.error(res.error || 'Failed to create assessment')
      }
    } catch (err) {
      toast.error('An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this assessment?')) return
    const res = await deleteAssessmentAction(id)
    if (res.success) {
      toast.success('Assessment deleted')
      loadData()
    } else {
      toast.error(res.error || 'Failed to delete assessment')
    }
  }

  const filtered = assessments.filter(a =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.course?.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-8">
      <div className="rounded-[2.5rem] border border-border bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.12),transparent_30%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--accent-soft)))] p-8 md:p-10">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div>
            <h1 className="mt-2 text-3xl font-extrabold md:text-5xl">Exams & Assessments</h1>
            <p className="mt-2 text-sm text-foreground/75">Manage CBT exams, assignments, and view AI proctoring logs.</p>
          </div>

          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl px-6"><Plus className="mr-2 h-4 w-4" /> Add Assessment</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create Assessment</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateAssessment} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Title</label>
                  <Input required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Mid-Term Examination" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Course</label>
                  <Select value={formData.courseId} onValueChange={(val) => setFormData({ ...formData, courseId: val })}>
                    <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                    <SelectContent>
                      {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.code} - {c.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Type</label>
                    <Select value={formData.type} onValueChange={(val) => setFormData({ ...formData, type: val })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="exam">Exam</SelectItem>
                        <SelectItem value="test">Test</SelectItem>
                        <SelectItem value="assignment">Assignment</SelectItem>
                        <SelectItem value="quiz">Quiz</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Total Marks</label>
                    <Input type="number" required value={formData.totalMarks} onChange={(e) => setFormData({ ...formData, totalMarks: parseInt(e.target.value) || 0 })} />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border bg-slate-50 dark:bg-slate-800/50">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium">Enable AI Proctoring</span>
                    <span className="text-xs text-muted-foreground">Monitors student via webcam during test.</span>
                  </div>
                  <Switch checked={formData.proctoringEnabled} onCheckedChange={(val) => setFormData({ ...formData, proctoringEnabled: val })} />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border bg-slate-50 dark:bg-slate-800/50">
                  <span className="text-sm font-medium">Publish Immediately</span>
                  <Switch checked={formData.isPublished} onCheckedChange={(val) => setFormData({ ...formData, isPublished: val })} />
                </div>

                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Create Assessment'}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

        </div>
      </div>

      <Card className="rounded-[2rem] border bg-white dark:bg-slate-900 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search assessments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 rounded-xl bg-slate-50 dark:bg-slate-800 border-none"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px] rounded-xl bg-slate-50 dark:bg-slate-800 border-none">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="exam">Exams</SelectItem>
              <SelectItem value="test">Tests</SelectItem>
              <SelectItem value="assignment">Assignments</SelectItem>
              <SelectItem value="quiz">Quizzes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-xl border overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
              <TableRow>
                <TableHead>Assessment Title</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Proctoring</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">Loading assessments...</TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">No assessments found.</TableCell>
                </TableRow>
              ) : (
                filtered.map((assm) => (
                  <TableRow key={assm.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <FileEdit className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-semibold">{assm.title}</div>
                          <div className="text-xs text-muted-foreground">{assm.total_marks} Marks</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{assm.course?.title} ({assm.course?.code})</TableCell>
                    <TableCell>
                      <span className="capitalize px-2 py-1 text-xs font-semibold rounded bg-slate-100 dark:bg-slate-800">{assm.type}</span>
                    </TableCell>
                    <TableCell>
                      {assm.proctoring_enabled ? (
                        <div className="flex items-center text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                          <ShieldAlert className="mr-1 h-3 w-3" /> Enabled
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Disabled</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {assm.is_published ? (
                        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Published</span>
                      ) : (
                        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400">Draft</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                        <Link href={`/admin/assessments/${assm.id}`}><Eye className="h-4 w-4" /></Link>
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/assessments/${assm.id}`}><Edit className="mr-2 h-4 w-4" /> Edit Assessment</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(assm.id)} className="text-red-600 focus:text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}
