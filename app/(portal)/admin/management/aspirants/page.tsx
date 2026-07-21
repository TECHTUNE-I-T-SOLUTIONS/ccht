'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { GraduationCap, FileText, ShieldCheck, Users, ClipboardList, Award, Search, Filter, Download, Eye, CheckCircle, XCircle, Clock, AlertCircle, TrendingUp, CalendarDays, BarChart3 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

type AspirantStats = {
  total: number
  pending: number
  approved: number
  rejected: number
  inReview: number
}

type RecentAspirant = {
  id: string
  firstName: string
  lastName: string
  email: string
  jambRegNo: string
  admissionNumber: string
  applicationStatus: string
  currentStage: string
  profileCompletion: number
  submittedAt: string
  avatarUrl?: string | null
}

export default function AspirantManagementPage() {
  const [stats, setStats] = useState<AspirantStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    inReview: 0,
  })
  const [recentAspirants, setRecentAspirants] = useState<RecentAspirant[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAspirantData()
  }, [])

  const loadAspirantData = async () => {
    try {
      setLoading(true)
      const [statsRes, aspirantsRes] = await Promise.all([
        fetch('/api/v1/admin/management/aspirants/stats'),
        fetch('/api/v1/admin/management/aspirants/recent'),
      ])
      
      const statsData = await statsRes.json()
      const aspirantsData = await aspirantsRes.json()
      
      console.log('[Aspirant Management] Stats response:', statsData)
      console.log('[Aspirant Management] Aspirants response:', aspirantsData)
      
      if (statsData.success) {
        console.log('[Aspirant Management] Setting stats:', statsData.data)
        setStats(statsData.data)
      } else {
        console.error('[Aspirant Management] Stats error:', statsData.error)
      }
      
      if (aspirantsData.success) {
        console.log('[Aspirant Management] Setting aspirants:', aspirantsData.data)
        setRecentAspirants(aspirantsData.data)
      } else {
        console.error('[Aspirant Management] Aspirants error:', aspirantsData.error)
      }
    } catch (error) {
      console.error('Failed to load aspirant data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
      approved: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
      rejected: 'bg-red-500/10 text-red-600 border-red-500/20',
      in_review: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      draft: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
    }
    return colors[status] || 'bg-gray-500/10 text-gray-600 border-gray-500/20'
  }

  const getStageLabel = (stage: string) => {
    const labels: Record<string, string> = {
      signup: 'Registration',
      payment: 'Application Fee',
      documents: 'Document Upload',
      exam: 'Screening Exam',
      admission_fee: 'Admission Fee',
      migration: 'Admission Processing',
      completed: 'Completed',
    }
    return labels[stage] || stage
  }

  const managementSections = [
    {
      title: 'Applications',
      description: 'Manage all aspirant applications and admissions',
      icon: GraduationCap,
      color: 'bg-blue-500/10 text-blue-600',
      links: [
        { label: 'All Applications', href: '/admin/admissions', description: 'View and manage all applications' },
        { label: 'Pending Review', href: '/admin/admissions?status=pending', description: 'Applications awaiting review' },
        { label: 'Approved', href: '/admin/admissions?status=approved', description: 'Successfully approved applications' },
        { label: 'Rejected', href: '/admin/admissions?status=rejected', description: 'Rejected applications' },
      ],
    },
    {
      title: 'Documents',
      description: 'Review and verify aspirant documents',
      icon: FileText,
      color: 'bg-purple-500/10 text-purple-600',
      links: [
        { label: 'Document Review', href: '/admin/admissions/documents', description: 'Review uploaded documents' },
        { label: 'Pending Documents', href: '/admin/admissions/documents?status=pending', description: 'Documents awaiting verification' },
        { label: 'Verified Documents', href: '/admin/admissions/documents?status=verified', description: 'Successfully verified documents' },
      ],
    },
    {
      title: 'Screening Exams',
      description: 'Manage screening tests and candidate results',
      icon: ShieldCheck,
      color: 'bg-emerald-500/10 text-emerald-600',
      links: [
        { label: 'Exam Management', href: '/admin/screening', description: 'Create and manage screening exams' },
        { label: 'Candidate Results', href: '/admin/screening/results', description: 'View exam results and grades' },
        { label: 'Exam Proctoring', href: '/admin/exam-proctoring', description: 'Monitor live exam sessions' },
        { label: 'Exam Recordings', href: '/admin/screening/recordings', description: 'View and manage exam recordings' },
        { label: 'Exam Analytics', href: '/admin/screening/analytics', description: 'Exam performance analytics' },
      ],
    },
    {
      title: 'Assessments',
      description: 'Manage assessments and evaluations',
      icon: ClipboardList,
      color: 'bg-orange-500/10 text-orange-600',
      links: [
        { label: 'Assessment Center', href: '/admin/assessments', description: 'Manage all assessments' },
        { label: 'Grading', href: '/admin/assessments/grading', description: 'Grade aspirant assessments' },
        { label: 'Results', href: '/admin/assessments/results', description: 'View assessment results' },
      ],
    },
    {
      title: 'Payments',
      description: 'Manage aspirant payments and fees',
      icon: Award,
      color: 'bg-green-500/10 text-green-600',
      links: [
        { label: 'Payment History', href: '/admin/payments/aspirants', description: 'View all aspirant payments' },
        { label: 'Fee Structure', href: '/admin/finance/fees', description: 'Manage fee structures' },
        { label: 'Pending Payments', href: '/admin/payments/aspirants?status=pending', description: 'Payments awaiting confirmation' },
      ],
    },
    {
      title: 'Analytics',
      description: 'View aspirant analytics and reports',
      icon: BarChart3,
      color: 'bg-indigo-500/10 text-indigo-600',
      links: [
        { label: 'Application Statistics', href: '/admin/analytics/aspirants', description: 'Application trends and stats' },
        { label: 'Performance Reports', href: '/admin/analytics/performance', description: 'Aspirant performance reports' },
        { label: 'Conversion Rates', href: '/admin/analytics/conversion', description: 'Application to admission rates' },
      ],
    },
  ]

  const filteredAspirants = recentAspirants.filter(aspirant => {
    const matchesSearch = `${aspirant.firstName} ${aspirant.lastName} ${aspirant.email} ${aspirant.jambRegNo}`.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || aspirant.applicationStatus === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Aspirant Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">Comprehensive management for all aspirant-related activities</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
          <Button className="gap-2">
            <GraduationCap className="h-4 w-4" />
            View All Applications
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Aspirants</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending Review</p>
              <p className="text-2xl font-bold">{stats.pending}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">In Review</p>
              <p className="text-2xl font-bold">{stats.inReview}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-blue-600" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Approved</p>
              <p className="text-2xl font-bold">{stats.approved}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-emerald-600" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Rejected</p>
              <p className="text-2xl font-bold">{stats.rejected}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-600" />
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

      {/* Recent Aspirants */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Recent Aspirants</h3>
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search aspirants..."
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
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_review">In Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading aspirants...</div>
          ) : filteredAspirants.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No aspirants found</div>
          ) : (
            filteredAspirants.map((aspirant) => (
              <div key={aspirant.id} className="flex items-center justify-between rounded-lg border border-border p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                    {aspirant.firstName.charAt(0)}{aspirant.lastName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold">{aspirant.firstName} {aspirant.lastName}</p>
                    <p className="text-sm text-muted-foreground">{aspirant.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">{aspirant.jambRegNo}</span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">{getStageLabel(aspirant.currentStage)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(aspirant.applicationStatus)}>
                        {aspirant.applicationStatus.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {aspirant.profileCompletion}% complete
                    </p>
                  </div>
                  <Link href={`/admin/admissions/${aspirant.id}`}>
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
