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
import { ArrowLeft, Loader2, Search, Plus, CheckCircle, X, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { useIsMobile } from '@/hooks/use-mobile'
import { createClient } from '@/lib/supabase/client'

type ResultPublication = {
  id: string
  enrollment_id: string
  session_id: string
  semester_id: string
  published_by: string
  publication_status: string
  published_at: string
  notes: string
  enrollment?: {
    student: {
      first_name: string
      last_name: string
      student_profiles?: {
        matric_number: string
      }[]
    }[]
    program?: {
      title: string
    }[]
    selected_courses?: {
      course: {
        code: string
        title: string
      }[]
    }[]
  }
  session?: {
    name: string
  }[]
  semester?: {
    semester_name: string
  }[]
  publisher?: {
    first_name: string
    last_name: string
  }[]
}

type Enrollment = {
  id: string
  student_id: string
  program_id: string
  student?: {
    first_name: string
    last_name: string
    student_profiles?: {
      matric_number: string
    }[]
  }[]
  program?: {
    title: string
  }[]
  selected_courses?: {
    course: {
      code: string
      title: string
    }[]
  }[]
}

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
  const [newPublication, setNewPublication] = useState({
    enrollment_id: '',
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
      // Load publications with relations
      const { data: publicationsData, error: publicationsError } = await supabase
        .from('result_publications')
        .select(`
          *,
          enrollment:enrollments(
            student:profiles(first_name, last_name, student_profiles(matric_number)),
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

      if (publicationsError) throw publicationsError
      setPublications(publicationsData || [])

      // Load dropdown data
      const [enrollmentsRes, sessionsRes, semestersRes] = await Promise.all([
        supabase
          .from('enrollments')
          .select(`
            id,
            student_id,
            program_id,
            student:profiles(first_name, last_name, student_profiles(matric_number)),
            program:programs(title),
            selected_courses:selected_courses(
              course:courses(code, title)
            )
          `)
          .order('created_at', { ascending: false }),
        supabase.from('academic_sessions').select('id, name').order('name'),
        supabase.from('academic_semesters').select('id, semester_name').order('semester_name')
      ])

      if (enrollmentsRes.error) throw enrollmentsRes.error
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
      loadData()
    } catch (error) {
      console.error('Failed to create publication:', error)
      toast.error('Failed to create publication')
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
      loadData()
    } catch (error) {
      console.error('Failed to toggle status:', error)
      toast.error('Failed to toggle status')
    }
  }

  const filteredPublications = publications.filter(pub => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = 
      pub.enrollment?.student?.[0]?.first_name?.toLowerCase().includes(searchLower) ||
      pub.enrollment?.student?.[0]?.last_name?.toLowerCase().includes(searchLower) ||
      pub.enrollment?.student?.[0]?.student_profiles?.[0]?.matric_number?.toLowerCase().includes(searchLower) ||
      pub.enrollment?.program?.[0]?.title?.toLowerCase().includes(searchLower) ||
      (pub.enrollment?.selected_courses && pub.enrollment.selected_courses.some(sc => 
        sc.course[0]?.code.toLowerCase().includes(searchLower) ||
        sc.course[0]?.title.toLowerCase().includes(searchLower)
      )) ||
      pub.session?.[0]?.name?.toLowerCase().includes(searchLower)
    
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
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="border border-primary hover:text-blue-700 hover:shadow-lg hover:shadow-blue-600">
              <Plus className="h-4 w-4 mr-2" /> Publish Results
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
                  <SelectTrigger>
                    <SelectValue placeholder="Select enrollment" />
                  </SelectTrigger>
                  <SelectContent>
                    {enrollments.map((enrollment) => (
                      <SelectItem key={enrollment.id} value={enrollment.id}>
                        {enrollment.student?.[0]?.first_name} {enrollment.student?.[0]?.last_name} 
                        {enrollment.student?.[0]?.student_profiles?.[0]?.matric_number && 
                          ` (${enrollment.student[0].student_profiles[0].matric_number})`} 
                        - {enrollment.program?.[0]?.title}
                        {enrollment.selected_courses && enrollment.selected_courses.length > 0 && (
                          <> ({enrollment.selected_courses.map(sc => sc.course[0]?.code).join(', ')})</>
                        )}
                      </SelectItem>
                    ))}
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
                <Button onClick={handleCreatePublication}>
                  <CheckCircle className="h-4 w-4 mr-2" /> Publish
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
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
            {filteredPublications.map((pub) => (
              <Card key={pub.id} className="p-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">
                        {pub.enrollment?.student?.[0]?.first_name} {pub.enrollment?.student?.[0]?.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {pub.enrollment?.student?.[0]?.student_profiles?.[0]?.matric_number || '-'}
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
                    <p className="font-medium">{pub.enrollment?.program?.[0]?.title}</p>
                    {pub.enrollment?.selected_courses && pub.enrollment.selected_courses.length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        {pub.enrollment.selected_courses.map(sc => sc.course[0]?.code).join(', ')}
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Session: {pub.session?.[0]?.name || '-'}</div>
                    <div>Semester: {pub.semester?.[0]?.semester_name || '-'}</div>
                    <div>Date: {new Date(pub.published_at).toLocaleDateString()}</div>
                    <div>By: {pub.publisher?.[0]?.first_name} {pub.publisher?.[0]?.last_name}</div>
                  </div>
                  <div className="pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => handleToggleStatus(pub.id, pub.publication_status)}
                    >
                      {pub.publication_status === 'published' ? (
                        <><EyeOff className="h-4 w-4 mr-2" /> Unpublish</>
                      ) : (
                        <><Eye className="h-4 w-4 mr-2" /> Publish</>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
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
                {filteredPublications.map((pub) => (
                  <TableRow key={pub.id}>
                    <TableCell>
                      <p className="font-medium">
                        {pub.enrollment?.student?.[0]?.first_name} {pub.enrollment?.student?.[0]?.last_name}
                      </p>
                    </TableCell>
                    <TableCell>
                      {pub.enrollment?.student?.[0]?.student_profiles?.[0]?.matric_number || '-'}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{pub.enrollment?.program?.[0]?.title}</p>
                        {pub.enrollment?.selected_courses && pub.enrollment.selected_courses.length > 0 && (
                          <p className="text-sm text-muted-foreground">
                            {pub.enrollment.selected_courses.map(sc => sc.course[0]?.code).join(', ')}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{pub.session?.[0]?.name || '-'}</TableCell>
                    <TableCell>{pub.semester?.[0]?.semester_name || '-'}</TableCell>
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
                      {pub.publisher?.[0]?.first_name} {pub.publisher?.[0]?.last_name}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleStatus(pub.id, pub.publication_status)}
                      >
                        {pub.publication_status === 'published' ? (
                          <>
                            <EyeOff className="h-4 w-4 mr-2" /> Unpublish
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4 mr-2" /> Publish
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  )
}
