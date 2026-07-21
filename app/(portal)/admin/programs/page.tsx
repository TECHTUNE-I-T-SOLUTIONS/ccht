'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, MoreVertical, Edit, Trash2, BookOpen, Search, Eye, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { getProgramsAction, createProgramAction, deleteProgramAction } from '@/app/actions/admin/program-actions'
import { getDepartmentsAction } from '@/app/actions/admin/academic-actions'
import { Textarea } from '@/components/ui/textarea'
import Link from 'next/link'
import { Switch } from '@/components/ui/switch'
import { set } from 'zod'

export default function AdminProgramsPage() {
  const [programs, setPrograms] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [sessions, setSessions] = useState<any[]>([])
  const [semesters, setSemesters] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isSemesterModalOpen, setIsSemesterModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmittingSemester, setIsSubmittingSemester] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    durationMonths: 24,
    durationUnit: 'months',
    tuitionFee: 0,
    level: 'diploma',
    departmentId: '',
    admissionOpen: true,
    isActive: true
  })

  const [semesterFormData, setSemesterFormData] = useState({
    session_id: '',
    semester_name: 'First Semester',
    starts_on: '',
    ends_on: '',
    is_current: false,
    is_active: true
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [progRes, deptRes, sessionRes, semesterRes] = await Promise.all([
        getProgramsAction(),
        getDepartmentsAction(),
        fetch('/api/v1/admin/academic-sessions'),
        fetch('/api/v1/admin/academic-semesters')
      ])

      if (progRes.success) setPrograms(progRes.data || [])
      else toast.error('Failed to load programs: ' + progRes.error)

      if (deptRes.success) setDepartments(deptRes.data || [])
      else toast.error('Failed to load departments')

      const sessionData = await sessionRes.json()
      setSessions(sessionData.data || [])

      const semesterData = await semesterRes.json()
      setSemesters(semesterData.data || [])
    } catch (err) {
      toast.error('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProgram = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const res = await createProgramAction(formData)
      if (res.success) {
        toast.success('Program created successfully')
        setIsCreateModalOpen(false)
        loadData()
        setFormData({
          title: '', slug: '', description: '', durationMonths: 24, durationUnit: 'months',
          tuitionFee: 0, level: 'diploma', departmentId: '', admissionOpen: true, isActive: true
        })
      } else {
        toast.error(res.error || 'Failed to create program')
      }
    } catch (err) {
      toast.error('An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteProgram = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this program? This cannot be undone.')) return
    const res = await deleteProgramAction(id)
    if (res.success) {
      toast.success('Program deleted successfully')
      loadData()
    } else {
      toast.error(res.error || 'Failed to delete program')
    }
  }

  const handleCreateSemester = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmittingSemester(true)
    try {
      const res = await fetch('/api/v1/admin/academic-semesters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(semesterFormData)
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Semester created successfully')
        setIsSemesterModalOpen(false)
        loadData()
        setSemesterFormData({
          session_id: '',
          semester_name: 'First Semester',
          starts_on: '',
          ends_on: '',
          is_current: false,
          is_active: true
        })
      } else {
        toast.error(data.error || 'Failed to create semester')
      }
    } catch (err) {
      toast.error('An error occurred')
    } finally {
      setIsSubmittingSemester(false)
    }
  }

  const filteredPrograms = programs.filter(p =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.slug.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-8">
      <div className="rounded-[2.5rem] border border-border bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.12),transparent_30%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--accent-soft)))] p-8 md:p-10">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div>
            <h1 className="mt-2 text-3xl font-extrabold md:text-5xl">Programs</h1>
            <p className="mt-2 text-sm text-foreground/75">Manage academic programs and their course structures.</p>
          </div>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-xl px-6"><Plus className="mr-2 h-4 w-4" /> Add Program</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px] bg-white dark:bg-slate-950">
                <DialogHeader>
                  <DialogTitle>Create New Program</DialogTitle>
                  <DialogDescription>Create a new academic program with department, level, and duration details.</DialogDescription>
                </DialogHeader>
              <form onSubmit={handleCreateProgram} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Program Title</label>
                    <Input required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Diploma in Computer Science" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Slug / Short Code</label>
                    <Input required value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} placeholder="e.g. D-CSC" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Department</label>
                  <Select value={formData.departmentId} onValueChange={(val) => setFormData({ ...formData, departmentId: val })}>
                    <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                    <SelectContent>
                      {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Level</label>
                    <Select value={formData.level} onValueChange={(val) => setFormData({ ...formData, level: val })}>
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
                    <Input type="number" min="0" required value={formData.tuitionFee} onChange={(e) => setFormData({ ...formData, tuitionFee: parseInt(e.target.value) || 0 })} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Duration</label>
                    <Input type="number" min="1" required value={formData.durationMonths} onChange={(e) => setFormData({ ...formData, durationMonths: parseInt(e.target.value) || 0 })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Duration Unit</label>
                    <Select value={formData.durationUnit} onValueChange={(val) => setFormData({ ...formData, durationUnit: val })}>
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
                  <Textarea required value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border bg-slate-50 dark:bg-slate-800/50">
                  <span className="text-sm font-medium">Admission Open</span>
                  <Switch checked={formData.admissionOpen} onCheckedChange={(val) => setFormData({ ...formData, admissionOpen: val })} />
                </div>

                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Create Program'}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="rounded-[2rem] border bg-white dark:bg-slate-900 shadow-sm p-6">
        <div className="mb-6 relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search programs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 rounded-xl bg-slate-50 dark:bg-slate-800 border-none"
          />
        </div>

        <div className="rounded-xl border overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
              <TableRow>
                <TableHead>Program</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Level & Duration</TableHead>
                <TableHead>Admission</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">Loading programs...</TableCell>
                </TableRow>
              ) : filteredPrograms.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">No programs found.</TableCell>
                </TableRow>
              ) : (
                filteredPrograms.map((prog) => (
                  <TableRow key={prog.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <BookOpen className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-semibold">{prog.title}</div>
                          <div className="text-xs text-muted-foreground uppercase">{prog.slug}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{prog.department?.name || 'N/A'}</TableCell>
                    <TableCell>
                      <div className="text-sm capitalize">{prog.level}</div>
                      <div className="text-xs text-muted-foreground">{prog.duration_months} {prog.duration_unit}</div>
                    </TableCell>
                    <TableCell>
                      {prog.admission_open ? (
                        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Open</span>
                      ) : (
                        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Closed</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                        <Link href={`/admin/programs/${prog.id}`}><Eye className="h-4 w-4" /></Link>
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/programs/${prog.id}`}><Edit className="mr-2 h-4 w-4" /> Edit Details</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteProgram(prog.id)} className="text-red-600 focus:text-red-600">
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

      <Card className="rounded-[2rem] border bg-white dark:bg-slate-900 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Academic Semesters</h2>
          <Dialog open={isSemesterModalOpen} onOpenChange={setIsSemesterModalOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl px-6"><Calendar className="mr-2 h-4 w-4" /> Add Semester</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-white dark:bg-slate-950">
              <DialogHeader>
                <DialogTitle>Create New Semester</DialogTitle>
                <DialogDescription>Create a new semester for an academic session to enable timetable management.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateSemester} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Academic Session *</label>
                  <Select value={semesterFormData.session_id} onValueChange={(val) => setSemesterFormData({ ...semesterFormData, session_id: val })}>
                    <SelectTrigger><SelectValue placeholder="Select session" /></SelectTrigger>
                    <SelectContent>
                      {sessions.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Semester Name *</label>
                  <Select value={semesterFormData.semester_name} onValueChange={(val) => setSemesterFormData({ ...semesterFormData, semester_name: val })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="First Semester">First Semester</SelectItem>
                      <SelectItem value="Second Semester">Second Semester</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Start Date *</label>
                    <Input type="date" required value={semesterFormData.starts_on} onChange={(e) => setSemesterFormData({ ...semesterFormData, starts_on: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">End Date *</label>
                    <Input type="date" required value={semesterFormData.ends_on} onChange={(e) => setSemesterFormData({ ...semesterFormData, ends_on: e.target.value })} />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border bg-slate-50 dark:bg-slate-800/50">
                  <label htmlFor="is_current" className="text-sm font-medium cursor-pointer">Set as Current Semester</label>
                  <input
                    id="is_current"
                    type="checkbox"
                    checked={semesterFormData.is_current}
                    onChange={(e) => setSemesterFormData({ ...semesterFormData, is_current: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsSemesterModalOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={isSubmittingSemester}>{isSubmittingSemester ? 'Creating...' : 'Create Semester'}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="rounded-xl border overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
              <TableRow>
                <TableHead>Semester</TableHead>
                <TableHead>Session</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {semesters.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">No semesters found.</TableCell>
                </TableRow>
              ) : (
                semesters.map((sem: any) => (
                  <TableRow key={sem.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Calendar className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-semibold">{sem.semester_name}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{sem.session?.name || 'N/A'}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {sem.starts_on && new Date(sem.starts_on).toLocaleDateString()} - {sem.ends_on && new Date(sem.ends_on).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {sem.is_current ? (
                          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Current</span>
                        ) : null}
                        {sem.is_active ? (
                          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Active</span>
                        ) : (
                          <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400">Inactive</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setSemesterFormData({
                              session_id: sem.session_id,
                              semester_name: sem.semester_name,
                              starts_on: sem.starts_on || '',
                              ends_on: sem.ends_on || '',
                              is_current: sem.is_current,
                              is_active: sem.is_active
                            })
                            setIsSemesterModalOpen(true)
                          }}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            if (window.confirm('Are you sure you want to delete this semester?')) {
                              fetch(`/api/v1/admin/academic-semesters/${sem.id}`, { method: 'DELETE' })
                                .then(res => res.json())
                                .then(data => {
                                  if (data.success) {
                                    toast.success('Semester deleted successfully')
                                    loadData()
                                  } else {
                                    toast.error(data.error || 'Failed to delete semester')
                                  }
                                })
                            }
                          }} className="text-red-600 focus:text-red-600">
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