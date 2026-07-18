'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, MoreVertical, Edit, Trash2, Calendar, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { getSessionsAction, createSessionAction, deleteSessionAction, updateSessionAction } from '@/app/actions/admin/academic-actions'
import { Switch } from '@/components/ui/switch'

export default function AdminSessionsPage() {
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    starts_on: '',
    ends_on: '',
    is_current: false,
    is_active: true
  })

  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = async () => {
    setLoading(true)
    try {
      const res = await getSessionsAction()
      if (res.success) {
        set( || [])
      } else {
        toast.error('Failed to load sessions: ' + res.error)
      }
    } catch (err) {
      toast.error('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const res = await createSessionAction(formData)
      if (res.success) {
        toast.success('Session created successfully')
        setIsCreateModalOpen(false)
        loadSessions()
        setFormData({ name: '', starts_on: '', ends_on: '', is_current: false, is_active: true })
      } else {
        toast.error(res.error || 'Failed to create session')
      }
    } catch (err) {
      toast.error('An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteSession = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this session? This cannot be undone.')) return
    const res = await deleteSessionAction(id)
    if (res.success) {
      toast.success('Session deleted successfully')
      loadSessions()
    } else {
      toast.error(res.error || 'Failed to delete session')
    }
  }

  const handleSetCurrent = async (id: string) => {
    const res = await updateSessionAction(id, { is_current: true })
    if (res.success) {
      toast.success('Session set as current')
      loadSessions()
    } else {
      toast.error(res.error || 'Failed to set session as current')
    }
  }

  return (
    <div className="space-y-8">
      <div className="rounded-[2.5rem] border border-border bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.12),transparent_30%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--accent-soft)))] p-8 md:p-10">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div>
            <h1 className="mt-2 text-3xl font-extrabold md:text-5xl">Academic Sessions</h1>
            <p className="mt-2 text-sm text-foreground/75">Manage the school's academic calendar and active sessions.</p>
          </div>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl px-6"><Plus className="mr-2 h-4 w-4" /> Add Session</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New Session</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateSession} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Session Name (e.g. 2026/2027)</label>
                  <Input required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Start Date</label>
                    <Input type="date" required value={formData.starts_on} onChange={(e) => setFormData({...formData, starts_on: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">End Date</label>
                    <Input type="date" required value={formData.ends_on} onChange={(e) => setFormData({...formData, ends_on: e.target.value})} />
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border bg-slate-50 dark:bg-slate-800/50">
                  <span className="text-sm font-medium">Set as Current Session</span>
                  <Switch checked={formData.is_current} onCheckedChange={(val) => setFormData({...formData, is_current: val})} />
                </div>

                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creating...' : 'Create Session'}</Button>
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
                <TableHead>Session</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">Loading sessions...</TableCell>
                </TableRow>
              ) : sessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">No sessions found.</TableCell>
                </TableRow>
              ) : (
                sessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Calendar className="h-4 w-4" />
                        </div>
                        {session.name}
                        {session.is_current && <span className="ml-2 px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-full bg-primary/20 text-primary">Current</span>}
                      </div>
                    </TableCell>
                    <TableCell>{new Date(session.starts_on).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(session.ends_on).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {session.is_active ? (
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
                          {!session.is_current && (
                            <DropdownMenuItem onClick={() => handleSetCurrent(session.id)}>
                              <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" /> Set as Current
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleDeleteSession(session.id)} className="text-red-600 focus:text-red-600">
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
