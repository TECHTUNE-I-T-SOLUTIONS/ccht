'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ArrowLeft, Save, FileEdit, ShieldAlert, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { getAssessmentDetailsAction, updateAssessmentAction } from '@/app/actions/admin/assessment-actions'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Switch } from '@/components/ui/switch'

export default function AdminAssessmentDetailPage() {
  const { id } = useParams()
  const [assessment, setAssessment] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [formData, setFormData] = useState({
    title: '',
    type: 'exam',
    totalMarks: 100,
    passingMarks: 50,
    isPublished: false,
    proctoringEnabled: false,
    proctoringStrictness: 'medium'
  })

  useEffect(() => {
    if (id) loadData()
  }, [id])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await getAssessmentDetailsAction(id as string)
      if (res.success && res.data) {
        setAssessment(res.data)
        const d = res.data
        setFormData({
          title: d.title,
          type: d.type,
          totalMarks: d.total_marks,
          passingMarks: d.passing_marks,
          isPublished: d.is_published,
          proctoringEnabled: d.proctoring_enabled,
          proctoringStrictness: d.proctoring_strictness
        })
      } else {
        toast.error('Failed to load assessment details')
      }
    } catch (err) {
      toast.error('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const res = await updateAssessmentAction(id as string, formData)
      if (res.success) {
        toast.success('Assessment updated successfully')
        loadData()
      } else {
        toast.error(res.error || 'Failed to update')
      }
    } catch (err) {
      toast.error('An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) return <div className="flex h-[50vh] items-center justify-center">Loading assessment...</div>
  if (!assessment) return <div className="flex h-[50vh] flex-col items-center justify-center gap-4"><p>Assessment not found.</p><Button asChild><Link href="/admin/assessments">Back</Link></Button></div>

  return (
    <div className="space-y-8">
      <div className="rounded-[2.5rem] border border-border bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.12),transparent_30%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--accent-soft)))] p-8 md:p-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
          <Button variant="ghost" size="icon" className="rounded-full bg-white/50 dark:bg-slate-900/50" asChild>
            <Link href="/admin/assessments"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileEdit className="h-8 w-8" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">{assessment.course?.title} ({assessment.course?.code})</p>
              <h1 className="mt-1 text-3xl font-extrabold md:text-4xl">{assessment.title}</h1>
              <p className="mt-1 text-sm text-foreground/75 capitalize">{assessment.type} • Session: {assessment.session?.name}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Assessment Settings */}
        <Card className="rounded-[2rem] border bg-white dark:bg-slate-900 shadow-sm p-6 lg:col-span-1 h-fit">
          <h2 className="text-xl font-bold mb-6">Settings</h2>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Assessment Title</label>
              <Input required value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Type</label>
                <Select value={formData.type} onValueChange={(val) => setFormData({...formData, type: val})}>
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
                <Input type="number" required value={formData.totalMarks} onChange={(e) => setFormData({...formData, totalMarks: parseInt(e.target.value) || 0})} />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border bg-slate-50 dark:bg-slate-800/50">
              <span className="text-sm font-medium">Published</span>
              <Switch checked={formData.isPublished} onCheckedChange={(val) => setFormData({...formData, isPublished: val})} />
            </div>

            <div className="space-y-4 mt-6 p-4 border rounded-xl bg-orange-50/50 dark:bg-orange-950/10 border-orange-100 dark:border-orange-900/30">
              <h3 className="font-bold flex items-center text-orange-700 dark:text-orange-400">
                <ShieldAlert className="mr-2 h-4 w-4" /> AI Proctoring
              </h3>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Enable Proctoring</span>
                <Switch checked={formData.proctoringEnabled} onCheckedChange={(val) => setFormData({...formData, proctoringEnabled: val})} />
              </div>
              {formData.proctoringEnabled && (
                <div className="space-y-2 pt-2">
                  <label className="text-sm font-medium">Strictness Level</label>
                  <Select value={formData.proctoringStrictness} onValueChange={(val) => setFormData({...formData, proctoringStrictness: val})}>
                    <SelectTrigger className="bg-white dark:bg-slate-900"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low (Warn only)</SelectItem>
                      <SelectItem value="medium">Medium (Flag violations)</SelectItem>
                      <SelectItem value="high">High (Auto-submit on violation)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            
            <div className="pt-4">
              <Button type="submit" disabled={isSubmitting} className="w-full rounded-xl"><Save className="mr-2 h-4 w-4" /> Save Changes</Button>
            </div>
          </form>
        </Card>

        {/* Submissions & Logs */}
        <Card className="rounded-[2rem] border bg-white dark:bg-slate-900 shadow-sm p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Submissions & Logs</h2>
          </div>

          <div className="rounded-xl border overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Proctoring Alerts</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assessment.submissions?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">No submissions yet.</TableCell>
                  </TableRow>
                ) : (
                  assessment.submissions?.map((sub: any) => (
                    <TableRow key={sub.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <img src={sub.student?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + sub.student?.first_name} className="h-8 w-8 rounded-full border bg-slate-50" />
                          <div>
                            <div>{sub.student?.first_name} {sub.student?.last_name}</div>
                            <div className="text-xs text-muted-foreground">{sub.student?.student_profiles?.[0]?.matric_number}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-bold">{sub.score}</span> <span className="text-muted-foreground text-xs">/ {assessment.total_marks}</span>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full capitalize ${
                          sub.status === 'graded' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {sub.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        {assessment.proctoring_enabled ? (
                          sub.status === 'flagged' ? (
                            <span className="flex items-center text-red-600 text-xs font-semibold">
                              <AlertTriangle className="mr-1 h-3 w-3" /> Flagged
                            </span>
                          ) : (
                            <span className="text-emerald-600 text-xs font-semibold">Clear</span>
                          )
                        ) : (
                          <span className="text-muted-foreground text-xs">N/A</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  )
}
