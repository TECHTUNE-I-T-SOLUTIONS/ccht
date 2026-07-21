'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { CheckCircle, XCircle, Clock, ArrowLeft, Loader2, User, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

type SelectedCourse = {
  id: string
  student_id: string
  course_id: string
  enrollment_id: string
  status: 'pending' | 'approved' | 'rejected'
  review_notes?: string
  reviewed_at?: string
  created_at: string
  course?: {
    code: string
    title: string
    credit_units: number
    level: string
    semester: number
    program?: {
      title: string
    }
  }
}

type StudentData = {
  id: string
  first_name: string
  last_name: string
  email: string
  student_profiles?: {
    matric_number: string
    current_level: string
  }
}

export default function StudentCourseRegistrationsPage() {
  const params = useParams()
  const router = useRouter()
  const studentId = params.studentId as string
  const [registrations, setRegistrations] = useState<SelectedCourse[]>([])
  const [student, setStudent] = useState<StudentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [processing, setProcessing] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [studentId])

  const loadData = async () => {
    setLoading(true)
    try {
      const [studentRes, registrationsRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('*, student_profiles(matric_number, current_level)')
          .eq('id', studentId)
          .single(),
        supabase
          .from('selected_courses')
          .select(`
            *,
            course:courses(
              code,
              title,
              credit_units,
              level,
              semester,
              program:programs(title)
            )
          `)
          .eq('student_id', studentId)
          .order('created_at', { ascending: false })
      ])

      if (studentRes.error) throw studentRes.error
      if (registrationsRes.error) throw registrationsRes.error

      setStudent(studentRes.data)
      setRegistrations(registrationsRes.data || [])
    } catch (error) {
      console.error('Failed to load data:', error)
      toast.error('Failed to load student data')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id: string) => {
    try {
      const { error } = await supabase
        .from('selected_courses')
        .update({ 
          status: 'approved',
          reviewed_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error
      toast.success('Course registration approved')
      loadData()
    } catch (error) {
      console.error('Failed to approve:', error)
      toast.error('Failed to approve registration')
    }
  }

  const handleReject = async (id: string) => {
    const notes = prompt('Enter rejection reason (optional):')
    if (notes === null) return

    try {
      const { error } = await supabase
        .from('selected_courses')
        .update({ 
          status: 'rejected',
          review_notes: notes,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error
      toast.success('Course registration rejected')
      loadData()
    } catch (error) {
      console.error('Failed to reject:', error)
      toast.error('Failed to reject registration')
    }
  }

  const handleBulkApprove = async () => {
    if (selectedIds.size === 0) {
      toast.error('No courses selected')
      return
    }

    setProcessing(true)
    try {
      const { error } = await supabase
        .from('selected_courses')
        .update({ 
          status: 'approved',
          reviewed_at: new Date().toISOString()
        })
        .in('id', Array.from(selectedIds))

      if (error) throw error
      toast.success(`${selectedIds.size} course(s) approved`)
      setSelectedIds(new Set())
      loadData()
    } catch (error) {
      console.error('Failed to bulk approve:', error)
      toast.error('Failed to approve courses')
    } finally {
      setProcessing(false)
    }
  }

  const handleBulkReject = async () => {
    if (selectedIds.size === 0) {
      toast.error('No courses selected')
      return
    }

    const notes = prompt('Enter rejection reason (optional):')
    if (notes === null) return

    setProcessing(true)
    try {
      const { error } = await supabase
        .from('selected_courses')
        .update({ 
          status: 'rejected',
          review_notes: notes,
          reviewed_at: new Date().toISOString()
        })
        .in('id', Array.from(selectedIds))

      if (error) throw error
      toast.success(`${selectedIds.size} course(s) rejected`)
      setSelectedIds(new Set())
      loadData()
    } catch (error) {
      console.error('Failed to bulk reject:', error)
      toast.error('Failed to reject courses')
    } finally {
      setProcessing(false)
    }
  }

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const toggleSelectAll = () => {
    const pendingRegistrations = registrations.filter(r => r.status === 'pending')
    if (selectedIds.size === pendingRegistrations.length && pendingRegistrations.length > 0) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(pendingRegistrations.map(r => r.id)))
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"><CheckCircle className="h-3 w-3 mr-1" /> Approved</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"><XCircle className="h-3 w-3 mr-1" /> Rejected</Badge>
      default:
        return <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>
    }
  }

  const pendingCount = registrations.filter(r => r.status === 'pending').length

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Course Registrations</h1>
          <p className="mt-1 text-sm text-muted-foreground">Review and approve student course registrations</p>
        </div>
      </div>

      {/* Student Info Card */}
      {student && (
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-primary/10 p-4 text-primary">
              <User className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold">{student.first_name} {student.last_name}</h3>
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-semibold">{student.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Matric Number</p>
                  <p className="font-semibold">{student.student_profiles?.matric_number || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Current Level</p>
                  <p className="font-semibold">{student.student_profiles?.current_level || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Courses</p>
                  <p className="font-semibold">{registrations.length}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Course Registrations */}
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {pendingCount > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <span className="text-yellow-600 font-semibold">{pendingCount} pending</span>
              </div>
            )}
          </div>
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleBulkApprove}
                disabled={processing}
                className="text-emerald-600 hover:text-emerald-700"
              >
                {processing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                Approve Selected ({selectedIds.size})
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleBulkReject}
                disabled={processing}
                className="text-red-600 hover:text-red-700"
              >
                {processing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" />}
                Reject Selected
              </Button>
            </div>
          )}
        </div>

        {registrations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No course registrations found</div>
        ) : (
          <>
            {/* Mobile: Card layout */}
            <div className="grid gap-4 md:hidden">
              <div className="flex items-center gap-2 mb-2">
                <Checkbox
                  checked={selectedIds.size === registrations.filter(r => r.status === 'pending').length && registrations.filter(r => r.status === 'pending').length > 0}
                  onCheckedChange={toggleSelectAll}
                />
                <span className="text-sm text-muted-foreground">Select All Pending</span>
              </div>
              {registrations.map((reg) => (
                <Card key={reg.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {reg.status === 'pending' && (
                        <Checkbox
                          checked={selectedIds.has(reg.id)}
                          onCheckedChange={() => toggleSelect(reg.id)}
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-semibold">{reg.course?.code}</p>
                          <p className="text-sm text-muted-foreground">{reg.course?.title}</p>
                        </div>
                        {getStatusBadge(reg.status)}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                        <div>
                          <p className="text-muted-foreground">Level</p>
                          <p className="font-medium">{reg.course?.level}L</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Semester</p>
                          <p className="font-medium">{reg.course?.semester}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Credits</p>
                          <p className="font-medium">{reg.course?.credit_units}</p>
                        </div>
                      </div>
                      {reg.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApprove(reg.id)}
                            className="flex-1 text-emerald-600 hover:text-emerald-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReject(reg.id)}
                            className="flex-1 text-red-600 hover:text-red-700"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                      {reg.review_notes && (
                        <p className="text-xs text-muted-foreground mt-2">Note: {reg.review_notes}</p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Desktop: Table layout */}
            <div className="hidden md:block rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedIds.size === registrations.filter(r => r.status === 'pending').length && registrations.filter(r => r.status === 'pending').length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Semester</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registrations.map((reg) => (
                    <TableRow key={reg.id}>
                      <TableCell>
                        {reg.status === 'pending' && (
                          <Checkbox
                            checked={selectedIds.has(reg.id)}
                            onCheckedChange={() => toggleSelect(reg.id)}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{reg.course?.code}</p>
                          <p className="text-sm text-muted-foreground">{reg.course?.title}</p>
                        </div>
                      </TableCell>
                      <TableCell>{reg.course?.level}L</TableCell>
                      <TableCell>{reg.course?.semester}</TableCell>
                      <TableCell>{reg.course?.credit_units}</TableCell>
                      <TableCell>{getStatusBadge(reg.status)}</TableCell>
                      <TableCell className="text-right">
                        {reg.status === 'pending' && (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleApprove(reg.id)}
                              className="text-emerald-600 hover:text-emerald-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReject(reg.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
                        {reg.review_notes && (
                          <p className="text-xs text-muted-foreground text-right">{reg.review_notes}</p>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
