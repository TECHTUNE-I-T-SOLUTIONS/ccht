'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Search, Filter, Eye, Edit, Loader2, ArrowLeft, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Student = {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  avatar_url?: string
  studentNumber: string
  matricNumber: string
  currentLevel: string
  admissionStatus: string
  admissionSession: string
}

export default function AllStudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [levelFilter, setLevelFilter] = useState('all')
  const supabase = createClient()

  useEffect(() => {
    loadStudents()
  }, [])

  useEffect(() => {
    filterStudents()
  }, [students, searchTerm, statusFilter, levelFilter])

  const loadStudents = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('*, student_profiles(*)')
        .eq('role', 'student')
        .order('created_at', { ascending: false })

      if (error) throw error

      const studentsData = data.map((item: any) => {
        const studentProfile = item.student_profiles || {}
        return {
          id: item.id,
          firstName: item.first_name,
          lastName: item.last_name,
          email: item.email,
          phone: item.phone || 'N/A',
          avatar_url: item.avatar_url,
          studentNumber: studentProfile.student_number || 'N/A',
          matricNumber: studentProfile.matric_number || 'N/A',
          currentLevel: studentProfile.current_level || 'N/A',
          admissionStatus: studentProfile.admission_status || 'active',
          admissionSession: studentProfile.admission_session || 'N/A',
        }
      })

      setStudents(studentsData)
    } catch (error) {
      console.error('Failed to load students:', error)
      toast.error('Failed to load students')
    } finally {
      setLoading(false)
    }
  }

  const filterStudents = () => {
    let filtered = students

    if (searchTerm) {
      filtered = filtered.filter(student =>
        `${student.firstName} ${student.lastName} ${student.email} ${student.studentNumber} ${student.matricNumber}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(student => student.admissionStatus === statusFilter)
    }

    if (levelFilter !== 'all') {
      filtered = filtered.filter(student => student.currentLevel === levelFilter)
    }

    setFilteredStudents(filtered)
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
      inactive: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
      on_probation: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
      graduated: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      suspended: 'bg-red-500/10 text-red-600 border-red-500/20',
      withdrawn: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
    }
    return colors[status] || 'bg-gray-500/10 text-gray-600 border-gray-500/20'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/management/students">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">All Students</h1>
          <p className="mt-1 text-sm text-muted-foreground">View and manage all students</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            <Users className="h-3 w-3 mr-1" />
            {filteredStudents.length} Students
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="graduated">Graduated</SelectItem>
              <SelectItem value="withdrawn">Withdrawn</SelectItem>
            </SelectContent>
          </Select>
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="Filter by level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="100">100 Level</SelectItem>
              <SelectItem value="200">200 Level</SelectItem>
              <SelectItem value="300">300 Level</SelectItem>
              <SelectItem value="400">400 Level</SelectItem>
              <SelectItem value="500">500 Level</SelectItem>
              <SelectItem value="600">600 Level</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Students Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredStudents.length === 0 ? (
        <Card className="p-12 text-center">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No students found</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredStudents.map((student) => (
            <Card key={student.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3 mb-3">
                {student.avatar_url && student.avatar_url.trim() !== '' && student.avatar_url !== 'N/A' ? (
                  <img
                    src={student.avatar_url}
                    alt={`${student.firstName} ${student.lastName}`}
                    className="h-12 w-12 rounded-full object-cover border-2 border-border"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                    {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{student.firstName} {student.lastName}</h3>
                  <p className="text-sm text-muted-foreground truncate">{student.email}</p>
                  <Badge className={getStatusColor(student.admissionStatus)} variant="outline" className="mt-1 text-xs">
                    {student.admissionStatus.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Student No:</span>
                  <span className="font-medium">{student.studentNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Matric No:</span>
                  <span className="font-medium">{student.matricNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Level:</span>
                  <span className="font-medium">{student.currentLevel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Session:</span>
                  <span className="font-medium">{student.admissionSession}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Link href={`/admin/management/students/${student.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                </Link>
                <Link href={`/admin/management/students/${student.id}/edit`} className="flex-1">
                  <Button variant="default" size="sm" className="w-full">
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
