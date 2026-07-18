'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, UserRound, GraduationCap, CheckCircle2, XCircle, FileText, Upload, Eye, FileDown } from 'lucide-react'
import { toast } from 'sonner'
import { getApplicationDetailsAction, updateApplicationStatusAction, updateDocumentVerificationStatusAction, migrateToStudentAction } from '@/app/actions/admin/admission-actions'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export default function AdminApplicationReviewPage() {
  const { id } = useParams()
  const [app, setApp] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [isMigrating, setIsMigrating] = useState(false)
  const [status, setStatus] = useState('')
  const [adminNote, setAdminNote] = useState('')

  // Document modal states
  const [showDocModal, setShowDocModal] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<any>(null)
  const [updatingDocStatus, setUpdatingDocStatus] = useState(false)
  const [docVerificationStatus, setDocVerificationStatus] = useState('')
  const [docVerificationNote, setDocVerificationNote] = useState('')

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

  const handleViewDocument = (doc: any) => {
    setSelectedDoc(doc)
    setDocVerificationStatus(doc.verification_status || 'pending')
    setDocVerificationNote(doc.verification_note || '')
    setShowDocModal(true)
  }

  const handleUpdateDocumentStatus = async () => {
    setUpdatingDocStatus(true)
    try {
      const res = await updateDocumentVerificationStatusAction(selectedDoc.id, docVerificationStatus, docVerificationNote)
      if (res.success) {
        toast.success('Document verification status updated')
        setShowDocModal(false)
        loadData()
      } else {
        toast.error(res.error || 'Failed to update document status')
      }
    } catch (err) {
      toast.error('Failed to update document status')
    } finally {
      setUpdatingDocStatus(false)
    }
  }

  const handleMigrateToStudent = async () => {
    if (!window.confirm('Are you sure you want to migrate this applicant to the student portal? This will convert them to a student and assign their matric number.')) return;
    
    setIsMigrating(true)
    try {
      const res = await migrateToStudentAction(id as string)
      if (res.success) {
        toast.success('Applicant migrated to student portal successfully')
        loadData()
      } else {
        toast.error(res.error || 'Failed to migrate applicant')
      }
    } catch (err) {
      toast.error('An error occurred')
    } finally {
      setIsMigrating(false)
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
              <p className="mt-1 text-sm text-foreground/75">{app.profile?.email} • {app.profile?.phone || app.phone || 'No phone provided'}</p>
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
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Phone Number</p>
                <p className="font-semibold">{app.phone || app.profile?.phone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Gender</p>
                <p className="font-semibold capitalize">{app.gender || 'N/A'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Date of Birth</p>
                <p className="font-semibold">{app.date_of_birth ? new Date(app.date_of_birth).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Nationality</p>
                <p className="font-semibold">{app.nationality || 'N/A'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">State of Origin</p>
                <p className="font-semibold">{app.state_of_origin || 'N/A'}</p>
              </div>
            </div>
          </Card>

          <Card className="rounded-[2rem] border bg-white dark:bg-slate-900 shadow-sm p-6">
            <h2 className="text-xl font-bold mb-6 flex items-center"><FileText className="mr-2 h-5 w-5 text-primary" /> Screening Details</h2>
            <div className="space-y-6">
              <div className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">Screening Test Score</p>
                    <p className="text-xs text-muted-foreground">The score obtained in the CBT screening exercise.</p>
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    {app.screening_score || 'N/A'}
                  </div>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-semibold mb-2">Previous Education / Documents</p>
                {app.admission_documents && app.admission_documents.length > 0 ? (
                  <div className="space-y-2">
                    {app.admission_documents.map((doc: any) => (
                      <div key={doc.id} className="p-3 border rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-primary" />
                          <div>
                            <p className="text-sm font-semibold capitalize">{doc.document_type.replace(/_/g, ' ')}</p>
                            <p className="text-xs text-muted-foreground">Status: {doc.verification_status || doc.status || 'pending'}</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => handleViewDocument(doc)}>
                          <Eye className="h-4 w-4 mr-2" /> View & Verify
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
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="under_review">Under Review</SelectItem>
                    <SelectItem value="accepted">Accepted (Offer Letter)</SelectItem>
                    <SelectItem value="pending_payment">Pending Payment (waiting for student to pay)</SelectItem>
                    <SelectItem value="admitted">Admitted (Convert to Student)</SelectItem>
                    <SelectItem value="migrated">Migrated (Converted to Student)</SelectItem>
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
                <Button 
                  onClick={handleMigrateToStudent} 
                  disabled={isMigrating}
                  variant="outline"
                  className="w-full rounded-xl"
                >
                  {isMigrating ? 'Migrating...' : 'Migrate to Student'}
                </Button>
              )}
              
              {app.status === 'migrated' && (
                <div className="mt-4 p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 rounded-lg text-sm flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
                  <p>This applicant has been successfully migrated to the student portal.</p>
                </div>
              )}
            </div>
          </Card>
        </div>

      </div>

      {/* Document Preview & Verification Modal */}
      {showDocModal && selectedDoc && (
        <Dialog open={showDocModal} onOpenChange={setShowDocModal}>
          <DialogContent className="bg-white dark:bg-black sm:max-w-[800px] max-h-[90vh] overflow-y-auto z-[80]">
            <DialogHeader>
              <DialogTitle>Document Verification</DialogTitle>
              <DialogDescription>
                Review and verify the uploaded document.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-800/50">
                <p className="text-sm font-semibold capitalize">{selectedDoc.document_type.replace(/_/g, ' ')}</p>
                <p className="text-xs text-muted-foreground">Uploaded: {selectedDoc.uploaded_at ? new Date(selectedDoc.uploaded_at).toLocaleString() : 'N/A'}</p>
              </div>

              <div className="border rounded-xl overflow-hidden">
                {(() => {
                  const fileUrl = selectedDoc.file_url || selectedDoc.storage_path;
                  const isImage = fileUrl?.match(/\.(jpg|jpeg|png|gif|webp)$/i) || selectedDoc.mime_type?.startsWith('image/');
                  const isPdf = fileUrl?.match(/\.pdf$/i) || selectedDoc.mime_type === 'application/pdf';

                  if (isImage) {
                    return (
                      <img 
                        src={fileUrl} 
                        alt={selectedDoc.document_type}
                        className="w-full max-h-[500px] object-contain bg-slate-100 dark:bg-slate-800"
                      />
                    );
                  } else if (isPdf) {
                    return (
                      <div className="flex flex-col items-center justify-center gap-4 p-8 min-h-[300px]">
                        <FileDown className="h-16 w-16 text-muted-foreground" />
                        <div className="text-center">
                          <p className="text-sm font-medium text-foreground mb-2">PDF Document</p>
                          <p className="text-xs text-muted-foreground mb-4">Click the button below to view or download</p>
                          <a 
                            href={fileUrl} 
                            target="_blank" 
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary/90"
                          >
                            <FileDown className="h-4 w-4" />
                            Open PDF Document
                          </a>
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div className="p-8 text-center text-muted-foreground min-h-[200px]">
                        <FileDown className="mx-auto mb-4 h-12 w-12" />
                        <p className="text-sm">Preview not available for this file type</p>
                        <a href={fileUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-primary underline">
                          Download to view
                        </a>
                      </div>
                    );
                  }
                })()}
              </div>

              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Verification Status</label>
                  <Select value={docVerificationStatus} onValueChange={setDocVerificationStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="z-[100]">
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="verified">Verified</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="needs_correction">Needs Correction</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Verification Note (Optional)</label>
                  <Textarea 
                    value={docVerificationNote}
                    onChange={e => setDocVerificationNote(e.target.value)}
                    placeholder="Add notes about this verification..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={() => setShowDocModal(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdateDocumentStatus} disabled={updatingDocStatus}>
                    {updatingDocStatus ? 'Updating...' : 'Update Status'}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
