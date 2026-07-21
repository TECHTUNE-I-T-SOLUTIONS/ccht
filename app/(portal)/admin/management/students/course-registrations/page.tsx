'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Search, CheckCircle, XCircle, Clock, Eye, Loader2, User, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type SelectedCourse = {
  id: string
  student_id: string
  course_id: string
  enrollment_id: string
  status: 'pending' | 'approved' | 'rejected'
  review_notes?: string
  reviewed_at?: string
  created_at: string
  student?: {
    first_name: string
    last_name: string
    email: string
    student_profiles?: {
      matric_number: string
      current_level: string
    }
  }
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

export default function CourseRegistrationsPage() {
  const [registrations, setRegistrations] = useState<SelectedCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadRegistrations()
  }, [])

  const loadRegistrations = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('selected_courses')
        .select(`
          *,
          student:profiles(
            first_name,
            last_name,
            email,
            student_profiles(
              matric_number,
              current_level
            )
          ),
          course:courses(
            code,
            title,
            credit_units,
            level,
            semester,
            program:programs(title)
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setRegistrations(data || [])
    } catch (error) {
      console.error('Failed to load registrations:', error)
      toast.error('Failed to load course registrations')
    } finally {
      setLoading(false)
    }
  }

  // Group registrations by student
  const groupedByStudent = registrations.reduce((acc, reg) => {
    const studentId = reg.student_id
    if (!acc[studentId]) {
      acc[studentId] = {
        student: reg.student,
        student_id: reg.student_id,
        registrations: []
      }
    }
    acc[studentId].registrations.push(reg)
    return acc
  }, {} as Record<string, { student: any; student_id: string; registrations: SelectedCourse[] }>)

  const studentsArray = Object.values(groupedByStudent)

  const filteredStudents = studentsArray.filter(({ student, registrations }) => {
    const matchesSearch = 
      `${student?.first_name} ${student?.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student?.student_profiles?.matric_number?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || 
      registrations.some(reg => reg.status === statusFilter)
    
    return matchesSearch && matchesStatus
  })

  const getStudentStatus = (registrations: SelectedCourse[]) => {
    const pendingCount = registrations.filter(r => r.status === 'pending').length
    const approvedCount = registrations.filter(r => r.status === 'approved').length
    const rejectedCount = registrations.filter(r => r.status === 'rejected').length
    
    if (pendingCount > 0) return { status: 'pending', count: pendingCount }
    if (approvedCount > 0 && rejectedCount === 0) return { status: 'approved', count: approvedCount }
    if (rejectedCount > 0 && approvedCount === 0) return { status: 'rejected', count: rejectedCount }
    return { status: 'mixed', count: registrations.length }
  }

  const getStatusBadge = (status: string, count?: number) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"><CheckCircle className="h-3 w-3 mr-1" /> {count || 'Approved'}</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"><XCircle className="h-3 w-3 mr-1" /> {count || 'Rejected'}</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"><Clock className="h-3 w-3 mr-1" /> {count} Pending</Badge>
      default:
        return <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400">{count} Mixed</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Course Registrations</h1>
          <p className="mt-1 text-sm text-muted-foreground">Review and approve student course registrations</p>
        </div>
      </div>

      <Card className="p-6">
        <div className="mb-4 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by student name, email, or matric number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No course registrations found</div>
        ) : (
          <>
            {/* Mobile: Card layout */}
            <div className="grid gap-4 md:hidden">
              {filteredStudents.map(({ student, student_id, registrations }) => {
                const { status, count } = getStudentStatus(registrations)
                return (
                  <Card key={student_id} className="p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors" onClick={() => router.push(`/admin/management/students/course-registrations/${student_id}`)}>
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-primary/10 p-3 text-primary">
                        <User className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold truncate">{student?.first_name} {student?.last_name}</h3>
                          {getStatusBadge(status, count)}
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">{student?.email}</p>
                        <p className="text-sm text-muted-foreground mb-2">Matric: {student?.student_profiles?.matric_number || 'N/A'}</p>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">{registrations.length} courses</p>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>

            {/* Desktop: Table layout */}
            <div className="hidden md:block rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Matric No</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Courses</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map(({ student, student_id, registrations }) => {
                    const { status, count } = getStudentStatus(registrations)
                    return (
                      <TableRow key={student_id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{student?.first_name} {student?.last_name}</p>
                            <p className="text-sm text-muted-foreground">{student?.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>{student?.student_profiles?.matric_number || '-'}</TableCell>
                        <TableCell>{student?.student_profiles?.current_level || 'N/A'}</TableCell>
                        <TableCell>{registrations.length} courses</TableCell>
                        <TableCell>{getStatusBadge(status, count)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/admin/management/students/course-registrations/${student_id}`)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
