'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Search, Filter, Download, Eye, CheckCircle, XCircle, AlertCircle, Clock, User, Calendar } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

type Document = {
  id: string
  aspirant_id: string
  aspirant_name?: string
  aspirant_email?: string
  document_type: string
  file_url: string
  file_name: string
  file_size: number
  file_type: string
  verification_status: string
  verification_note?: string
  verified_by?: string
  verified_at?: string
  uploaded_at: string
}

export default function AdminDocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  
  // Document modal states
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
  const [showDocModal, setShowDocModal] = useState(false)
  const [updatingDocStatus, setUpdatingDocStatus] = useState(false)
  const [docVerificationStatus, setDocVerificationStatus] = useState('')
  const [docVerificationNote, setDocVerificationNote] = useState('')

  useEffect(() => {
    loadDocuments()
  }, [])

  const loadDocuments = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/v1/admin/admissions/documents')
      const data = await res.json()
      if (data.success) {
        setDocuments(data.data)
      } else {
        toast.error('Failed to load documents: ' + data.error)
      }
    } catch (error) {
      console.error('Failed to load documents:', error)
      toast.error('Failed to load documents')
    } finally {
      setLoading(false)
    }
  }

  const handleViewDocument = (doc: Document) => {
    setSelectedDoc(doc)
    setDocVerificationStatus(doc.verification_status || 'pending')
    setDocVerificationNote(doc.verification_note || '')
    setShowDocModal(true)
  }

  const handleUpdateDocumentStatus = async () => {
    if (!selectedDoc) return
    
    setUpdatingDocStatus(true)
    try {
      const res = await fetch('/api/v1/admin/admissions/documents', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: selectedDoc.id,
          verification_status: docVerificationStatus,
          verification_note: docVerificationNote,
        }),
      })

      const data = await res.json()
      if (data.success) {
        toast.success('Document verification status updated')
        setShowDocModal(false)
        loadDocuments()
      } else {
        toast.error('Failed to update document status: ' + data.error)
      }
    } catch (error) {
      console.error('Failed to update document status:', error)
      toast.error('Failed to update document status')
    } finally {
      setUpdatingDocStatus(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
      verified: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
      rejected: 'bg-red-500/10 text-red-600 border-red-500/20',
      needs_correction: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
    }
    return colors[status] || 'bg-gray-500/10 text-gray-600 border-gray-500/20'
  }

  const getDocumentTypeLabel = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = 
      `${doc.aspirant_name || ''} ${doc.aspirant_email || ''} ${doc.document_type} ${doc.file_name}`.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || doc.verification_status === statusFilter
    const matchesType = typeFilter === 'all' || doc.document_type === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  // Get unique document types for filter
  const documentTypes = Array.from(new Set(documents.map(doc => doc.document_type)))

  const stats = {
    total: documents.length,
    pending: documents.filter(d => d.verification_status === 'pending').length,
    verified: documents.filter(d => d.verification_status === 'verified').length,
    rejected: documents.filter(d => d.verification_status === 'rejected').length,
    needsCorrection: documents.filter(d => d.verification_status === 'needs_correction').length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admission Documents</h1>
          <p className="mt-1 text-sm text-muted-foreground">Review and verify aspirant uploaded documents</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2" onClick={loadDocuments}>
            <FileText className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Documents</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending Review</p>
              <p className="text-2xl font-bold">{stats.pending}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Verified</p>
              <p className="text-2xl font-bold">{stats.verified}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-emerald-600" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Rejected</p>
              <p className="text-2xl font-bold">{stats.rejected}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Needs Correction</p>
              <p className="text-2xl font-bold">{stats.needsCorrection}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-orange-600" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by aspirant name, email, document type, or file name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="needs_correction">Needs Correction</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Filter by document type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Document Types</SelectItem>
              {documentTypes.map(type => (
                <SelectItem key={type} value={type}>
                  {getDocumentTypeLabel(type)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Documents Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Loading documents...</p>
          </div>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-semibold">No documents found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' 
              ? 'Try adjusting your search or filters' 
              : 'No documents have been uploaded yet'}
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Aspirant</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Document Type</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">File Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Uploaded</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">{doc.aspirant_name || 'Unknown'}</p>
                          <p className="text-xs text-muted-foreground">{doc.aspirant_email || 'No email'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium">{getDocumentTypeLabel(doc.document_type)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium">{doc.file_name}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(doc.file_size)}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={getStatusColor(doc.verification_status)}>
                        {doc.verification_status.replace(/_/g, ' ')}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {new Date(doc.uploaded_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" className="gap-2" onClick={() => handleViewDocument(doc)}>
                          <Eye className="h-4 w-4" />
                          Review
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="gap-2"
                          onClick={() => window.open(doc.file_url, '_blank')}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Document Review Modal */}
      <Dialog open={showDocModal} onOpenChange={setShowDocModal}>
        <DialogContent className="max-w-3xl bg-white dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle className="text-foreground">Document Review</DialogTitle>
            <DialogDescription>
              Review and verify the uploaded document
            </DialogDescription>
          </DialogHeader>
          
          {selectedDoc && (
            <div className="space-y-6">
              {/* Document Info */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium">Aspirant</p>
                  <p className="text-sm text-muted-foreground">{selectedDoc.aspirant_name || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Document Type</p>
                  <p className="text-sm text-muted-foreground">{getDocumentTypeLabel(selectedDoc.document_type)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">File Name</p>
                  <p className="text-sm text-muted-foreground">{selectedDoc.file_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">File Size</p>
                  <p className="text-sm text-muted-foreground">{formatFileSize(selectedDoc.file_size)}</p>
                </div>
              </div>

              {/* Document Preview */}
              <div className="rounded-lg border bg-slate-50 dark:bg-slate-800/50 p-4">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium">Document Preview</p>
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => window.open(selectedDoc.file_url, '_blank')}>
                    <Eye className="h-4 w-4" />
                    Open in New Tab
                  </Button>
                </div>
                <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
                  <FileText className="h-16 w-16 text-white/50" />
                </div>
              </div>

              {/* Verification Controls */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Verification Status</label>
                  <Select value={docVerificationStatus} onValueChange={setDocVerificationStatus}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="verified">Verified</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="needs_correction">Needs Correction</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Verification Note</label>
                  <Textarea
                    value={docVerificationNote}
                    onChange={(e) => setDocVerificationNote(e.target.value)}
                    placeholder="Add notes about this document verification..."
                    rows={3}
                    className="mt-2"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowDocModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateDocumentStatus} disabled={updatingDocStatus}>
                  {updatingDocStatus ? 'Updating...' : 'Update Status'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
