'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Mail, Send, Users, GraduationCap, UserCheck, Shield, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

type User = {
  id: string
  email: string
  first_name: string
  last_name: string
  role: string
}

type Template = {
  value: string
  label: string
  category: string
}

export default function SendEmailPage() {
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [emailType, setEmailType] = useState<'individual' | 'multiple'>('individual')
  const [recipientEmail, setRecipientEmail] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [customSubject, setCustomSubject] = useState('')
  const [customMessage, setCustomMessage] = useState('')
  const [activeTab, setActiveTab] = useState('students')

  const templates: Template[] = [
    // Student templates
    { value: 'student.welcome', label: 'Welcome Email', category: 'student' },
    { value: 'student.result_published', label: 'Result Published', category: 'student' },
    { value: 'student.course_registration', label: 'Course Registration', category: 'student' },
    { value: 'student.fee_notification', label: 'Fee Notification', category: 'student' },
    { value: 'student.password_reset', label: 'Password Reset', category: 'student' },
    // Lecturer templates
    { value: 'lecturer.welcome', label: 'Welcome Email', category: 'lecturer' },
    { value: 'lecturer.password_reset', label: 'Password Reset', category: 'lecturer' },
    // Admin templates
    { value: 'admin.welcome', label: 'Welcome Email', category: 'admin' },
    { value: 'admin.password_reset', label: 'Password Reset', category: 'admin' },
    { value: 'admin.new_user_notification', label: 'New User Notification', category: 'admin' },
    // Aspirant templates
    { value: 'aspirant.application_received', label: 'Application Received', category: 'aspirant' },
    { value: 'aspirant.status_update', label: 'Status Update', category: 'aspirant' },
    { value: 'aspirant.document_update', label: 'Document Update', category: 'aspirant' },
    { value: 'aspirant.payment_receipt', label: 'Payment Receipt', category: 'aspirant' },
    { value: 'aspirant.admitted', label: 'Admission Letter', category: 'aspirant' },
    { value: 'aspirant.migrated_to_student', label: 'Migrated to Student', category: 'aspirant' },
    // General templates
    { value: 'announcement', label: 'Announcement', category: 'general' },
    { value: 'event_notification', label: 'Event Notification', category: 'general' },
  ]

  useEffect(() => {
    loadUsers()
  }, [activeTab])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      let query = supabase.from('profiles').select('id, email, first_name, last_name, role')

      if (activeTab === 'students') {
        query = query.eq('role', 'student')
      } else if (activeTab === 'lecturers') {
        query = query.eq('role', 'lecturer')
      } else if (activeTab === 'admins') {
        query = query.eq('role', 'admin')
      } else if (activeTab === 'aspirants') {
        query = query.eq('role', 'aspirant')
      }

      const { data, error } = await query.order('first_name')

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Failed to load users:', error)
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(users.map(u => u.id))
    }
  }

  const handleToggleUser = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const handleSendEmail = async () => {
    try {
      setSending(true)

      if (emailType === 'individual') {
        if (!recipientEmail || !customSubject) {
          toast.error('Please fill in all required fields')
          return
        }

        const response = await fetch('/api/v1/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: recipientEmail,
            subject: customSubject,
            html: customMessage || '<p>No message content</p>',
          }),
        })

        if (!response.ok) throw new Error('Failed to send email')
        toast.success('Email sent successfully!')
        setRecipientEmail('')
        setCustomSubject('')
        setCustomMessage('')
      } else {
        if (selectedUsers.length === 0) {
          toast.error('Please select at least one recipient')
          return
        }

        if (!selectedTemplate && !customSubject) {
          toast.error('Please select a template or enter a custom subject')
          return
        }

        const selectedUsersList = users.filter(u => selectedUsers.includes(u.id))

        // Send emails to all selected users
        const promises = selectedUsersList.map(user => {
          const templateData = {
            email: user.email,
            fullName: `${user.first_name} ${user.last_name}`,
          }

          if (selectedTemplate) {
            return fetch('/api/v1/email/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                template: selectedTemplate,
                templateData,
              }),
            })
          } else {
            return fetch('/api/v1/email/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: user.email,
                subject: customSubject,
                html: customMessage || '<p>No message content</p>',
              }),
            })
          }
        })

        await Promise.all(promises)
        toast.success(`Email sent to ${selectedUsers.length} recipient(s)!`)
        setSelectedUsers([])
        setSelectedTemplate('')
        setCustomSubject('')
        setCustomMessage('')
      }
    } catch (error) {
      console.error('Failed to send email:', error)
      toast.error('Failed to send email. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'student':
        return <GraduationCap className="h-4 w-4" />
      case 'lecturer':
        return <UserCheck className="h-4 w-4" />
      case 'admin':
        return <Shield className="h-4 w-4" />
      default:
        return <Users className="h-4 w-4" />
    }
  }

  const filteredTemplates = templates.filter(t => t.category === activeTab || t.category === 'general')

  return (
    <div className="space-y-6">
      <div className="rounded-[2.5rem] border border-border bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.12),transparent_30%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--accent-soft)))] p-8 md:p-10">
        <div className="flex items-center gap-3">
          <Mail className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-3xl font-extrabold md:text-5xl">Send Email</h1>
            <p className="mt-2 text-sm text-foreground/75">Compose and send emails to students, lecturers, admins, and aspirants</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Email Composition */}
        <Card className="rounded-[2rem] border bg-white dark:bg-slate-900 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <Send className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">Compose Email</h2>
          </div>

          <div className="space-y-4">
            {/* Email Type Selection */}
            <div className="space-y-2">
              <Label>Email Type</Label>
              <Select value={emailType} onValueChange={(value: 'individual' | 'multiple') => setEmailType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individual Email</SelectItem>
                  <SelectItem value="multiple">Multiple Recipients</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {emailType === 'individual' ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="recipientEmail">Recipient Email *</Label>
                  <Input
                    id="recipientEmail"
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="recipient@example.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recipientName">Recipient Name (Optional)</Label>
                  <Input
                    id="recipientName"
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="John Doe"
                  />
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <Label>Select Recipients</Label>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="students">Students</TabsTrigger>
                    <TabsTrigger value="lecturers">Lecturers</TabsTrigger>
                    <TabsTrigger value="admins">Admins</TabsTrigger>
                    <TabsTrigger value="aspirants">Aspirants</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="template">Email Template (Optional)</Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a template or compose custom email" />
                </SelectTrigger>
                <SelectContent>
                  {filteredTemplates.map((template) => (
                    <SelectItem key={template.value} value={template.value}>
                      {template.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!selectedTemplate && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject *</Label>
                  <Input
                    id="subject"
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    placeholder="Enter email subject"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Enter your message here..."
                    rows={8}
                    required
                  />
                </div>
              </>
            )}

            {selectedTemplate && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Note:</strong> Using template "{selectedTemplate}". Template data will be automatically populated based on the selected recipients.
                </p>
              </div>
            )}

            <Button
              onClick={handleSendEmail}
              disabled={sending}
              className="w-full border border-primary hover:shadow-lg hover:shadow-blue-600"
            >
              {sending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Email
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Recipients List */}
        {emailType === 'multiple' && (
          <Card className="rounded-[2rem] border bg-white dark:bg-slate-900 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-bold">Recipients</h2>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                >
                  {selectedUsers.length === users.length ? 'Deselect All' : 'Select All'}
                </Button>
                <span className="text-sm text-muted-foreground">
                  {selectedUsers.length} selected
                </span>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No {activeTab} found
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                      selectedUsers.includes(user.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/40'
                    }`}
                    onClick={() => handleToggleUser(user.id)}
                  >
                    <Checkbox
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={() => handleToggleUser(user.id)}
                    />
                    <div className="flex items-center gap-2 text-muted-foreground">
                      {getRoleIcon(user.role)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {user.first_name} {user.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                    {selectedUsers.includes(user.id) && (
                      <CheckCircle className="h-5 w-5 text-primary" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Info Card */}
        <Card className="rounded-[2rem] border bg-blue-50 dark:bg-blue-950/20 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Email Service Information
              </h3>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Emails are sent asynchronously and won't block the application</li>
                <li>• All emails include school logo, contact info, and important links</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}