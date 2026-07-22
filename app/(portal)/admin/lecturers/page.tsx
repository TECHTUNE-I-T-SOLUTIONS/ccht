'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Search, Filter, Plus, Eye, Edit, Trash2, UserCheck, Loader2 } from 'lucide-react'
import Link from 'next/link'

type Lecturer = {
  id: string
  firstName: string
  lastName: string
  email: string
  employeeNumber: string
  department: string
  specialization: string
  employmentType: string
  employmentStatus: string
  joinedAt: string
}

export default function LecturersListPage() {
  const [lecturers, setLecturers] = useState<Lecturer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [departments, setDepartments] = useState<{id: string, name: string}[]>([])
  const supabase = createClient()

  useEffect(() => {
    loadLecturers()
    loadDepartments()
  }, [])

  const loadLecturers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, teacher_profiles(*)')
        .eq('role', 'lecturer')
        .order('created_at', { ascending: false })

      if (error) throw error

      const formattedLecturers = (data || []).map((profile: any) => ({
        id: profile.id,
        firstName: profile.first_name,
        lastName: profile.last_name,
        email: profile.email,
        employeeNumber: profile.teacher_profiles?.employee_number || 'N/A',
        department: profile.teacher_profiles?.department || 'N/A',
        specialization: profile.teacher_profiles?.specialization || 'N/A',
        employmentType: profile.teacher_profiles?.employment_type || 'N/A',
        employmentStatus: profile.teacher_profiles?.employment_status || 'active',
        joinedAt: profile.teacher_profiles?.date_joined || profile.created_at,
      }))

      setLecturers(formattedLecturers)
    } catch (error) {
      console.error('Failed to load lecturers:', error)
      toast.error('Failed to load lecturers')
    } finally {
      setLoading(false)
    }
  }

  const loadDepartments = async () => {
    try {
      const { data } = await supabase.from('departments').select('id, name').order('name')
      setDepartments(data || [])
    } catch (error) {
      console.error('Failed to load departments:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this lecturer?')) return

    try {
      const { error } = await supabase.from('profiles').delete().eq('id', id)
      if (error) throw error

      toast.success('Lecturer deleted successfully')
      loadLecturers()
    } catch (error) {
      console.error('Failed to delete lecturer:', error)
      toast.error('Failed to delete lecturer')
    }
  }

  const filteredLecturers = lecturers.filter(lecturer => {
    const matchesSearch = `${lecturer.firstName} ${lecturer.lastName} ${lecturer.email} ${lecturer.employeeNumber}`.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || lecturer.employmentStatus === statusFilter
    const matchesDepartment = departmentFilter === 'all' || lecturer.department === departmentFilter
    return matchesSearch && matchesStatus && matchesDepartment
  })

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
      inactive: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
      suspended: 'bg-red-500/10 text-red-600 border-red-500/20',
    }
    return colors[status] || 'bg-gray-500/10 text-gray-600 border-gray-500/20'
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Lecturers</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage all lecturers in your institution</p>
        </div>
        <Link href="/admin/management/lecturers/add">
          <Button className="gap-2 w-full md:w-auto">
            <Plus className="h-4 w-4" />
            Add Lecturer
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search lecturers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Lecturers List */}
      <Card className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredLecturers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No lecturers found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLecturers.map((lecturer) => (
              <div key={lecturer.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-lg border border-border p-4 hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-lg">
                    {lecturer.firstName.charAt(0)}{lecturer.lastName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold">{lecturer.firstName} {lecturer.lastName}</p>
                    <p className="text-sm text-muted-foreground">{lecturer.email}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">{lecturer.department}</span>
                      {lecturer.specialization !== 'N/A' && (
                        <>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">{lecturer.specialization}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between md:justify-end gap-3">
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(lecturer.employmentStatus)}>
                      {lecturer.employmentStatus.replace('_', ' ')}
                    </Badge>
                    <span className="text-xs text-muted-foreground hidden md:inline">
                      {lecturer.employmentType.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/lecturers/${lecturer.id}`}>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href={`/admin/lecturers/${lecturer.id}/edit`}>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(lecturer.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}