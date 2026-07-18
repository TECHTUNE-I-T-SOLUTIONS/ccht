'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen, Users, FileText, Award, Search, Filter, Download, Eye, CheckCircle, XCircle, Clock, AlertCircle, TrendingUp, CalendarDays, BarChart3, GraduationCap, CreditCard, ClipboardList } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

type StudentStats = {
  total: number
  active: number
  inactive: number
  suspended: number
  graduated: number
}

type RecentStudent = {
  id: string
  firstName: string
  lastName: string
  email: string
  studentNumber: string
  matricNumber: string
  currentLevel: string
  admissionStatus: string
  enrolledAt: string
}

export default function StudentManagementPage() {
  const [stats, setStats] = useState<StudentStats>({
    total: 0,
    active: 0,
    inactive: 0,
    suspended: 0,
    graduated: 0,
  })
  const [recentStudents, setRecentStudents] = useState<RecentStudent[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStudentData()
  }, [])

  const loadStudentData = async () => {
    try {
      setLoading(true)
      const [statsRes, studentsRes] = await Promise.all([
        fetch('/api/v1/admin/management/students/stats'),
        fetch('/api/v1/admin/management/students/recent'),
      ])
      
      const statsData = await statsRes.json()
      const studentsData = await studentsRes.json()
      
      if (statsData.success) setStats(statsData.data)
      if (studentsData.success) setRecentStudents(studentsData.data)
    } catch (error) {
      console.error('Failed to load student data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
      inactive: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
      on_probation: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
      graduated: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      suspended: 'bg-red-500/10 text-red-600 border-red-500/20',
    }
    return colors[status] || 'bg-gray-500/10 text-gray-600 border-gray-500/20'
  }

  const managementSections = [
    {
      title: 'Enrollment',
      description: 'Manage student enrollment and admissions',
      icon: GraduationCap,
      color: 'bg-blue-500/10 text-blue-600',
      links: [
        { label: 'All Students', href: '/admin/students', description: 'View and manage all students' },
        { label: 'New Admissions', href: '/admin/students?status=new', description: 'Recently admitted students' },
        { label: 'Enrollment History', href: '/admin/students/history', description: 'Historical enrollment data' },
        { label: 'Transfer Students', href: '/admin/students/transfers', description: 'Manage transfer requests' },
      ],
    },
    {
      title: 'Academic Records',
      description: 'Manage academic performance and records',
      icon: FileText,
      color: 'bg-purple-500/10 text-purple-600',
      links: [
        { label: 'Academic Records', href: '/admin/students/records', description: 'View academic transcripts' },
        { label: 'Course Registration', href: '/admin/students/courses', description: 'Manage course enrollments' },
        { label: 'Grades & Results', href: '/admin/students/grades', description: 'View and manage grades' },
        { label: 'Class Attendance', href: '/admin/students/attendance', description: 'Track attendance records' },
      ],
    },
    {
      title: 'Programs & Courses',
      description: 'Manage academic programs and courses',
      icon: BookOpen,
      color: 'bg-emerald-500/10 text-emerald-600',
      links: [
        { label: 'Program Management', href: '/admin/programs', description: 'Manage academic programs' },
        { label: 'Course Catalog', href: '/admin/courses', description: 'View and manage courses' },
        { label: 'Class Schedules', href: '/admin/academics/sessions', description: 'Manage class schedules' },
        { label: 'Departments', href: '/admin/academics/departments', description: 'Manage academic departments' },
      ],
    },
    {
      title: 'Assessments',
      description: 'Manage student assessments and exams',
      icon: ClipboardList,
      color: 'bg-orange-500/10 text-orange-600',
      links: [
        { label: 'Exam Management', href: '/admin/exams', description: 'Create and manage exams' },
        { label: 'Assessment Center', href: '/admin/assessments', description: 'Manage all assessments' },
        { label: 'Grading Portal', href: '/admin/assessments/grading', description: 'Grade student assessments' },
        { label: 'Results Publishing', href: '/admin/assessments/results', description: 'Publish exam results' },
      ],
    },
    {
      title: 'Fees & Payments',
      description: 'Manage student fees and payments',
      icon: CreditCard,
      color: 'bg-green-500/10 text-green-600',
      links: [
        { label: 'Fee Management', href: '/admin/finance/fees', description: 'Manage fee structures' },
        { label: 'Payment History', href: '/admin/finance/payments', description: 'View payment records' },
        { label: 'Outstanding Fees', href: '/admin/finance/payments?status=outstanding', description: 'Students with outstanding fees' },
        { label: 'Payment Reminders', href: '/admin/finance/reminders', description: 'Send payment reminders' },
      ],
    },
    {
      title: 'Analytics',
      description: 'View student analytics and reports',
      icon: BarChart3,
      color: 'bg-indigo-500/10 text-indigo-600',
      links: [
        { label: 'Performance Analytics', href: '/admin/analytics/students', description: 'Student performance reports' },
        { label: 'Attendance Reports', href: '/admin/analytics/attendance', description: 'Attendance statistics' },
        { label: 'Retention Rates', href: '/admin/analytics/retention', description: 'Student retention metrics' },
        { label: 'Graduation Rates', href: '/admin/analytics/graduation', description: 'Graduation statistics' },
      ],
    },
  ]

  const filteredStudents = recentStudents.filter(student => {
    const matchesSearch = `${student.firstName} ${student.lastName} ${student.email} ${student.studentNumber} ${student.matricNumber}`.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || student.admissionStatus === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Student Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">Comprehensive management for all student-related activities</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
          <Button className="gap-2">
            <Users className="h-4 w-4" />
            View All Students
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Students</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-2xl font-bold">{stats.active}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-emerald-600" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Inactive</p>
              <p className="text-2xl font-bold">{stats.inactive}</p>
            </div>
            <XCircle className="h-8 w-8 text-gray-600" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Suspended</p>
              <p className="text-2xl font-bold">{stats.suspended}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-yellow-600" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Graduated</p>
              <p className="text-2xl font-bold">{stats.graduated}</p>
            </div>
            <Award className="h-8 w-8 text-blue-600" />
          </div>
        </Card>
      </div>

      {/* Management Sections */}
      <div className="grid gap-6 lg:grid-cols-2">
        {managementSections.map((section) => {
          const Icon = section.icon
          return (
            <Card key={section.title} className="p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className={`rounded-xl p-3 ${section.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold">{section.title}</h3>
                  <p className="text-sm text-muted-foreground">{section.description}</p>
                </div>
              </div>
              <div className="space-y-2">
                {section.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-accent"
                  >
                    <div>
                      <p className="text-sm font-medium">{link.label}</p>
                      <p className="text-xs text-muted-foreground">{link.description}</p>
                    </div>
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            </Card>
          )
        })}
      </div>

      {/* Recent Students */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Recent Students</h3>
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="graduated">Graduated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading students...</div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No students found</div>
          ) : (
            filteredStudents.map((student) => (
              <div key={student.id} className="flex items-center justify-between rounded-lg border border-border p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                    {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold">{student.firstName} {student.lastName}</p>
                    <p className="text-sm text-muted-foreground">{student.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {student.studentNumber && <span className="text-xs text-muted-foreground">{student.studentNumber}</span>}
                      {student.matricNumber && <span className="text-xs text-muted-foreground">• {student.matricNumber}</span>}
                      {student.currentLevel && <span className="text-xs text-muted-foreground">• {student.currentLevel}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <Badge className={getStatusColor(student.admissionStatus)}>
                      {student.admissionStatus.replace('_', ' ')}
                    </Badge>
                  </div>
                  <Link href={`/admin/students/${student.id}`}>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  )
}
