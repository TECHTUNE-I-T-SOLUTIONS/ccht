'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Save, BookOpen, Plus, Trash2, Edit } from 'lucide-react'
import { toast } from 'sonner'
import { getProgramDetailsAction, updateProgramAction, createCourseAction, updateCourseAction, deleteCourseAction } from '@/app/actions/admin/program-actions'
import { getDepartmentsAction } from '@/app/actions/admin/academic-actions'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MoreVertical } from 'lucide-react'

export default function AdminProgramDetailPage() {
  const { id } = useParams()
  const [program, setProgram] = useState<any>(null)
  const [departments, setDepartments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: '', slug: '', description: '', durationMonths: 24, durationUnit: 'months',
    tuitionFee: 0, level: 'diploma', departmentId: '', admissionOpen: true, isActive: true
  })

  // Course Modal
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false)
  const [isCourseSubmitting, setIsCourseSubmitting] = useState(false)
  const [editingCourse, setEditingCourse] = useState<any>(null)
  const [courseFormData, setCourseFormData] = useState({
    code: '', title: '', description: '', creditUnits: 1, level: '100', semester: 1
  })

  useEffect(() => {
    if (id) loadData()
  }, [id])

  const loadData = async () => {
    setLoading(true)
    try {
      const [progRes, deptRes] = await Promise.all([
        getProgramDetailsAction(id as string),
        getDepartmentsAction()
      ])

      if (deptRes.success) set( || [])

      if (progRes.success && progRes.data) {
        set( || [])
        const p = progRes.data
        setFormData({
          title: p.title || '',
          slug: p.slug || '',
          description: p.description || '',
          durationMonths: p.duration_months || 24,
          durationUnit: p.duration_unit || 'months',
          tuitionFee: p.tuition_fee || 0,
          level: p.level || 'diploma',
          departmentId: p.department_id || '',
          admissionOpen: p.admission_open ?? true,
          isActive: p.is_active ?? true
        })
      } else {
        toast.error('Failed to load program details: ' + progRes.error)
      }
    } catch (err) {
      toast.error('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProgram = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const res = await updateProgramAction(id as string, formData)
      if (res.success) {
        toast.success('Program updated successfully')
        loadData()
      } else {
        toast.error(res.error || 'Failed to update program')
      }
    } catch (err) {
      toast.error('An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCourseSubmitting(true)
    try {
      let res;
      if (editingCourse) {
        res = await updateCourseAction(editingCourse.id, id as string, courseFormData)
      } else {
        res = await createCourseAction({ ...courseFormData, programId: id as string })
      }
      if (res.success) {
        toast.success(editingCourse ? 'Course updated' : 'Course created')
        setIsCourseModalOpen(false)
        setEditingCourse(null)
        setCourseFormData({ code: '', title: '', description: '', creditUnits: 1, level: '100', semester: 1 })
        loadData()
      } else {
        toast.error(res.error || 'Failed to save course')
      }
    } catch (err) {
      toast.error('An error occurred')
    } finally {
      setIsCourseSubmitting(false)
    }
  }

  const openCourseEdit = (course: any) => {
    setEditingCourse(course)
    setCourseFormData({
      code: course.code,
      title: course.title,
      description: course.description || '',
      creditUnits: course.credit_units,
      level: course.level || '100',
      semester: course.semester || 1
    })
    setIsCourseModalOpen(true)
  }

  const handleDeleteCourse = async (courseId: string) => {
    if (!window.confirm('Delete this course?')) return
    const res = await deleteCourseAction(courseId, id as string)
    if (res.success) {
      toast.success('Course deleted')
      loadData()
    } else {
      toast.error(res.error || 'Failed to delete course')
    }
  }

  if (loading) return <div className="flex h-[50vh] items-center justify-center">Loading program...</div>
  if (!program) return <div className="flex h-[50vh] flex-col items-center justify-center gap-4"><p>Program not found.</p><Button asChild><Link href="/admin/programs">Back</Link></Button></div>

  return (
    <div className="space-y-8">
      <div className="rounded-[2.5rem] border border-border bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.12),transparent_30%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--accent-soft)))] p-8 md:p-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
          <Button variant="ghost" size="icon" className="rounded-full bg-white/50 dark:bg-slate-900/50" asChild>
            <Link href="/admin/programs"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <BookOpen className="h-8 w-8" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">{program.level} Program</p>
              <h1 className="mt-1 text-3xl font-extrabold md:text-4xl">{program.title}</h1>
              <p className="mt-1 text-sm text-foreground/75">{program.department?.name}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Program Details Form */}
        <Card className="rounded-[2rem] border bg-white dark:bg-slate-900 shadow-sm p-6 lg:col-span-1 h-fit">
          <h2 className="text-xl font-bold mb-6">Program Settings</h2>
          <form onSubmit={handleUpdateProgram} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Program Title</label>
              <Input required value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Slug / Short Code</label>
              <Input required value={formData.slug} onChange={(e) => setFormData({...formData, slug: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Department</label>
              <Select value={formData.departmentId} onValueChange={(val) => setFormData({...formData, departmentId: val})}>
                <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                <SelectContent>
                  {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Level</label>
              <Select value={formData.level} onValueChange={(val) => setFormData({...formData, level: val})}>
                <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="certificate">Certificate</SelectItem>
                  <SelectItem value="diploma">Diploma</SelectItem>
                  <SelectItem value="degree">Degree</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tuition Fee (NGN)</label>
              <Input type="number" min="0" required value={formData.tuitionFee} onChange={(e) => setFormData({...formData, tuitionFee: parseInt(e.target.value) || 0})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Duration</label>
                <Input type="number" min="1" required value={formData.durationMonths} onChange={(e) => setFormData({...formData, durationMonths: parseInt(e.target.value) || 0})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Unit</label>
                <Select value={formData.durationUnit} onValueChange={(val) => setFormData({...formData, durationUnit: val})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="months">Months</SelectItem>
                    <SelectItem value="years">Years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea required value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={4} />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border bg-slate-50 dark:bg-slate-800/50">
              <span className="text-sm font-medium">Admission Open</span>
              <Switch checked={formData.admissionOpen} onCheckedChange={(val) => setFormData({...formData, admissionOpen: val})} />
            </div>
            <div className="pt-2">
              <Button type="submit" disabled={isSubmitting} className="w-full rounded-xl"><Save className="mr-2 h-4 w-4" /> Save Changes</Button>
            </div>
          </form>
        </Card>

        {/* Courses Table */}
        <Card className="rounded-[2rem] border bg-white dark:bg-slate-900 shadow-sm p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Courses</h2>
            <Dialog open={isCourseModalOpen} onOpenChange={(open) => {
              setIsCourseModalOpen(open);
              if (!open) { setEditingCourse(null); setCourseFormData({ code: '', title: '', description: '', creditUnits: 1, level: '100', semester: 1 }); }
            }}>
              <DialogTrigger asChild>
                <Button className="rounded-xl"><Plus className="mr-2 h-4 w-4" /> Add Course</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-white dark:bg-slate-950">
                <DialogHeader>
                  <DialogTitle>{editingCourse ? 'Edit Course' : 'Add Course'}</DialogTitle>
                  <DialogDescription className="hidden">Add or edit a course for this program</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSaveCourse} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Course Code</label>
                    <Input required value={courseFormData.code} onChange={(e) => setCourseFormData({...courseFormData, code: e.target.value})} placeholder="e.g. CSC 101" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Course Title</label>
                    <Input required value={courseFormData.title} onChange={(e) => setCourseFormData({...courseFormData, title: e.target.value})} placeholder="e.g. Introduction to Computing" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Credit Units</label>
                      <Input type="number" min="1" required value={courseFormData.creditUnits} onChange={(e) => setCourseFormData({...courseFormData, creditUnits: parseInt(e.target.value) || 1})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Level</label>
                      <Input value={courseFormData.level} onChange={(e) => setCourseFormData({...courseFormData, level: e.target.value})} placeholder="e.g. 100" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Semester</label>
                    <Select value={courseFormData.semester.toString()} onValueChange={(val) => setCourseFormData({...courseFormData, semester: parseInt(val) || 1})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">First Semester</SelectItem>
                        <SelectItem value="2">Second Semester</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <Textarea value={courseFormData.description} onChange={(e) => setCourseFormData({...courseFormData, description: e.target.value})} rows={2} />
                  </div>
                  <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={isCourseSubmitting}>{isCourseSubmitting ? 'Saving...' : 'Save Course'}</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="rounded-xl border overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Level / Sem</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {program.courses?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">No courses added to this program yet.</TableCell>
                  </TableRow>
                ) : (
                  program.courses?.map((course: any) => (
                    <TableRow key={course.id}>
                      <TableCell className="font-semibold text-primary">{course.code}</TableCell>
                      <TableCell>{course.title}</TableCell>
                      <TableCell>
                        <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">Lvl {course.level} | Sem {course.semester}</span>
                      </TableCell>
                      <TableCell>{course.credit_units}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openCourseEdit(course)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteCourse(course.id)} className="text-red-600 focus:text-red-600">
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
    </div>
  )
}
