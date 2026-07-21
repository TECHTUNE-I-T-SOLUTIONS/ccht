'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { PortalLayout } from '@/components/portal/portal-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Calendar, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { AcademicSessionService, AcademicSession } from '@/lib/services/academic-session.service'

export default function AcademicSessionsPage() {
  const [sessions, setSessions] = useState<AcademicSession[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingSession, setEditingSession] = useState<AcademicSession | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    starts_on: '',
    ends_on: '',
    is_current: false,
    is_active: true,
  })

  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = async () => {
    try {
      setLoading(true)
      const data = await AcademicSessionService.getAllSessions()
      setSessions(data)
    } catch (error) {
      console.error('Failed to load sessions:', error)
      toast.error('Failed to load academic sessions')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setSubmitting(true)
      
      if (editingSession) {
        // Update existing session
        await AcademicSessionService.updateSession(editingSession.id, formData)
        toast.success('Academic session updated successfully')
      } else {
        // Create new session
        await AcademicSessionService.createSession(formData)
        toast.success('Academic session created successfully')
      }
      
      await loadSessions()
      handleCloseModal()
    } catch (error) {
      console.error('Failed to save session:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save academic session')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (session: AcademicSession) => {
    setEditingSession(session)
    setFormData({
      name: session.name,
      starts_on: session.starts_on || '',
      ends_on: session.ends_on || '',
      is_current: session.is_current,
      is_active: session.is_active,
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this academic session? This action cannot be undone.')) {
      return
    }

    try {
      await AcademicSessionService.deleteSession(id)
      toast.success('Academic session deleted successfully')
      await loadSessions()
    } catch (error) {
      console.error('Failed to delete session:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete academic session')
    }
  }

  const handleSetCurrent = async (id: string) => {
    try {
      await AcademicSessionService.setCurrentSession(id)
      toast.success('Current session updated successfully')
      await loadSessions()
    } catch (error) {
      console.error('Failed to set current session:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to set current session')
    }
  }

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await AcademicSessionService.toggleSessionStatus(id, !currentStatus)
      toast.success(`Session ${!currentStatus ? 'activated' : 'deactivated'} successfully`)
      await loadSessions()
    } catch (error) {
      console.error('Failed to toggle session status:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to toggle session status')
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingSession(null)
    setFormData({
      name: '',
      starts_on: '',
      ends_on: '',
      is_current: false,
      is_active: true,
    })
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set'
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <PortalLayout role="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Academic Sessions</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Manage academic sessions for the admission system
            </p>
          </div>
          <Button onClick={() => setShowModal(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Session
          </Button>
        </div>

        {/* Sessions List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="rounded-2xl border border-border bg-background p-12 text-center">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No academic sessions</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Get started by creating your first academic session.
            </p>
            <Button onClick={() => setShowModal(true)} className="mt-4 gap-2">
              <Plus className="h-4 w-4" />
              Add Session
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {sessions.map((session) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="rounded-2xl border border-border bg-background p-6 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold">{session.name}</h3>
                        {session.is_current && (
                          <Badge variant="default" className="gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Current
                          </Badge>
                        )}
                        {!session.is_active && (
                          <Badge variant="secondary" className="gap-1">
                            <XCircle className="h-3 w-3" />
                            Inactive
                          </Badge>
                        )}
                      </div>
                      
                      <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>Starts: {formatDate(session.starts_on)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>Ends: {formatDate(session.ends_on)}</span>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {!session.is_current && session.is_active && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSetCurrent(session.id)}
                            className="gap-1"
                          >
                            <CheckCircle className="h-3 w-3" />
                            Set as Current
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleToggleStatus(session.id, session.is_active)}
                          className="gap-1"
                        >
                          {session.is_active ? (
                            <>
                              <XCircle className="h-3 w-3" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-3 w-3" />
                              Activate
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEdit(session)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(session.id)}
                        disabled={session.is_current}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Create/Edit Modal */}
        <AnimatePresence>
          {showModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
              onClick={handleCloseModal}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-xl"
              >
                <h2 className="text-2xl font-bold">
                  {editingSession ? 'Edit Academic Session' : 'Create Academic Session'}
                </h2>
                
                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Session Name <span className="text-destructive">*</span>
                    </label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., 2025/2026"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Start Date
                    </label>
                    <Input
                      type="date"
                      value={formData.starts_on}
                      onChange={(e) => setFormData({ ...formData, starts_on: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      End Date
                    </label>
                    <Input
                      type="date"
                      value={formData.ends_on}
                      onChange={(e) => setFormData({ ...formData, ends_on: e.target.value })}
                    />
                  </div>

                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.is_current}
                        onChange={(e) => setFormData({ ...formData, is_current: e.target.checked })}
                        className="h-4 w-4 rounded border-border"
                      />
                      <span className="text-sm font-medium">Set as Current</span>
                    </label>

                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="h-4 w-4 rounded border-border"
                      />
                      <span className="text-sm font-medium">Active</span>
                    </label>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCloseModal}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={submitting} className="flex-1">
                      {submitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : editingSession ? (
                        'Update Session'
                      ) : (
                        'Create Session'
                      )}
                    </Button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PortalLayout>
  )
}
