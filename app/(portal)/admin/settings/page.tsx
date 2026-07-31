'use client'

import { useEffect, useState, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Settings, User, Mail, Phone, Building, Briefcase, Shield, Save, LogOut, Upload, Camera } from 'lucide-react'
import { toast } from 'sonner'
import { PasswordResetDialog } from '@/components/portal/password-reset-dialog'
import { createClient } from '@/lib/supabase/client'
import { ADMIN_DEPARTMENTS, ADMIN_DESIGNATIONS, getDepartmentLabel, getDesignationLabel } from '@/lib/admin-constants'

type AdminProfile = {
  id: string
  email: string
  firstName: string
  lastName: string
  middleName?: string
  phone?: string
  avatarUrl?: string
  profilePhotoPath?: string
  profilePhotoBucket?: string
  adminProfile?: {
    staff_id: string
    department: string
    designation: string
    admin_scope: string
    can_manage_users: boolean
    can_manage_content: boolean
    can_manage_academics: boolean
    can_manage_finance: boolean
  }
}

export default function AdminSettingsPage() {
  const [profile, setProfile] = useState<AdminProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    phone: '',
    staffId: '',
    department: '',
    designation: '',
    canManageUsers: false,
    canManageContent: false,
    canManageAcademics: false,
    canManageFinance: false,
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/v1/auth/me')
      const data = await response.json()
      
      if (data?.user) {
        const user = data.user
        setProfile({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          middleName: user.middleName,
          phone: user.phone,
          avatarUrl: user.avatarUrl,
          profilePhotoPath: user.profilePhotoPath,
          profilePhotoBucket: user.profilePhotoBucket,
          adminProfile: user.adminProfile,
        })
        setFormData({
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          middleName: user.middleName || '',
          phone: user.phone || '',
          staffId: user.adminProfile?.staff_id || '',
          department: user.adminProfile?.department || '',
          designation: user.adminProfile?.designation || '',
          canManageUsers: user.adminProfile?.can_manage_users || false,
          canManageContent: user.adminProfile?.can_manage_content || false,
          canManageAcademics: user.adminProfile?.can_manage_academics || false,
          canManageFinance: user.adminProfile?.can_manage_finance || false,
        })
      }
    } catch (error) {
      console.error('Failed to load profile:', error)
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return

    try {
      setUploadingPhoto(true)
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`/api/v1/admin/users/${profile.id}/profile-photo`, {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        toast.success('Profile photo uploaded successfully')
        loadProfile()
      } else {
        toast.error('Failed to upload profile photo')
      }
    } catch (error) {
      console.error('Failed to upload photo:', error)
      toast.error('Failed to upload profile photo')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const response = await fetch('/api/v1/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      
      if (response.ok) {
        toast.success('Profile updated successfully')
        loadProfile()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Failed to update profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/v1/auth/logout', { method: 'POST' })
      window.location.href = '/secure/admin/login'
    } catch (error) {
      toast.error('Failed to logout')
    }
  }

  if (loading) {
    return <div className="p-8">Loading profile...</div>
  }

  if (!profile) {
    return <div className="p-8">Profile not found</div>
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[2.5rem] border border-border bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.12),transparent_30%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--accent-soft)))] p-8 md:p-10">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Settings className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-extrabold md:text-5xl">Admin Profile & Settings</h1>
            </div>
            <p className="mt-2 text-sm text-foreground/75">Manage your admin profile and system preferences.</p>
          </div>
          <PasswordResetDialog />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile Photo & Information */}
        <Card className="rounded-[2rem] border bg-white dark:bg-slate-900 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <User className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">Profile Information</h2>
          </div>
          
          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              <img
                src={profile?.avatarUrl || '/default-avatar.png'}
                alt="Profile"
                className="w-32 h-32 rounded-full object-cover border-4 border-primary/20"
              />
              <Button
                size="icon"
                variant="outline"
                className="absolute bottom-0 right-0 rounded-full"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
              >
                <Camera className="h-4 w-4" />
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
              />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {uploadingPhoto ? 'Uploading...' : 'Click camera to upload photo'}
            </p>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="middleName">Middle Name</Label>
              <Input
                id="middleName"
                value={formData.middleName}
                onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                disabled
                className="bg-slate-50 dark:bg-slate-800"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="staffId">Staff ID</Label>
              <Input
                id="staffId"
                value={formData.staffId}
                onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
                placeholder="Enter staff ID"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select
                value={formData.department}
                onValueChange={(value) => setFormData({ ...formData, department: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {ADMIN_DEPARTMENTS.map((dept) => (
                    <SelectItem key={dept.value} value={dept.value}>
                      {dept.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="designation">Designation</Label>
              <Select
                value={formData.designation}
                onValueChange={(value) => setFormData({ ...formData, designation: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select designation" />
                </SelectTrigger>
                <SelectContent>
                  {ADMIN_DESIGNATIONS.map((desig) => (
                    <SelectItem key={desig.value} value={desig.value}>
                      {desig.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Permissions</p>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.canManageUsers}
                    onChange={(e) => setFormData({ ...formData, canManageUsers: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">Can Manage Users</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.canManageContent}
                    onChange={(e) => setFormData({ ...formData, canManageContent: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">Can Manage Content</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.canManageAcademics}
                    onChange={(e) => setFormData({ ...formData, canManageAcademics: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">Can Manage Academics</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.canManageFinance}
                    onChange={(e) => setFormData({ ...formData, canManageFinance: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">Can Manage Finance</span>
                </label>
              </div>
            </div>

            <Button type="submit" disabled={saving} className="w-full border border-primary hover:shadow-lg hover:shadow-blue-600">
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </Card>

        {/* Admin Details */}
        <Card className="rounded-[2rem] border bg-white dark:bg-slate-900 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">Admin Information</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-slate-50 dark:bg-slate-800">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Staff ID</p>
                <p className="font-semibold">{profile.adminProfile?.staff_id || 'Not assigned'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg bg-slate-50 dark:bg-slate-800">
              <Building className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Department</p>
                <p className="font-semibold capitalize">{profile.adminProfile?.department || 'Not assigned'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg bg-slate-50 dark:bg-slate-800">
              <Briefcase className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Designation</p>
                <p className="font-semibold capitalize">{profile.adminProfile?.designation || 'Not assigned'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg bg-slate-50 dark:bg-slate-800">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Admin Scope</p>
                <p className="font-semibold capitalize">{profile.adminProfile?.admin_scope || 'operations'}</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Permissions</p>
              <div className="grid grid-cols-2 gap-2">
                <div className={`p-2 rounded-lg text-sm ${profile.adminProfile?.can_manage_users ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                  Manage Users
                </div>
                <div className={`p-2 rounded-lg text-sm ${profile.adminProfile?.can_manage_content ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                  Manage Content
                </div>
                <div className={`p-2 rounded-lg text-sm ${profile.adminProfile?.can_manage_academics ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                  Manage Academics
                </div>
                <div className={`p-2 rounded-lg text-sm ${profile.adminProfile?.can_manage_finance ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                  Manage Finance
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button variant="destructive" onClick={handleLogout} className="w-full">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
