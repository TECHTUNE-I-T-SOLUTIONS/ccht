'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Video, Play, Download, Trash2, Search, Filter, Calendar, Clock, User, ShieldCheck, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog'

type ExamRecording = {
  id: string
  session_id: string
  recording_url: string
  recording_duration_seconds: number
  file_size_bytes: number
  storage_provider: string
  status: string
  expires_at: string
  created_at: string
  aspirant_name?: string
  aspirant_email?: string
  exam_type?: string
}

export default function ExamRecordingsPage() {
  const [recordings, setRecordings] = useState<ExamRecording[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedRecording, setSelectedRecording] = useState<ExamRecording | null>(null)
  const [videoDialogOpen, setVideoDialogOpen] = useState(false)

  useEffect(() => {
    loadRecordings()
  }, [])

  const loadRecordings = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/v1/admin/exam-recordings')
      const data = await res.json()
      if (data.success) {
        setRecordings(data.data)
      }
    } catch (error) {
      console.error('Failed to load recordings:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      available: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
      processing: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
      expired: 'bg-red-500/10 text-red-600 border-red-500/20',
      deleted: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
    }
    return colors[status] || 'bg-gray-500/10 text-gray-600 border-gray-500/20'
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(2)} KB`
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  const filteredRecordings = recordings.filter(recording => {
    const matchesSearch = 
      `${recording.aspirant_name || ''} ${recording.aspirant_email || ''} ${recording.session_id}`.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || recording.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleDeleteRecording = async (recordingId: string) => {
    if (!confirm('Are you sure you want to delete this recording?')) return
    
    try {
      const res = await fetch(`/api/v1/admin/exam-recordings?id=${recordingId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        loadRecordings()
      }
    } catch (error) {
      console.error('Failed to delete recording:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Exam Recordings</h1>
          <p className="mt-1 text-sm text-muted-foreground">View and manage aspirant exam screen recordings</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2" onClick={loadRecordings}>
            <ShieldCheck className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by aspirant name, email, or session ID..."
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
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Recordings Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Loading recordings...</p>
          </div>
        </div>
      ) : filteredRecordings.length === 0 ? (
        <Card className="p-12 text-center">
          <Video className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-semibold">No recordings found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filters' 
              : 'No exam recordings available yet'}
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredRecordings.map((recording) => (
            <Card key={recording.id} className="overflow-hidden">
              <div className="aspect-video bg-slate-900 flex items-center justify-center relative group">
                <video 
                  src={recording.recording_url} 
                  className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                  muted
                  preload="metadata"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="rounded-full bg-black/50 p-4 backdrop-blur-sm">
                    <Play className="h-8 w-8 text-white" />
                  </div>
                </div>
                <Badge className={`absolute top-3 right-3 ${getStatusColor(recording.status)}`}>
                  {recording.status}
                </Badge>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">
                      {recording.aspirant_name || 'Unknown Aspirant'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {recording.aspirant_email || recording.session_id}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDuration(recording.recording_duration_seconds)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Download className="h-3 w-3" />
                    {formatFileSize(recording.file_size_bytes)}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {new Date(recording.created_at).toLocaleDateString()}
                </div>

                <div className="flex gap-2 pt-2">
                  <Dialog open={videoDialogOpen && selectedRecording?.id === recording.id} onOpenChange={(open) => {
                    setVideoDialogOpen(open)
                    if (!open) setSelectedRecording(null)
                  }}>
                    <DialogTrigger asChild>
                      <Button 
                        size="sm" 
                        className="flex-1 gap-2"
                        onClick={() => setSelectedRecording(recording)}
                      >
                        <Play className="h-3 w-3" />
                        Play
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl bg-white dark:bg-slate-900">
                      <DialogHeader>
                        <DialogTitle className="text-foreground">Exam Recording</DialogTitle>
                        <DialogDescription>
                          View and review the aspirant's screen recording during the entrance examination
                        </DialogDescription>
                      </DialogHeader>
                      <div className="aspect-video bg-black rounded-lg overflow-hidden">
                        <video 
                          src={recording.recording_url} 
                          controls 
                          className="w-full h-full"
                        />
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex gap-4">
                          <span>Duration: {formatDuration(recording.recording_duration_seconds)}</span>
                          <span>Size: {formatFileSize(recording.file_size_bytes)}</span>
                        </div>
                        <a 
                          href={recording.recording_url} 
                          download 
                          className="flex items-center gap-1 hover:text-foreground"
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </a>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="gap-2"
                    onClick={() => window.open(recording.recording_url, '_blank')}
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                  
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="gap-2 text-red-600 hover:text-red-700"
                    onClick={() => handleDeleteRecording(recording.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
