'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, MoreVertical, Edit, Trash2, Building } from 'lucide-react'
import { toast } from 'sonner'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { getDepartmentsAction, createDepartmentAction, deleteDepartmentAction } from '@/app/actions/admin/academic-actions'
import { Textarea } from '@/components/ui/textarea'

export default function AdminDepartmentsPage() {
  const [departments, setDepartments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    is_active: true
  })

  useEffect(() => {
    loadDepartments()
  }, [])

  const loadDepartments = async () => {
    setLoading(true)
    try {
      const res = await getDepartmentsAction()
      if (res.success) {
        setDepartments(res.data || [])
      } else {
        toast.error('Failed to load departments: ' + res.error)
      }
    } catch (err) {
      toast.error('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const res = await createDepartmentAction(formData)
      if (res.success) {
        toast.success('Department created successfully')
        setIsCreateModalOpen(false)
        loadDepartments()
        setFormData({ name: '', code: '', description: '', is_active: true })
      } else {
        toast.error(res.error || 'Failed to create department')
      }
    } catch (err) {
      toast.error('An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteDepartment = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this department? This cannot be undone.')) return
    const res = await deleteDepartmentAction(id)
    if (res.success) {
      toast.success('Department deleted successfully')
      loadDepartments()
    } else {
      toast.error(res.error || 'Failed to delete department')
    }
  }

  return (
    <div className="space-y-8">
      <div className="rounded-[2.5rem] border border-border bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.12),transparent_30%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--accent-soft)))] p-8 md:p-10">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div>
            <h1 className="mt-2 text-3xl font-extrabold md:text-5xl">Departments</h1>
            <p className="mt-2 text-sm text-foreground/75">Manage the school's academic and administrative departments.</p>
          </div>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl px-6"><Plus className="mr-2 h-4 w-4" /> Add Department</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New Department</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateDepartment} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Department Name</label>
                  <Input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Computer Science" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Department Code</label>
                  <Input required value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} placeholder="e.g. CSC" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                </div>

                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Create Department'}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="rounded-[2rem] border bg-white dark:bg-slate-900 shadow-sm p-6">
        <div className="rounded-xl border overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
              <TableRow>
                <TableHead>Department</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">Loading departments...</TableCell>
                </TableRow>
              ) : departments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">No departments found.</TableCell>
                </TableRow>
              ) : (
                departments.map((dept) => (
                  <TableRow key={dept.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Building className="h-4 w-4" />
                        </div>
                        {dept.name}
                      </div>
                    </TableCell>
                    <TableCell><span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-xs">{dept.code}</span></TableCell>
                    <TableCell className="max-w-xs truncate">{dept.description}</TableCell>
                    <TableCell>
                      {dept.is_active ? (
                        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Active</span>
                      ) : (
                        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Inactive</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleDeleteDepartment(dept.id)} className="text-red-600 focus:text-red-600">
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
