'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ShieldCheck, Users, FileText, Award, Search, Filter, Download, Eye, CheckCircle, XCircle, Clock, AlertCircle, TrendingUp, CalendarDays, BarChart3, Settings, Bell, Lock, Key, UserPlus, Shield, Building, Briefcase, BookOpen, CreditCard } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

type AdminStats = {
  total: number
  superAdmins: number
  operations: number
  academics: number
  finance: number
}

type RecentAdmin = {
  id: string
  firstName: string
  lastName: string
  email: string
  staffId: string
  department: string
  designation: string
  adminScope: string
  canManageUsers: boolean
  canManageContent: boolean
  canManageAcademics: boolean
  canManageFinance: boolean
  createdAt: string
}

export default function AdminManagementPage() {
  const [stats, setStats] = useState<AdminStats>({
    total: 0,
    superAdmins: 0,
    operations: 0,
    academics: 0,
    finance: 0,
  })
  const [recentAdmins, setRecentAdmins] = useState<RecentAdmin[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAdminData()
  }, [])

  const loadAdminData = async () => {
    try {
      setLoading(true)
      const [statsRes, adminsRes] = await Promise.all([
        fetch('/api/v1/admin/management/admins/stats'),
        fetch('/api/v1/admin/management/admins/recent'),
      ])
      
      const statsData = await statsRes.json()
      const adminsData = await adminsRes.json()
      
      if (statsData.success) setStats(statsData.data)
      if (adminsData.success) setRecentAdmins(adminsData.data)
    } catch (error) {
      console.error('Failed to load admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
      inactive: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
      suspended: 'bg-red-500/10 text-red-600 border-red-500/20',
      pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    }
    return colors[status] || 'bg-gray-500/10 text-gray-600 border-gray-500/20'
  }

  const getScopeColor = (scope: string) => {
    const colors: Record<string, string> = {
      super: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
      operations: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      academics: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
      finance: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
    }
    return colors[scope] || 'bg-gray-500/10 text-gray-600 border-gray-500/20'
  }

  const managementSections = [
    {
      title: 'Admin Management',
      description: 'Manage administrator accounts and access',
      icon: ShieldCheck,
      color: 'bg-blue-500/10 text-blue-600',
      links: [
        { label: 'All Admins', href: '/admin/users', description: 'View and manage all administrators' },
        { label: 'Add New Admin', href: '/secure/admin/signup', description: 'Create new administrator account' },
        { label: 'Admin Profiles', href: '/admin/admins/profiles', description: 'Manage admin profiles and details' },
        { label: 'Staff ID Management', href: '/admin/admins/staff-ids', description: 'Manage staff ID assignments' },
      ],
    },
    {
      title: 'Permissions & Access',
      description: 'Manage admin permissions and access control',
      icon: Lock,
      color: 'bg-purple-500/10 text-purple-600',
      links: [
        { label: 'Permission Management', href: '/admin/admins/permissions', description: 'Manage admin permissions' },
        { label: 'Role Management', href: '/admin/admins/roles', description: 'Manage admin roles and scopes' },
        { label: 'Access Logs', href: '/admin/admins/access-logs', description: 'View admin access logs' },
        { label: 'Security Settings', href: '/admin/settings/security', description: 'Configure security settings' },
      ],
    },
    {
      title: 'Departments & Designations',
      description: 'Manage admin departments and designations',
      icon: Building,
      color: 'bg-emerald-500/10 text-emerald-600',
      links: [
        { label: 'Department Management', href: '/admin/admins/departments', description: 'Manage admin departments' },
        { label: 'Designation Management', href: '/admin/admins/designations', description: 'Manage admin designations' },
        { label: 'Department Assignments', href: '/admin/admins/assignments', description: 'Assign admins to departments' },
        { label: 'Organization Structure', href: '/admin/admins/structure', description: 'View org structure' },
      ],
    },
    {
      title: 'System Administration',
      description: 'System-wide administrative functions',
      icon: Settings,
      color: 'bg-orange-500/10 text-orange-600',
      links: [
        { label: 'System Settings', href: '/admin/settings', description: 'Configure system settings' },
        { label: 'Audit Logs', href: '/admin/admins/audit', description: 'View system audit logs' },
        { label: 'Backup & Recovery', href: '/admin/admins/backup', description: 'Manage system backups' },
        { label: 'System Health', href: '/admin/admins/health', description: 'Monitor system health' },
      ],
    },
    {
      title: 'Notifications & Alerts',
      description: 'Manage admin notifications and alerts',
      icon: Bell,
      color: 'bg-green-500/10 text-green-600',
      links: [
        { label: 'Notification Center', href: '/admin/notifications', description: 'Manage notifications' },
        { label: 'Alert Configuration', href: '/admin/admins/alerts', description: 'Configure system alerts' },
        { label: 'Broadcast Messages', href: '/admin/admins/broadcast', description: 'Send broadcast messages' },
        { label: 'Notification Templates', href: '/admin/admins/templates', description: 'Manage notification templates' },
      ],
    },
    {
      title: 'Analytics',
      description: 'View admin analytics and reports',
      icon: BarChart3,
      color: 'bg-indigo-500/10 text-indigo-600',
      links: [
        { label: 'Admin Activity', href: '/admin/analytics/admins', description: 'Admin activity reports' },
        { label: 'Access Analytics', href: '/admin/analytics/access', description: 'Access pattern analytics' },
        { label: 'Performance Reports', href: '/admin/analytics/admin-performance', description: 'Admin performance metrics' },
        { label: 'Security Reports', href: '/admin/analytics/security', description: 'Security incident reports' },
      ],
    },
  ]

  const filteredAdmins = recentAdmins.filter(admin => {
    const matchesSearch = `${admin.firstName} ${admin.lastName} ${admin.email} ${admin.staffId}`.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesScope = statusFilter === 'all' || admin.adminScope === statusFilter
    return matchesSearch && matchesScope
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">Comprehensive management for all administrator-related activities</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
          <Button className="gap-2">
            <UserPlus className="h-4 w-4" />
            Add New Admin
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Admins</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Super Admins</p>
              <p className="text-2xl font-bold">{stats.superAdmins}</p>
            </div>
            <Shield className="h-8 w-8 text-purple-600" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Operations</p>
              <p className="text-2xl font-bold">{stats.operations}</p>
            </div>
            <Settings className="h-8 w-8 text-blue-600" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Academics</p>
              <p className="text-2xl font-bold">{stats.academics}</p>
            </div>
            <BookOpen className="h-8 w-8 text-emerald-600" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Finance</p>
              <p className="text-2xl font-bold">{stats.finance}</p>
            </div>
            <CreditCard className="h-8 w-8 text-yellow-600" />
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

      {/* Recent Admins */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Recent Administrators</h3>
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search admins..."
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
                <SelectItem value="all">All Scopes</SelectItem>
                <SelectItem value="super">Super Admin</SelectItem>
                <SelectItem value="operations">Operations</SelectItem>
                <SelectItem value="academics">Academics</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading administrators...</div>
          ) : filteredAdmins.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No administrators found</div>
          ) : (
            filteredAdmins.map((admin) => (
              <div key={admin.id} className="flex items-center justify-between rounded-lg border border-border p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                    {admin.firstName.charAt(0)}{admin.lastName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold">{admin.firstName} {admin.lastName}</p>
                    <p className="text-sm text-muted-foreground">{admin.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">{admin.staffId}</span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">{admin.department}</span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">{admin.designation}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <Badge className={getScopeColor(admin.adminScope)}>
                      {admin.adminScope}
                    </Badge>
                  </div>
                  <Link href={`/admin/users/${admin.id}`}>
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
