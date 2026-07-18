'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookOpen, Users, FileText, Award, Search, Filter, Download, Eye, CheckCircle, XCircle, Clock, AlertCircle, TrendingUp, CalendarDays, BarChart3, GraduationCap, CreditCard, ClipboardList, UserCheck, Calendar, MessageSquare } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

type LecturerStats = {
  total: number
  active: number
  inactive: number
  suspended: number
  partTime: number
}

type RecentLecturer = {
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

export default function LecturerManagementPage() {
  const [stats, setStats] = useState<LecturerStats>({
    total: 0,
    active: 0,
    inactive: 0,
    suspended: 0,
    partTime: 0,
  })
  const [recentLecturers, setRecentLecturers] = useState<RecentLecturer[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLecturerData()
  }, [])

  const loadLecturerData = async () => {
    try {
      setLoading(true)
      const [statsRes, lecturersRes] = await Promise.all([
        fetch('/api/v1/admin/management/lecturers/stats'),
        fetch('/api/v1/admin/management/lecturers/recent'),
      ])
      
      const statsData = await statsRes.json()
      const lecturersData = await lecturersRes.json()
      
      if (statsData.success) setStats(statsData.data)
      if (lecturersData.success) setRecentLecturers(lecturersData.data)
    } catch (error) {
      console.error('Failed to load lecturer data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
      inactive: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
      on_leave: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
      part_time: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      suspended: 'bg-red-500/10 text-red-600 border-red-500/20',
    }
    return colors[status] || 'bg-gray-500/10 text-gray-600 border-gray-500/20'
  }

  const managementSections = [
    {
      title: 'Lecturer Management',
      description: 'Manage lecturer profiles and employment',
      icon: UserCheck,
      color: 'bg-blue-500/10 text-blue-600',
      links: [
        { label: 'All Lecturers', href: '/admin/lecturers', description: 'View and manage all lecturers' },
        { label: 'Add New Lecturer', href: '/admin/lecturers/add', description: 'Register new lecturer' },
        { label: 'Lecturer Profiles', href: '/admin/lecturers/profiles', description: 'Manage lecturer profiles' },
        { label: 'Employment History', href: '/admin/lecturers/history', description: 'View employment records' },
      ],
    },
    {
      title: 'Academic Assignments',
      description: 'Manage lecturer course assignments',
      icon: BookOpen,
      color: 'bg-purple-500/10 text-purple-600',
      links: [
        { label: 'Course Assignments', href: '/admin/lecturers/courses', description: 'Assign courses to lecturers' },
        { label: 'Class Schedules', href: '/admin/academics/sessions', description: 'Manage class schedules' },
        { label: 'Workload Management', href: '/admin/lecturers/workload', description: 'Manage lecturer workload' },
        { label: 'Substitutions', href: '/admin/lecturers/substitutions', description: 'Manage class substitutions' },
      ],
    },
    {
      title: 'Departments',
      description: 'Manage academic departments',
      icon: GraduationCap,
      color: 'bg-emerald-500/10 text-emerald-600',
      links: [
        { label: 'Department Management', href: '/admin/academics/departments', description: 'Manage departments' },
        { label: 'Department Heads', href: '/admin/academics/heads', description: 'Manage department heads' },
        { label: 'Department Staff', href: '/admin/academics/staff', description: 'View department staff' },
        { label: 'Department Budgets', href: '/admin/academics/budgets', description: 'Manage department budgets' },
      ],
    },
    {
      title: 'Teaching Activities',
      description: 'Monitor teaching and assessment activities',
      icon: ClipboardList,
      color: 'bg-orange-500/10 text-orange-600',
      links: [
        { label: 'Teaching Schedule', href: '/admin/lecturers/schedule', description: 'View teaching schedules' },
        { label: 'Exam Supervision', href: '/admin/lecturers/exams', description: 'Manage exam supervision' },
        { label: 'Grading Tasks', href: '/admin/lecturers/grading', description: 'Track grading assignments' },
        { label: 'Office Hours', href: '/admin/lecturers/office-hours', description: 'Manage office hours' },
      ],
    },
    {
      title: 'Performance & Evaluation',
      description: 'Evaluate lecturer performance',
      icon: Award,
      color: 'bg-green-500/10 text-green-600',
      links: [
        { label: 'Performance Reviews', href: '/admin/lecturers/reviews', description: 'Conduct performance reviews' },
        { label: 'Student Feedback', href: '/admin/lecturers/feedback', description: 'View student feedback' },
        { label: 'Teaching Quality', href: '/admin/lecturers/quality', description: 'Monitor teaching quality' },
        { label: 'Professional Development', href: '/admin/lecturers/development', description: 'Track professional development' },
      ],
    },
    {
      title: 'Analytics',
      description: 'View lecturer analytics and reports',
      icon: BarChart3,
      color: 'bg-indigo-500/10 text-indigo-600',
      links: [
        { label: 'Performance Analytics', href: '/admin/analytics/lecturers', description: 'Lecturer performance reports' },
        { label: 'Workload Analytics', href: '/admin/analytics/workload', description: 'Workload distribution reports' },
        { label: 'Retention Reports', href: '/admin/analytics/lecturer-retention', description: 'Lecturer retention metrics' },
        { label: 'Teaching Statistics', href: '/admin/analytics/teaching', description: 'Teaching statistics' },
      ],
    },
  ]

  const filteredLecturers = recentLecturers.filter(lecturer => {
    const matchesSearch = `${lecturer.firstName} ${lecturer.lastName} ${lecturer.email} ${lecturer.department} ${lecturer.employeeNumber}`.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || lecturer.employmentStatus === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Lecturer Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">Comprehensive management for all lecturer-related activities</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
          <Button className="gap-2">
            <UserCheck className="h-4 w-4" />
            Add New Lecturer
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Lecturers</p>
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
            <CalendarDays className="h-8 w-8 text-yellow-600" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Part-Time</p>
              <p className="text-2xl font-bold">{stats.partTime}</p>
            </div>
            <Clock className="h-8 w-8 text-blue-600" />
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

      {/* Recent Lecturers */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Recent Lecturers</h3>
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search lecturers..."
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
                <SelectItem value="part_time">Part-Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading lecturers...</div>
          ) : filteredLecturers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No lecturers found</div>
          ) : (
            filteredLecturers.map((lecturer) => (
              <div key={lecturer.id} className="flex items-center justify-between rounded-lg border border-border p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                    {lecturer.firstName.charAt(0)}{lecturer.lastName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold">{lecturer.firstName} {lecturer.lastName}</p>
                    <p className="text-sm text-muted-foreground">{lecturer.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {lecturer.department && <span className="text-xs text-muted-foreground">{lecturer.department}</span>}
                      {lecturer.specialization && <span className="text-xs text-muted-foreground">• {lecturer.specialization}</span>}
                      {lecturer.employmentType && <span className="text-xs text-muted-foreground">• {lecturer.employmentType.replace('_', ' ')}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <Badge className={getStatusColor(lecturer.employmentStatus)}>
                      {lecturer.employmentStatus.replace('_', ' ')}
                    </Badge>
                  </div>
                  <Link href={`/admin/lecturers/${lecturer.id}`}>
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
