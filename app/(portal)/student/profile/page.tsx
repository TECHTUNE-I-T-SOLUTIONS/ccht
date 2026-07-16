'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { UserRound, Mail, Phone, MapPin, CalendarDays, BadgeCheck, Edit2, Save, X, Camera, GraduationCap, IdCard } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'

type StudentProfile = {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  matric_number: string | null
  department: string | null
  level: string | null
  admission_year: string | null
  date_of_birth: string | null
  gender: string | null
  address: string | null
  state_of_origin: string | null
  lga: string | null
  next_of_kin: string | null
  next_of_kin_phone: string | null
  avatar_url: string | null
  created_at: string
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<Partial<StudentProfile>>({})
  const supabase = createClient()

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(data)
      setFormData(data || {})
    } catch (error) {
      console.error(error)
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const { error } = await supabase.from('profiles').update(formData).eq('id', profile?.id)
      if (error) throw error
      
      setProfile({ ...profile, ...formData } as StudentProfile)
      setEditing(false)
      toast.success('Profile updated successfully')
    } catch (error) {
      console.error(error)
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData(profile || {})
    setEditing(false)
  }

  if (loading) return <div className="p-8">Loading profile...</div>

  const displayName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ')
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase()

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Profile</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your personal information and academic details</p>
        </div>
        {!editing && (
          <Button onClick={() => setEditing(true)} className="rounded-xl">
            <Edit2 className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <Card className="p-6 lg:col-span-1">
          <div className="text-center">
            <div className="relative inline-block">
              <Avatar className="h-32 w-32 mx-auto mb-4">
                <AvatarImage src={profile?.avatar_url || ''} alt={displayName} />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl">{initials}</AvatarFallback>
              </Avatar>
              {editing && (
                <button className="absolute bottom-4 right-0 rounded-full bg-primary p-2 text-primary-foreground hover:bg-primary/90">
                  <Camera className="h-4 w-4" />
                </button>
              )}
            </div>
            <h2 className="text-2xl font-bold">{displayName}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{profile?.email}</p>
            {profile?.matric_number && (
              <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2">
                <IdCard className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-primary">{profile.matric_number}</span>
              </div>
            )}
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <GraduationCap className="h-4 w-4" />
                <span>{profile?.department || 'Department not assigned'}</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <BadgeCheck className="h-4 w-4" />
                <span>{profile?.level || 'Level not set'}</span>
              </div>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Student since {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </Card>

        {/* Details Card */}
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Personal Information</h2>
            {editing && (
              <div className="flex gap-2">
                <Button onClick={handleCancel} variant="outline" size="sm" className="rounded-xl">
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving} size="sm" className="rounded-xl">
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            )}
          </div>

          {editing ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name || ''}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name || ''}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  value={formData.email || ''}
                  disabled
                  className="rounded-xl bg-muted"
                />
                <p className="mt-1 text-xs text-muted-foreground">Email cannot be changed</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+234..."
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <Label htmlFor="date_of_birth">Date of Birth</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={formData.date_of_birth || ''}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">Residential Address</Label>
                <Textarea
                  id="address"
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="rounded-xl"
                  rows={3}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="state_of_origin">State of Origin</Label>
                  <Input
                    id="state_of_origin"
                    value={formData.state_of_origin || ''}
                    onChange={(e) => setFormData({ ...formData, state_of_origin: e.target.value })}
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <Label htmlFor="lga">Local Government Area</Label>
                  <Input
                    id="lga"
                    value={formData.lga || ''}
                    onChange={(e) => setFormData({ ...formData, lga: e.target.value })}
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="border-t border-border pt-4 mt-4">
                <h3 className="text-sm font-semibold mb-4">Next of Kin Information</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="next_of_kin">Next of Kin Name</Label>
                    <Input
                      id="next_of_kin"
                      value={formData.next_of_kin || ''}
                      onChange={(e) => setFormData({ ...formData, next_of_kin: e.target.value })}
                      className="rounded-xl"
                    />
                  </div>
                  <div>
                    <Label htmlFor="next_of_kin_phone">Next of Kin Phone</Label>
                    <Input
                      id="next_of_kin_phone"
                      value={formData.next_of_kin_phone || ''}
                      onChange={(e) => setFormData({ ...formData, next_of_kin_phone: e.target.value })}
                      className="rounded-xl"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <UserRound className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Full Name</p>
                    <p className="font-semibold">{displayName}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <Mail className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email Address</p>
                    <p className="font-semibold">{profile?.email}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <Phone className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Phone Number</p>
                    <p className="font-semibold">{profile?.phone || 'Not provided'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <CalendarDays className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Date of Birth</p>
                    <p className="font-semibold">{profile?.date_of_birth || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <MapPin className="h-5 w-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Residential Address</p>
                  <p className="font-semibold">{profile?.address || 'Not provided'}</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-xs text-muted-foreground">State of Origin</p>
                  <p className="font-semibold">{profile?.state_of_origin || 'Not provided'}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-xs text-muted-foreground">Local Government Area</p>
                  <p className="font-semibold">{profile?.lga || 'Not provided'}</p>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <h3 className="text-sm font-semibold mb-4">Next of Kin Information</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <p className="text-xs text-muted-foreground">Name</p>
                    <p className="font-semibold">{profile?.next_of_kin || 'Not provided'}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="font-semibold">{profile?.next_of_kin_phone || 'Not provided'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
