'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Search, Eye, FileText, CheckCircle2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { getApplicationsAction, updateApplicationStatusAction, bulkMigrateToStudentsAction } from '@/app/actions/admin/admission-actions'
import { getProgramsAction } from '@/app/actions/admin/program-actions'
import Link from 'next/link'
import { set } from 'zod'

export default function AdminAdmissionsPage() {
  const [applications, setApplications] = useState<any[]>([])
  const [programs, setPrograms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isBulkMigrating, setIsBulkMigrating] = useState(false)

  const [statusFilter, setStatusFilter] = useState('all')
  const [programFilter, setProgramFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadPrograms()
  }, [])

  useEffect(() => {
    loadApplications()
  }, [statusFilter, programFilter])

  const loadPrograms = async () => {
    try {
      const progRes = await getProgramsAction()
      if (progRes.success) setPrograms(progRes.data || [])
    } catch (err) {
      console.error(err)
    }
  }

  const loadApplications = async () => {
    setLoading(true)
    try {
      const appRes = await getApplicationsAction(statusFilter, programFilter)
      if (appRes.success) setApplications(appRes.data || [])
      else toast.error('Failed to load applications: ' + appRes.error)
    } catch (err) {
      toast.error('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickStatusUpdate = async (id: string, status: string) => {
    if (status === 'admitted' && !window.confirm('Are you sure you want to admit this applicant? This will convert their account to a student.')) return;

    const res = await updateApplicationStatusAction(id, status)
    if (res.success) {
      toast.success(`Application marked as ${status}`)
      loadApplications()
    } else {
      toast.error(res.error || 'Failed to update status')
    }
  }

  const handleBulkMigrate = async () => {
    const admittedApps = applications.filter(app => app.status === 'admitted')
    if (admittedApps.length === 0) {
      toast.error('No admitted applicants to migrate')
      return
    }

    if (!window.confirm(`Are you sure you want to migrate ${admittedApps.length} admitted applicant(s) to the student portal?`)) return;

    setIsBulkMigrating(true)
    try {
      const profileIds = admittedApps.map(app => app.id)
      const res = await bulkMigrateToStudentsAction(profileIds)
      
      if (res.success && res.data) {
        const successCount = res.data.filter((r: any) => r.success).length
        const failCount = res.data.filter((r: any) => !r.success).length
        
        toast.success(`Migration completed: ${successCount} successful, ${failCount} failed`)
        loadApplications()
      } else {
        toast.error(res.error || 'Failed to bulk migrate')
      }
    } catch (err) {
      toast.error('An error occurred')
    } finally {
      setIsBulkMigrating(false)
    }
  }

  const filteredApps = applications.filter(app => {
    const fullName = `${app.profile?.first_name} ${app.profile?.last_name}`.toLowerCase()
    const email = app.profile?.email?.toLowerCase() || ''
    const q = searchQuery.toLowerCase()
    return fullName.includes(q) || email.includes(q)
  })

  return (
    <div className="space-y-8">
      <div className="rounded-[2.5rem] border border-border bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.12),transparent_30%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--accent-soft)))] p-8 md:p-10">
        <h1 className="mt-2 text-3xl font-extrabold md:text-5xl">Admissions & Screening</h1>
        <p className="mt-2 text-sm text-foreground/75">Review and manage applicant applications, screening scores, and admission statuses.</p>
      </div>

      <Card className="rounded-[2rem] border bg-white dark:bg-slate-900 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search applicants by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 rounded-xl bg-slate-50 dark:bg-slate-800 border-none"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] rounded-xl bg-slate-50 dark:bg-slate-800 border-none">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="under_review">Under Review</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="admitted">Admitted</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Select value={programFilter} onValueChange={setProgramFilter}>
            <SelectTrigger className="w-[200px] rounded-xl bg-slate-50 dark:bg-slate-800 border-none">
              <SelectValue placeholder="Filter by program" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Programs</SelectItem>
              {programs.map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button 
            onClick={handleBulkMigrate}
            disabled={isBulkMigrating}
            variant="outline"
            className="rounded-xl"
          >
            {isBulkMigrating ? 'Migrating...' : 'Bulk Migrate Admitted'}
          </Button>
        </div>

        <div className="rounded-xl border overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
              <TableRow>
                <TableHead>Applicant</TableHead>
                <TableHead>Program</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">Loading applications...</TableCell>
                </TableRow>
              ) : filteredApps.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">No applications found.</TableCell>
                </TableRow>
              ) : (
                filteredApps.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div>
                          <div>{app.profile?.first_name} {app.profile?.last_name}</div>
                          <div className="text-xs text-muted-foreground">{app.profile?.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{app.program?.title}</TableCell>
                    <TableCell>
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full capitalize ${app.status === 'admitted' ? 'bg-emerald-100 text-emerald-700' :
                          app.status === 'rejected' ? 'bg-red-100 text-red-700' :
                            app.status === 'accepted' ? 'bg-blue-100 text-blue-700' :
                              'bg-orange-100 text-orange-700'
                        }`}>
                        {app.status.replace('_', ' ')}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full capitalize ${app.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                        {app.payment_status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {app.status === 'pending' && (
                          <Button variant="ghost" size="sm" onClick={() => handleQuickStatusUpdate(app.id, 'under_review')} title="Mark Under Review">
                            <Eye className="h-4 w-4 text-blue-500" />
                          </Button>
                        )}
                        {app.status === 'under_review' && (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => handleQuickStatusUpdate(app.id, 'accepted')} title="Accept">
                              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleQuickStatusUpdate(app.id, 'rejected')} title="Reject">
                              <XCircle className="h-4 w-4 text-red-500" />
                            </Button>
                          </>
                        )}
                        <Button variant="outline" size="sm" className="rounded-xl" asChild>
                          <Link href={`/admin/admissions/${app.id}`}>Review</Link>
                        </Button>
                      </div>
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
