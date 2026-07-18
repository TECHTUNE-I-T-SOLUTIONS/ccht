'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, UserRound, GraduationCap, CheckCircle2, XCircle, FileText, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { getApplicationDetailsAction, updateApplicationStatusAction, updateScreeningScoreAction } from '@/app/actions/admin/admission-actions'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Textarea } from '@/components/ui/textarea'

export default function AdminApplicationReviewPage() {
  const { id } = useParams()
  const [app, setApp] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [status, setStatus] = useState('')
  const [adminNote, setAdminNote] = useState('')

  const [isUpdatingScore, setIsUpdatingScore] = useState(false)
  const [score, setScore] = useState('')

  useEffect(() => {
    if (id) loadData()
  }, [id])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await getApplicationDetailsAction(id as string)
      if (res.success && res.data) {
        setApp(res.data)
        setStatus(res.data.status)
        setAdminNote(res.data.admin_note || '')
        setScore(res.data.screening_score?.toString() || '')
      } else {
        toast.error('Failed to load details: ' + res.error)
      }
    } catch (err) {
      toast.error('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async () => {
    if (status === 'admitted' && !window.confirm('Warning: Setting status to Admitted will permanently convert this applicant into a Student and assign them a matriculation number. Proceed?')) return;
    
    setIsUpdatingStatus(true)
    try {
      const res = await updateApplicationStatusAction(id as string, status, adminNote)
      if (res.success) {
        toast.success('Status updated successfully')
        loadData()
      } else {
        toast.error(res.error || 'Failed to update status')
      }
    } catch (err) {
      toast.error('An error occurred')
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const handleUpdateScore = async () => {
    setIsUpdatingScore(true)
    try {
      const parsedScore = parseInt(score)
      if (isNaN(parsedScore)) throw new Error('Invalid score')
      
      const res = await updateScreeningScoreAction(id as string, parsedScore)
      if (res.success) {
        toast.success('Screening score updated')
        loadData()
      } else {
        toast.error(res.error || 'Failed to update score')
      }
    } catch (err: any) {
      toast.error(err.message || 'An error occurred')
    } finally {
      setIsUpdatingScore(false)
    }
  }

  if (loading) return <div className="flex h-[50vh] items-center justify-center">Loading application...</div>
  if (!app) return <div className="flex h-[50vh] flex-col items-center justify-center gap-4"><p>Application not found.</p><Button asChild><Link href="/admin/admissions">Back</Link></Button></div>

  return (
    <div className="space-y-8">
      <div className="rounded-[2.5rem] border border-border bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.12),transparent_30%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--accent-soft)))] p-8 md:p-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
          <Button variant="ghost" size="icon" className="rounded-full bg-white/50 dark:bg-slate-900/50" asChild>
            <Link href="/admin/admissions"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-border bg-white dark:bg-slate-900">
              {app.profile?.avatar_url ? (
                <img src={app.profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <UserRound className="h-8 w-8 text-primary" />
              )}
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Admission Application</p>
              <h1 className="mt-1 text-3xl font-extrabold md:text-4xl">{app.profile?.first_name} {app.profile?.last_name}</h1>
              <p className="mt-1 text-sm text-foreground/75">{app.profile?.email} • {app.profile?.phone || 'No phone provided'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        
        {/* Left Column: Details & Documents */}
        <div className="space-y-8 lg:col-span-2">
          <Card className="rounded-[2rem] border bg-white dark:bg-slate-900 shadow-sm p-6">
            <h2 className="text-xl font-bold mb-6 flex items-center"><GraduationCap className="mr-2 h-5 w-5 text-primary" /> Program Details</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Program Applied</p>
                <p className="font-medium text-lg">{app.program?.title}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Department</p>
                <p className="font-medium text-lg">{app.program?.department?.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Level</p>
                <p className="font-medium capitalize">{app.program?.level}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Payment Status</p>
                <p className={`font-medium capitalize ${app.payment_status === 'paid' ? 'text-emerald-500' : 'text-orange-500'}`}>
                  {app.payment_status}
                </p>
              </div>
            </div>
          </Card>

          <Card className="rounded-[2rem] border bg-white dark:bg-slate-900 shadow-sm p-6">
            <h2 className="text-xl font-bold mb-6 flex items-center"><UserRound className="mr-2 h-5 w-5 text-primary" /> Aspirant Details</h2>
            {app.profile?.aspirant_profiles?.[0] ? (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Gender</p>
                  <p className="font-semibold capitalize">{app.profile.aspirant_profiles[0].gender}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Date of Birth</p>
                  <p className="font-semibold">{app.profile.aspirant_profiles[0].dob || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Nationality</p>
                  <p className="font-semibold">{app.profile.aspirant_profiles[0].nationality || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">State of Origin</p>
                  <p className="font-semibold">{app.profile.aspirant_profiles[0].state_of_origin || 'N/A'}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No additional profile details provided.</p>
            )}
          </Card>

          <Card className="rounded-[2rem] border bg-white dark:bg-slate-900 shadow-sm p-6">
            <h2 className="text-xl font-bold mb-6 flex items-center"><FileText className="mr-2 h-5 w-5 text-primary" /> Screening Details</h2>
            <div className="space-y-6">
              <div className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-800/50 flex flex-col sm:flex-row items-center gap-4">
                <div className="flex-1">
                  <p className="text-sm font-semibold">Screening Test Score</p>
                  <p className="text-xs text-muted-foreground">The score obtained in the CBT screening exercise.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Input type="number" min="0" max="100" value={score} onChange={e => setScore(e.target.value)} className="w-24 text-center font-bold" />
                  <Button onClick={handleUpdateScore} disabled={isUpdatingScore} size="sm" className="rounded-lg">
                    {isUpdatingScore ? 'Saving...' : 'Update Score'}
                  </Button>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-semibold mb-2">Previous Education / Documents</p>
                {app.profile?.admission_documents && app.profile.admission_documents.length > 0 ? (
                  <div className="space-y-2">
                    {app.profile.admission_documents.map((doc: any) => (
                      <div key={doc.id} className="p-3 border rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-primary" />
                          <div>
                            <p className="text-sm font-semibold capitalize">{doc.document_type.replace(/_/g, ' ')}</p>
                            <p className="text-xs text-muted-foreground">Status: {doc.status}</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <a href={doc.file_url} target="_blank" rel="noreferrer">View</a>
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No documents uploaded yet.</p>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Status Control */}
        <div className="space-y-8 lg:col-span-1">
          <Card className="rounded-[2rem] border bg-white dark:bg-slate-900 shadow-sm p-6 sticky top-6">
            <h2 className="text-xl font-bold mb-6">Decision</h2>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Application Status</label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="accepted">Accepted (Offer Letter)</SelectItem>
                    <SelectItem value="admitted">Admitted (Convert to Student)</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Internal Note / Remarks</label>
                <Textarea 
                  value={adminNote} 
                  onChange={e => setAdminNote(e.target.value)} 
                  placeholder="Notes about this application (not visible to applicant)..."
                  rows={4}
                />
              </div>

              <Button onClick={handleUpdateStatus} disabled={isUpdatingStatus} className="w-full rounded-xl">
                {isUpdatingStatus ? 'Saving...' : 'Save Decision'}
              </Button>
              
              {app.status === 'admitted' && (
                <div className="mt-4 p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 rounded-lg text-sm flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
                  <p>This applicant has been admitted and converted to a student profile.</p>
                </div>
              )}
            </div>
          </Card>
        </div>

      </div>
    </div>
  )
}
