'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, MoreVertical, Trash2, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { getFeeSchedulesAction, createFeeScheduleAction, deleteFeeScheduleAction } from '@/app/actions/admin/finance-actions'
import { getProgramsAction } from '@/app/actions/admin/program-actions'
import { Switch } from '@/components/ui/switch'
import { set } from 'zod'

export default function AdminFeeSchedulesPage() {
  const [feeSchedules, setFeeSchedules] = useState<any[]>([])
  const [programs, setPrograms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    programId: '',
    feeType: 'tuition',
    amount: 0,
    currency: 'NGN',
    dueDate: '',
    isMandatory: true
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [feeRes, progRes] = await Promise.all([
        getFeeSchedulesAction(),
        getProgramsAction()
      ])

      if (feeRes.success) setFeeSchedules(feeRes.data || [])
      else toast.error('Failed to load fee schedules')

      if (progRes.success) setPrograms(progRes.data || [])
    } catch (err) {
      toast.error('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const res = await createFeeScheduleAction(formData)
      if (res.success) {
        toast.success('Fee Schedule created')
        setIsCreateModalOpen(false)
        loadData()
        setFormData({ programId: '', feeType: 'tuition', amount: 0, currency: 'NGN', dueDate: '', isMandatory: true })
      } else {
        toast.error(res.error || 'Failed to create fee schedule')
      }
    } catch (err) {
      toast.error('An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this fee schedule?')) return
    const res = await deleteFeeScheduleAction(id)
    if (res.success) {
      toast.success('Fee Schedule deleted')
      loadData()
    } else {
      toast.error(res.error || 'Failed to delete fee schedule')
    }
  }

  return (
    <div className="space-y-8">
      <div className="rounded-[2.5rem] border border-border bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.12),transparent_30%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--accent-soft)))] p-8 md:p-10">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div>
            <h1 className="mt-2 text-3xl font-extrabold md:text-5xl">Fee Schedules</h1>
            <p className="mt-2 text-sm text-foreground/75">Manage tuition, acceptance fees, and other charges for programs.</p>
          </div>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl px-6"><Plus className="mr-2 h-4 w-4" /> Add Fee</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create Fee Schedule</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Program</label>
                  <Select value={formData.programId} onValueChange={(val) => setFormData({ ...formData, programId: val })}>
                    <SelectTrigger><SelectValue placeholder="Select program" /></SelectTrigger>
                    <SelectContent>
                      {programs.map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Fee Type</label>
                  <Select value={formData.feeType} onValueChange={(val) => setFormData({ ...formData, feeType: val })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tuition">Tuition Fee</SelectItem>
                      <SelectItem value="acceptance">Acceptance Fee</SelectItem>
                      <SelectItem value="graduation">Graduation Fee</SelectItem>
                      <SelectItem value="other">Other Charges</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Amount</label>
                    <Input type="number" min="0" required value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: parseInt(e.target.value) || 0 })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Currency</label>
                    <Input value={formData.currency} onChange={(e) => setFormData({ ...formData, currency: e.target.value })} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Due Date (Optional)</label>
                  <Input type="date" value={formData.dueDate} onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })} />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border bg-slate-50 dark:bg-slate-800/50">
                  <span className="text-sm font-medium">Is Mandatory?</span>
                  <Switch checked={formData.isMandatory} onCheckedChange={(val) => setFormData({ ...formData, isMandatory: val })} />
                </div>

                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Create Fee'}</Button>
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
                <TableHead>Fee Type</TableHead>
                <TableHead>Program</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Mandatory</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">Loading fees...</TableCell>
                </TableRow>
              ) : feeSchedules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">No fee schedules found.</TableCell>
                </TableRow>
              ) : (
                feeSchedules.map((fee) => (
                  <TableRow key={fee.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Wallet className="h-4 w-4" />
                        </div>
                        <span className="capitalize">{fee.fee_type}</span>
                      </div>
                    </TableCell>
                    <TableCell>{fee.program?.title}</TableCell>
                    <TableCell className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {fee.currency} {fee.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>{fee.due_date ? new Date(fee.due_date).toLocaleDateString() : 'None'}</TableCell>
                    <TableCell>
                      {fee.is_mandatory ? (
                        <span className="px-2 py-1 text-[10px] font-bold uppercase rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Required</span>
                      ) : (
                        <span className="px-2 py-1 text-[10px] font-bold uppercase rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400">Optional</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleDelete(fee.id)} className="text-red-600 focus:text-red-600">
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
