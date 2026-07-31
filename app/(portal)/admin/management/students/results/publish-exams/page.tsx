'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowLeft, Loader2, Search, Plus, CheckCircle, X, Eye, EyeOff, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useIsMobile } from '@/hooks/use-mobile'
import { createClient } from '@/lib/supabase/client'
import { wrapEmailContent } from '@/lib/services/email-templates'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ResultPublication = any

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Enrollment = any

type Session = {
  id: string
  name: string
}

type Semester = {
  id: string
  semester_name: string
}

export default function PublishExamsPage() {
  const supabase = createClient()

  const [publications, setPublications] = useState<ResultPublication[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const isMobile = useIsMobile()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [bulkPublishDialogOpen, setBulkPublishDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [publicationToDelete, setPublicationToDelete] = useState<any>(null)
  const [bulkPublishing, setBulkPublishing] = useState(false)
  const [selectedEnrollments, setSelectedEnrollments] = useState<string[]>([])
  const [newPublication, setNewPublication] = useState({
    enrollment_id: '',
    session_id: '',
    semester_id: '',
    publication_status: 'published',
    notes: ''
  })
  const [bulkPublication, setBulkPublication] = useState({
    session_id: '',
    semester_id: '',
    publication_status: 'published',
    notes: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load publications with relations - publisher goes through admin_profiles
      const { data: publicationsData, error: publicationsError } = await supabase
        .from('result_publications')
        .select(`
          *,
          enrollment:enrollments(
            id,
            student_id,
            student:profiles(first_name, last_name, email, student_profiles(matric_number)),
            program:programs(title),
            selected_courses:selected_courses(
              course:courses(code, title)
            )
          ),
          session:academic_sessions(name),
          semester:academic_semesters(semester_name),
          publisher:admin_profiles!result_publications_published_by_fkey(profile_id, profiles(first_name, last_name))
        `)
        .order('published_at', { ascending: false })

      if (publicationsError) {
        console.error('Error loading publications with explicit FK:', publicationsError)
        // Fallback: try without explicit FK
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('result_publications')
          .select(`
            *,
            enrollment:enrollments(
              student:profiles(first_name, last_name, email, student_profiles(matric_number)),
              program:programs(title),
              selected_courses:selected_courses(
                course:courses(code, title)
              )
            ),
            session:academic_sessions(name),
            semester:academic_semesters(semester_name),
            publisher:admin_profiles(profile_id, profiles(first_name, last_name))
          `)
          .order('published_at', { ascending: false })
        
        if (fallbackError) throw fallbackError
        setPublications(fallbackData || [])
      } else {
        setPublications(publicationsData || [])
      }

      // Load dropdown data
      const [enrollmentsRes, sessionsRes, semestersRes] = await Promise.all([
        supabase
          .from('enrollments')
          .select(`
            id,
            student_id,
            program_id,
            student:profiles!enrollments_student_id_fkey(first_name, last_name, email, student_profiles(matric_number)),
            program:programs(title),
            selected_courses:selected_courses(
              course:courses(code, title)
            )
          `)
          .order('created_at', { ascending: false }),
        supabase.from('academic_sessions').select('id, name').order('name'),
        supabase.from('academic_semesters').select('id, semester_name').order('semester_name')
      ])

      if (enrollmentsRes.error) {
        console.error('Error loading enrollments:', enrollmentsRes.error)
        toast.error('Failed to load enrollments')
      }
      if (sessionsRes.error) throw sessionsRes.error
      if (semestersRes.error) throw semestersRes.error

      setEnrollments(enrollmentsRes.data || [])
      setSessions(sessionsRes.data || [])
      setSemesters(semestersRes.data || [])
    } catch (error) {
      console.error('Failed to load data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const sendEmailToStudent = async (student: any, program: any, courseCodes: string) => {
    if (!student?.email) return
    try {
      const content = `
        <div class="greeting">Dear ${student.first_name} ${student.last_name},</div>
        <div class="message">
          Your final exam results have been <strong style="color: #059669;">published</strong> on the student portal.
        </div>
        <div class="info-box">
          <h3>📋 Publication Details</h3>
          <ul>
            <li><strong>Student:</strong> ${student.first_name} ${student.last_name}</li>
            <li><strong>Matric Number:</strong> ${student.student_profiles?.matric_number || 'N/A'}</li>
            <li><strong>Program:</strong> ${program?.title || 'N/A'}</li>
            ${courseCodes ? `<li><strong>Courses:</strong> ${courseCodes}</li>` : ''}
            <li><strong>Status:</strong> <span style="color: #059669; font-weight: bold;">✓ Published</span></li>
          </ul>
        </div>
        <div class="message">
          Please log in to the student portal to view your complete results.
        </div>
        <div class="message">
          <a href="https://newccht.vercel.app/login" class="button">🚀 Access Student Portal</a>
        </div>
        <div class="message">
          If you have any questions or concerns about your results, please contact the Academic Office.
        </div>
      `
      
      await fetch('/api/v1/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: student.email,
          subject: '📊 Your Final Exam Results Have Been Published - CCHT',
          html: wrapEmailContent(content, 'Final Exam Results Published - CCHT')
        })
      })
    } catch (emailError) {
      console.error('Failed to send email to', student.email, ':', emailError)
    }
  }

  const handleCreatePublication = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const { error } = await supabase
        .from('result_publications')
        .insert({
          enrollment_id: newPublication.enrollment_id,
          session_id: newPublication.session_id || null,
          semester_id: newPublication.semester_id || null,
          published_by: user?.id || null,
          publication_status: newPublication.publication_status,
          notes: newPublication.notes || null
        })
        .select()

      if (error) throw error

      toast.success('Result publication created successfully')
      setCreateDialogOpen(false)
      setNewPublication({
        enrollment_id: '',
        session_id: '',
        semester_id: '',
        publication_status: 'published',
        notes: ''
      })
      
      await loadData()

      // Send email notification
      if (newPublication.publication_status === 'published' && newPublication.enrollment_id) {
        const enrollment = enrollments.find((e: any) => e.id === newPublication.enrollment_id)
        if (enrollment?.student) {
          const student = enrollment.student
          const program = enrollment.program
          const courseCodes = enrollment.selected_courses?.map((sc: any) => sc.course?.[0]?.code).filter(Boolean).join(', ') || ''
          await sendEmailToStudent(student, program, courseCodes)
        }
      }
    } catch (error) {
      console.error('Failed to create publication:', error)
      toast.error('Failed to create publication')
    }
  }

  const handleBulkPublish = async () => {
    if (selectedEnrollments.length === 0) {
      toast.error('Please select at least one enrollment')
      return
    }

    try {
      setBulkPublishing(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      const publicationsToInsert = selectedEnrollments.map((enrollmentId: string) => ({
        enrollment_id: enrollmentId,
        session_id: bulkPublication.session_id || null,
        semester_id: bulkPublication.semester_id || null,
        published_by: user?.id || null,
        publication_status: bulkPublication.publication_status,
        notes: bulkPublication.notes || null
      }))

      const { error } = await supabase
        .from('result_publications')
        .insert(publicationsToInsert)

      if (error) throw error

      toast.success(`Results published for ${selectedEnrollments.length} student(s) successfully`)
      setBulkPublishDialogOpen(false)
      setSelectedEnrollments([])
      setBulkPublication({
        session_id: '',
        semester_id: '',
        publication_status: 'published',
        notes: ''
      })
      
      await loadData()

      if (bulkPublication.publication_status === 'published') {
        const emailPromises = selectedEnrollments.map(async (enrollmentId: string) => {
          const enrollment = enrollments.find((e: any) => e.id === enrollmentId)
          if (enrollment?.student) {
            const student = enrollment.student
            const program = enrollment.program
            const courseCodes = enrollment.selected_courses?.map((sc: any) => sc.course?.[0]?.code).filter(Boolean).join(', ') || ''
            await sendEmailToStudent(student, program, courseCodes)
          }
        })
        await Promise.allSettled(emailPromises)
      }
    } catch (error) {
      console.error('Failed to bulk publish:', error)
      toast.error('Failed to bulk publish results')
    } finally {
      setBulkPublishing(false)
    }
  }

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'published' ? 'unpublished' : 'published'
      const { error } = await supabase
        .from('result_publications')
        .update({ publication_status: newStatus })
        .eq('id', id)

      if (error) throw error
      toast.success(`Result ${newStatus === 'published' ? 'published' : 'unpublished'} successfully`)
      await loadData()
    } catch (error) {
      console.error('Failed to toggle status:', error)
      toast.error('Failed to toggle status')
    }
  }

  const handleDeletePublication = async () => {
    if (!publicationToDelete) return

    try {
      const { error } = await supabase
        .from('result_publications')
        .delete()
        .eq('id', publicationToDelete.id)

      if (error) throw error
      toast.success('Publication deleted successfully')
      setDeleteDialogOpen(false)
      setPublicationToDelete(null)
      await loadData()
    } catch (error) {
      console.error('Failed to delete publication:', error)
      toast.error('Failed to delete publication')
    }
  }

  const toggleEnrollmentSelection = (enrollmentId: string) => {
    setSelectedEnrollments(prev =>
      prev.includes(enrollmentId)
        ? prev.filter(id => id !== enrollmentId)
        : [...prev, enrollmentId]
    )
  }

  const selectAllEnrollments = () => {
    if (selectedEnrollments.length === enrollments.length) {
      setSelectedEnrollments([])
    } else {
      setSelectedEnrollments(enrollments.map((e: any) => e.id))
    }
  }

  // Helper function to get data from publication (handles array/object/fallback)
  const getPublicationData = (pub: any) => {
    if (!pub) return { student: {}, program: {}, session: {}, semester: {}, publisher: {} }
    
    const enrollment = pub.enrollment || pub.enrollment?.[0] || {}
    const student = enrollment.student || enrollment.student?.[0] || {}
    const program = enrollment.program || enrollment.program?.[0] || {}
    const session = Array.isArray(pub.session) ? pub.session[0] : pub.session || {}
    const semester = Array.isArray(pub.semester) ? pub.semester[0] : pub.semester || {}
    
    // Publisher goes through admin_profiles -> profiles
    const publisherRaw = Array.isArray(pub.publisher) ? pub.publisher[0] : pub.publisher || {}
    // publisher.profiles is the nested profiles relation
    const publisher = publisherRaw.profiles || publisherRaw
    
    return { student, program, session, semester, publisher }
  }

  const filteredPublications = publications.filter(pub => {
    const searchLower = searchTerm.toLowerCase()
    const { student, program, session } = getPublicationData(pub)
    const enrollment = pub.enrollment || pub.enrollment?.[0] || {}
    
    const matchesSearch = 
      student?.first_name?.toLowerCase()?.includes(searchLower) ||
      student?.last_name?.toLowerCase()?.includes(searchLower) ||
      student?.student_profiles?.matric_number?.toLowerCase()?.includes(searchLower) ||
      program?.title?.toLowerCase()?.includes(searchLower) ||
      (enrollment.selected_courses?.some((sc: any) => 
        sc.course?.[0]?.code?.toLowerCase()?.includes(searchLower) ||
        sc.course?.[0]?.title?.toLowerCase()?.includes(searchLower)
      )) ||
      session?.name?.toLowerCase()?.includes(searchLower)
    
    const matchesStatus = statusFilter === 'all' || pub.publication_status === statusFilter
    return matchesSearch && matchesStatus
  }).sort((a, b) => {
    let comparison = 0
    if (sortBy === 'date') {
      comparison = new Date(a.published_at).getTime() - new Date(b.published_at).getTime()
    }
    return sortOrder === 'asc' ? comparison : -comparison
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/management/students/results">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Publish Final Exams</h1>
            <p className="mt-1 text-sm text-muted-foreground">Publish final exam results for students to view</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border border-primary hover:text-blue-700">
                <Plus className="h-4 w-4 mr-2" /> Single Publish
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-black">
              <DialogHeader>
                <DialogTitle>Publish Final Exam Results</DialogTitle>
                <DialogDescription>
                  Select the enrollment and academic details to publish results for a student.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Enrollment (Student & Course)</Label>
                  <Select
                    value={newPublication.enrollment_id}
                    onValueChange={(value) => setNewPublication({ ...newPublication, enrollment_id: value })}
                  >
                    <SelectTrigger className="w-[300px]">
                      <SelectValue placeholder="Select enrollment" />
                    </SelectTrigger>
                    <SelectContent>
                      {enrollments.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground">No enrollments found</div>
                      ) : (
                        enrollments.map((enrollment: any) => {
                          const student = enrollment.student || {}
                          const program = enrollment.program || {}
                          const matricNumber = student?.student_profiles?.matric_number || ''
                          const courseCodes = enrollment.selected_courses
                            ?.map((sc: any) => sc.course?.[0]?.code)
                            .filter(Boolean)
                            .join(', ') || ''
                          
                          const displayText = [
                            student?.first_name && student?.last_name ? `${student.first_name} ${student.last_name}` : 'Unknown Student',
                            matricNumber ? `(${matricNumber})` : '',
                            '-',
                            program?.title || 'Unknown Program',
                            courseCodes ? `(${courseCodes})` : ''
                          ].filter(Boolean).join(' ')
                          
                          return (
                            <SelectItem key={enrollment.id} value={enrollment.id}>
                              {displayText}
                            </SelectItem>
                          )
                        })
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Academic Session</Label>
                    <Select
                      value={newPublication.session_id}
                      onValueChange={(value) => setNewPublication({ ...newPublication, session_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select session" />
                      </SelectTrigger>
                      <SelectContent>
                        {sessions.map((session) => (
                          <SelectItem key={session.id} value={session.id}>
                            {session.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Semester</Label>
                    <Select
                      value={newPublication.semester_id}
                      onValueChange={(value) => setNewPublication({ ...newPublication, semester_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select semester" />
                      </SelectTrigger>
                      <SelectContent>
                        {semesters.map((semester) => (
                          <SelectItem key={semester.id} value={semester.id}>
                            {semester.semester_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Publication Status</Label>
                  <Select
                    value={newPublication.publication_status}
                    onValueChange={(value) => setNewPublication({ ...newPublication, publication_status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="unpublished">Unpublished</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Notes (Optional)</Label>
                  <Textarea
                    placeholder="Add any notes about this publication..."
                    value={newPublication.notes}
                    onChange={(e) => setNewPublication({ ...newPublication, notes: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    <X className="h-4 w-4 mr-2" /> Cancel
                  </Button>
                  <Button onClick={handleCreatePublication} className="border border-primary hover:text-blue-700 hover:shadow-lg hover:shadow-blue-600">
                    <CheckCircle className="h-4 w-4 mr-2" /> Publish
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={bulkPublishDialogOpen} onOpenChange={setBulkPublishDialogOpen}>
            <DialogTrigger asChild>
              <Button className="border border-primary hover:text-blue-700 hover:shadow-lg hover:shadow-blue-600">
                <Plus className="h-4 w-4 mr-2" /> Bulk Publish
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-black">
              <DialogHeader>
                <DialogTitle>Bulk Publish Final Exam Results</DialogTitle>
                <DialogDescription>
                  Select multiple enrollments to publish results at once. An email notification will be sent to each student.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Academic Session</Label>
                    <Select
                      value={bulkPublication.session_id}
                      onValueChange={(value) => setBulkPublication({ ...bulkPublication, session_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select session" />
                      </SelectTrigger>
                      <SelectContent>
                        {sessions.map((session) => (
                          <SelectItem key={session.id} value={session.id}>
                            {session.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Semester</Label>
                    <Select
                      value={bulkPublication.semester_id}
                      onValueChange={(value) => setBulkPublication({ ...bulkPublication, semester_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select semester" />
                      </SelectTrigger>
                      <SelectContent>
                        {semesters.map((semester) => (
                          <SelectItem key={semester.id} value={semester.id}>
                            {semester.semester_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Publication Status</Label>
                  <Select
                    value={bulkPublication.publication_status}
                    onValueChange={(value) => setBulkPublication({ ...bulkPublication, publication_status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="unpublished">Unpublished</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Notes (Optional)</Label>
                  <Textarea
                    placeholder="Add any notes about this publication..."
                    value={bulkPublication.notes}
                    onChange={(e) => setBulkPublication({ ...bulkPublication, notes: e.target.value })}
                    rows={2}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Select Enrollments ({selectedEnrollments.length} selected)</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={selectAllEnrollments}
                    >
                      {selectedEnrollments.length === enrollments.length ? 'Deselect All' : 'Select All'}
                    </Button>
                  </div>
                  <div className="max-h-60 overflow-y-auto border rounded-lg p-2 space-y-1">
                    {enrollments.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">No enrollments found</div>
                    ) : (
                      enrollments.map((enrollment: any) => {
                        const student = enrollment.student || {}
                        const program = enrollment.program || {}
                        const matricNumber = student?.student_profiles?.matric_number || ''
                        const courseCodes = enrollment.selected_courses
                          ?.map((sc: any) => sc.course?.[0]?.code)
                          .filter(Boolean)
                          .join(', ') || ''
                        
                        const displayText = [
                          student?.first_name && student?.last_name ? `${student.first_name} ${student.last_name}` : 'Unknown Student',
                          matricNumber ? `(${matricNumber})` : '',
                          '-',
                          program?.title || 'Unknown Program',
                          courseCodes ? `(${courseCodes})` : ''
                        ].filter(Boolean).join(' ')
                        
                        return (
                          <div
                            key={enrollment.id}
                            className={`flex items-center gap-3 p-2 rounded-lg border transition-colors cursor-pointer ${
                              selectedEnrollments.includes(enrollment.id)
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/40'
                            }`}
                            onClick={() => toggleEnrollmentSelection(enrollment.id)}
                          >
                            <Checkbox
                              checked={selectedEnrollments.includes(enrollment.id)}
                              onCheckedChange={() => toggleEnrollmentSelection(enrollment.id)}
                            />
                            <span className="text-sm">{displayText}</span>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setBulkPublishDialogOpen(false)}>
                    <X className="h-4 w-4 mr-2" /> Cancel
                  </Button>
                  <Button
                    onClick={handleBulkPublish}
                    disabled={bulkPublishing || selectedEnrollments.length === 0}
                    className="border border-primary hover:text-blue-700"
                  >
                    {bulkPublishing ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Publishing...</>
                    ) : (
                      <><CheckCircle className="h-4 w-4 mr-2" /> Publish {selectedEnrollments.length} Results</>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="p-6">
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by student name, matric number, course, or session..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="unpublished">Unpublished</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </Button>
          </div>
        </div>

        {filteredPublications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm || statusFilter !== 'all' ? 'No publications found matching your filters' : 'No result publications yet'}
          </div>
        ) : isMobile ? (
          <div className="space-y-4">
            {filteredPublications.map((pub) => {
              const { student, program, session, semester, publisher } = getPublicationData(pub)
              const enrollment = pub.enrollment || pub.enrollment?.[0] || {}
              
              return (
                <Card key={pub.id} className="p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">
                          {student?.first_name} {student?.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {student?.student_profiles?.matric_number || '-'}
                        </p>
                      </div>
                      {pub.publication_status === 'published' ? (
                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                          Published
                        </Badge>
                      ) : (
                        <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400">
                          Unpublished
                        </Badge>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{program?.title}</p>
                      {enrollment.selected_courses?.length > 0 && (
                        <p className="text-sm text-muted-foreground">
                          {enrollment.selected_courses.map((sc: any) => sc.course?.[0]?.code).filter(Boolean).join(', ')}
                        </p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>Session: {session?.name || '-'}</div>
                      <div>Semester: {semester?.semester_name || '-'}</div>
                      <div>Date: {new Date(pub.published_at).toLocaleDateString()}</div>
                      <div>By: {publisher?.first_name || 'N/A'} {publisher?.last_name || ''}</div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleToggleStatus(pub.id, pub.publication_status)}
                      >
                        {pub.publication_status === 'published' ? (
                          <><EyeOff className="h-4 w-4 mr-2" /> Unpublish</>
                        ) : (
                          <><Eye className="h-4 w-4 mr-2" /> Publish</>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { setPublicationToDelete(pub); setDeleteDialogOpen(true); }}
                        className="text-red-600 hover:text-red-700 hover:border-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Matric No</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Session</TableHead>
                  <TableHead>Semester</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Published Date</TableHead>
                  <TableHead>Published By</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPublications.map((pub) => {
                  const { student, program, session, semester, publisher } = getPublicationData(pub)
                  const enrollment = pub.enrollment || pub.enrollment?.[0] || {}
                  
                  return (
                    <TableRow key={pub.id}>
                      <TableCell>
                        <p className="font-medium">
                          {student?.first_name} {student?.last_name}
                        </p>
                      </TableCell>
                      <TableCell>
                        {student?.student_profiles?.matric_number || '-'}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{program?.title}</p>
                          {enrollment.selected_courses?.length > 0 && (
                            <p className="text-sm text-muted-foreground">
                              {enrollment.selected_courses.map((sc: any) => sc.course?.[0]?.code).filter(Boolean).join(', ')}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{session?.name || '-'}</TableCell>
                      <TableCell>{semester?.semester_name || '-'}</TableCell>
                      <TableCell>
                        {pub.publication_status === 'published' ? (
                          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                            <CheckCircle className="h-3 w-3 mr-1" /> Published
                          </Badge>
                        ) : (
                          <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400">
                            <EyeOff className="h-3 w-3 mr-1" /> Unpublished
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(pub.published_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {publisher?.first_name || 'N/A'} {publisher?.last_name || ''}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleStatus(pub.id, pub.publication_status)}
                          >
                            {pub.publication_status === 'published' ? (
                              <><EyeOff className="h-4 w-4 mr-2" /> Unpublish</>
                            ) : (
                              <><Eye className="h-4 w-4 mr-2" /> Publish</>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => { setPublicationToDelete(pub); setDeleteDialogOpen(true); }}
                            className="text-red-600 hover:text-red-700 hover:border-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-black">
          <DialogHeader>
            <DialogTitle>Delete Publication</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this publication? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {publicationToDelete && (() => {
            const { student, program } = getPublicationData(publicationToDelete)
            return (
              <div className="space-y-4">
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
                  <h4 className="font-semibold text-red-900 dark:text-red-100 mb-2">Publication Details</h4>
                  <div className="space-y-1 text-sm text-red-800 dark:text-red-200">
                    <p><strong>Student:</strong> {student?.first_name} {student?.last_name}</p>
                    <p><strong>Matric No:</strong> {student?.student_profiles?.matric_number || 'N/A'}</p>
                    <p><strong>Program:</strong> {program?.title || 'N/A'}</p>
                    <p><strong>Status:</strong> {publicationToDelete.publication_status}</p>
                    <p><strong>Date:</strong> {new Date(publicationToDelete.published_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleDeletePublication}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Publication
                  </Button>
                </div>
              </div>
            )
          })()}
        </DialogContent>
      </Dialog>
    </div>
  )
}