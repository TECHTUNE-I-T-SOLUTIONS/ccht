'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Search, CheckCircle, XCircle, Clock, Eye, Loader2 } from 'lucide-react'
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
      loadRegistrations()
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
      loadRegistrations()
    } catch (error) {
      console.error('Failed to reject:', error)
      toast.error('Failed to reject registration')
    }
  }

  const filteredRegistrations = registrations.filter(reg => {
    const matchesSearch = 
      `${reg.student?.first_name} ${reg.student?.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.student?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.student?.student_profiles?.matric_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.course?.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.course?.title?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || reg.status === statusFilter
    return matchesSearch && matchesStatus
  })

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
              placeholder="Search by student name, email, matric number, or course..."
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
        ) : filteredRegistrations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No course registrations found</div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Matric No</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRegistrations.map((reg) => (
                  <TableRow key={reg.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{reg.student?.first_name} {reg.student?.last_name}</p>
                        <p className="text-sm text-muted-foreground">{reg.student?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{reg.student?.student_profiles?.matric_number || '-'}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{reg.course?.code}</p>
                        <p className="text-sm text-muted-foreground">{reg.course?.title}</p>
                      </div>
                    </TableCell>
                    <TableCell>{reg.course?.level}L</TableCell>
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
        )}
      </Card>
    </div>
  )
}
