'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ShieldAlert, Video, FileText, Eye, Download, AlertTriangle, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

type ExamSession = {
  id: string
  aspirant_id: string
  exam_type: string
  academic_year: string
  started_at: string
  submitted_at: string | null
  time_spent_seconds: number | null
  score: number | null
  total_questions: number | null
  percentage: number | null
  status: string
  disqualification_reason: string | null
}

type Violation = {
  id: string
  session_id: string
  violation_type: string
  severity: string
  details: string
  timestamp: string
  screenshot_url: string | null
}

type Recording = {
  id: string
  session_id: string
  recording_url: string
  recording_duration_seconds: number
  file_size_bytes: number
  storage_provider: string
  status: string
  expires_at: string
  created_at: string
}

export default function AdminExamProctoringPage() {
  const [sessions, setSessions] = useState<ExamSession[]>([])
  const [violations, setViolations] = useState<Violation[]>([])
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSession, setSelectedSession] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [sessionsRes, violationsRes, recordingsRes] = await Promise.all([
        fetch('/api/v1/admin/exam-sessions'),
        fetch('/api/v1/admin/exam-violations'),
        fetch('/api/v1/admin/exam-recordings'),
      ])

      if (sessionsRes.ok) {
        const data = await sessionsRes.json()
        setSessions(data.data || [])
      }

      if (violationsRes.ok) {
        const data = await violationsRes.json()
        setViolations(data.data || [])
      }

      if (recordingsRes.ok) {
        const data = await recordingsRes.json()
        setRecordings(data.data || [])
      }
    } catch (error) {
      console.error('Failed to load proctoring data:', error)
      toast.error('Failed to load proctoring data')
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/10 text-red-600 border-red-500/20'
      case 'high': return 'bg-orange-500/10 text-orange-600 border-orange-500/20'
      case 'medium': return 'bg-amber-500/10 text-amber-600 border-amber-500/20'
      case 'low': return 'bg-blue-500/10 text-blue-600 border-blue-500/20'
      default: return 'bg-gray-500/10 text-gray-600 border-gray-500/20'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted': return <CheckCircle2 className="h-4 w-4 text-emerald-600" />
      case 'in_progress': return <Clock className="h-4 w-4 text-blue-600" />
      case 'timeout': return <AlertTriangle className="h-4 w-4 text-amber-600" />
      case 'disqualified': return <XCircle className="h-4 w-4 text-red-600" />
      default: return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(2)} MB`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-sm text-muted-foreground">Loading proctoring data...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-border bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.12),transparent_30%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--accent-soft)))] p-6 md:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Admin</p>
        <h1 className="mt-3 text-3xl font-extrabold">Exam Proctoring Dashboard</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-foreground/70">
          Review exam sessions, violations, and screen recordings for all aspirants.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-[2rem] border bg-white p-6 shadow-sm dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-primary/10 p-3 text-primary">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Sessions</p>
              <p className="text-2xl font-bold">{sessions.length}</p>
            </div>
          </div>
        </Card>

        <Card className="rounded-[2rem] border bg-white p-6 shadow-sm dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-red-500/10 p-3 text-red-600">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Violations</p>
              <p className="text-2xl font-bold">{violations.length}</p>
            </div>
          </div>
        </Card>

        <Card className="rounded-[2rem] border bg-white p-6 shadow-sm dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-blue-500/10 p-3 text-blue-600">
              <Video className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Recordings</p>
              <p className="text-2xl font-bold">{recordings.length}</p>
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="sessions" className="space-y-6">
        <TabsList className="rounded-2xl bg-background p-1">
          <TabsTrigger value="sessions" className="rounded-xl">Exam Sessions</TabsTrigger>
          <TabsTrigger value="violations">Violations</TabsTrigger>
          <TabsTrigger value="recordings">Recordings</TabsTrigger>
        </TabsList>

        <TabsContent value="sessions" className="space-y-4">
          <Card className="rounded-[2rem] border bg-white p-6 shadow-sm dark:bg-slate-900">
            <div className="space-y-4">
              {sessions.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">No exam sessions yet.</p>
              ) : (
                sessions.map((session) => (
                  <div key={session.id} className="rounded-2xl border border-border p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(session.status)}
                          <p className="font-semibold">{session.exam_type}</p>
                          <Badge variant="outline" className="text-xs">
                            {session.academic_year}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Session ID: {session.id.slice(0, 8)}...
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Started: {new Date(session.started_at).toLocaleString()}
                        </p>
                        {session.submitted_at && (
                          <p className="text-xs text-muted-foreground">
                            Submitted: {new Date(session.submitted_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        {session.score !== null && (
                          <div>
                            <p className="text-2xl font-bold text-primary">
                              {session.percentage?.toFixed(0)}%
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {session.score}/{session.total_questions} correct
                            </p>
                          </div>
                        )}
                        <p className="mt-2 text-xs text-muted-foreground">
                          Duration: {formatDuration(session.time_spent_seconds)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="violations" className="space-y-4">
          <Card className="rounded-[2rem] border bg-white p-6 shadow-sm dark:bg-slate-900">
            <div className="space-y-3">
              {violations.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">No violations recorded yet.</p>
              ) : (
                violations.map((violation) => (
                  <div key={violation.id} className="rounded-2xl border border-border p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge className={getSeverityColor(violation.severity)}>
                            {violation.severity}
                          </Badge>
                          <p className="font-semibold text-sm">
                            {violation.violation_type.replace(/_/g, ' ').toUpperCase()}
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground">{violation.details}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(violation.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="recordings" className="space-y-4">
          <Card className="rounded-[2rem] border bg-white p-6 shadow-sm dark:bg-slate-900">
            <div className="space-y-3">
              {recordings.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">No recordings available yet.</p>
              ) : (
                recordings.map((recording) => (
                  <div key={recording.id} className="rounded-2xl border border-border p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Video className="h-4 w-4 text-primary" />
                          <p className="font-semibold text-sm">Screen Recording</p>
                          <Badge variant="outline" className="text-xs">
                            {recording.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Duration: {formatDuration(recording.recording_duration_seconds)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Size: {formatFileSize(recording.file_size_bytes)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Expires: {new Date(recording.expires_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-xl"
                          onClick={() => window.open(recording.recording_url, '_blank')}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-xl"
                          onClick={() => {
                            const a = document.createElement('a')
                            a.href = recording.recording_url
                            a.download = `exam-recording-${recording.id}.webm`
                            a.click()
                          }}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}