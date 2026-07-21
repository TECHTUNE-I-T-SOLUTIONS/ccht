'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { UserRound, Mail, Phone, MapPin, CalendarDays, BadgeCheck, Edit2, Save, X, Camera, GraduationCap, IdCard, Building2 } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { nigeriaStates, getStateLGAs, getStateNames } from '@/lib/data/nigeria-states'

type StudentProfile = {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  avatar_url: string | null
  created_at: string
  // Student profile fields
  matric_number: string | null
  student_number: string | null
  admission_session: string | null
  admission_date: string | null
  date_of_birth: string | null
  gender: string | null
  blood_group: string | null
  genotype: string | null
  state_of_origin: string | null
  local_government_area: string | null
  nationality: string | null
  address_line_1: string | null
  address_line_2: string | null
  city: string | null
  state: string | null
  guardian_name: string | null
  guardian_phone: string | null
  guardian_email: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  current_level: string | null
  admission_status: string | null
  // Program info
  program_title: string | null
  department_name: string | null
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

      const [profileRes, studentProfileRes, enrollmentRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('student_profiles').select('*').eq('profile_id', user.id).single(),
        supabase.from('enrollments').select('*, program:programs(title, department:departments(name))').eq('student_id', user.id).eq('status', 'active').single()
      ])

      const profile = {
        ...profileRes.data,
        ...studentProfileRes.data,
        program_title: enrollmentRes.data?.program?.title || null,
        department_name: enrollmentRes.data?.program?.department?.name || null
      }
      setProfile(profile)
      setFormData(profile || {})
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
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Update profiles table (phone only)
      const profileUpdate = {
        phone: formData.phone
      }
      await supabase.from('profiles').update(profileUpdate).eq('id', user.id)

      // Update student_profiles table
      const studentProfileUpdate = {
        date_of_birth: formData.date_of_birth,
        gender: formData.gender,
        blood_group: formData.blood_group,
        genotype: formData.genotype,
        state_of_origin: formData.state_of_origin,
        local_government_area: formData.local_government_area,
        nationality: formData.nationality,
        address_line_1: formData.address_line_1,
        address_line_2: formData.address_line_2,
        city: formData.city,
        state: formData.state,
        guardian_name: formData.guardian_name,
        guardian_phone: formData.guardian_phone,
        guardian_email: formData.guardian_email,
        emergency_contact_name: formData.emergency_contact_name,
        emergency_contact_phone: formData.emergency_contact_phone
      }
      await supabase.from('student_profiles').update(studentProfileUpdate).eq('profile_id', user.id)
      
      setProfile({ ...profile, ...formData } as StudentProfile)
      setEditing(false)
      toast.success('Profile updated successfully')
      loadProfile()
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
                <Building2 className="h-4 w-4" />
                <span>{profile?.department_name || 'Department not assigned'}</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <BadgeCheck className="h-4 w-4" />
                <span>{profile?.current_level ? `${profile.current_level}L` : 'Level not set'}</span>
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

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={formData.gender || ''} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="nationality">Nationality</Label>
                  <Input
                    id="nationality"
                    value={formData.nationality || 'Nigerian'}
                    onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="blood_group">Blood Group</Label>
                  <Select value={formData.blood_group || ''} onValueChange={(value) => setFormData({ ...formData, blood_group: value })}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select blood group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">A</SelectItem>
                      <SelectItem value="B">B</SelectItem>
                      <SelectItem value="AB">AB</SelectItem>
                      <SelectItem value="O">O</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="genotype">Genotype</Label>
                  <Select value={formData.genotype || ''} onValueChange={(value) => setFormData({ ...formData, genotype: value })}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select genotype" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AA">AA</SelectItem>
                      <SelectItem value="AS">AS</SelectItem>
                      <SelectItem value="SS">SS</SelectItem>
                      <SelectItem value="AC">AC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="state_of_origin">State of Origin</Label>
                  <Select value={formData.state_of_origin || ''} onValueChange={(value) => {
                    setFormData({ ...formData, state_of_origin: value, local_government_area: '' })
                  }}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select state of origin" />
                    </SelectTrigger>
                    <SelectContent>
                      {getStateNames().map((state) => (
                        <SelectItem key={state} value={state}>{state}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="local_government_area">Local Government Area</Label>
                  <Select value={formData.local_government_area || ''} onValueChange={(value) => setFormData({ ...formData, local_government_area: value })} disabled={!formData.state_of_origin}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder={formData.state_of_origin ? "Select LGA" : "Select state first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {formData.state_of_origin && getStateLGAs(formData.state_of_origin).map((lga) => (
                        <SelectItem key={lga} value={lga}>{lga}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="address_line_1">Address Line 1</Label>
                <Textarea
                  id="address_line_1"
                  value={formData.address_line_1 || ''}
                  onChange={(e) => setFormData({ ...formData, address_line_1: e.target.value })}
                  className="rounded-xl"
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="address_line_2">Address Line 2 (Optional)</Label>
                <Textarea
                  id="address_line_2"
                  value={formData.address_line_2 || ''}
                  onChange={(e) => setFormData({ ...formData, address_line_2: e.target.value })}
                  className="rounded-xl"
                  rows={2}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="state">State</Label>
                  <Select value={formData.state || ''} onValueChange={(value) => {
                    setFormData({ ...formData, state: value, city: '' })
                  }}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {getStateNames().map((state) => (
                        <SelectItem key={state} value={state}>{state}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="city">City</Label>
                  <Select value={formData.city || ''} onValueChange={(value) => setFormData({ ...formData, city: value })} disabled={!formData.state}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder={formData.state ? "Select city" : "Select state first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {formData.state && getStateLGAs(formData.state).map((lga) => (
                        <SelectItem key={lga} value={lga}>{lga}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border-t border-border pt-4 mt-4">
                <h3 className="text-sm font-semibold mb-4">Guardian Information</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="guardian_name">Guardian Name</Label>
                    <Input
                      id="guardian_name"
                      value={formData.guardian_name || ''}
                      onChange={(e) => setFormData({ ...formData, guardian_name: e.target.value })}
                      className="rounded-xl"
                    />
                  </div>
                  <div>
                    <Label htmlFor="guardian_phone">Guardian Phone</Label>
                    <Input
                      id="guardian_phone"
                      value={formData.guardian_phone || ''}
                      onChange={(e) => setFormData({ ...formData, guardian_phone: e.target.value })}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="guardian_email">Guardian Email</Label>
                    <Input
                      id="guardian_email"
                      type="email"
                      value={formData.guardian_email || ''}
                      onChange={(e) => setFormData({ ...formData, guardian_email: e.target.value })}
                      className="rounded-xl"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-4 mt-4">
                <h3 className="text-sm font-semibold mb-4">Emergency Contact Information</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="emergency_contact_name">Emergency Contact Name</Label>
                    <Input
                      id="emergency_contact_name"
                      value={formData.emergency_contact_name || ''}
                      onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                      className="rounded-xl"
                    />
                  </div>
                  <div>
                    <Label htmlFor="emergency_contact_phone">Emergency Contact Phone</Label>
                    <Input
                      id="emergency_contact_phone"
                      value={formData.emergency_contact_phone || ''}
                      onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
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
                  <p className="font-semibold">{profile?.address_line_1 || 'Not provided'}</p>
                  {profile?.address_line_2 && <p className="text-sm text-muted-foreground">{profile.address_line_2}</p>}
                  {profile?.city && <p className="text-sm text-muted-foreground">{profile.city}, {profile?.state || ''}</p>}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-xs text-muted-foreground">State of Origin</p>
                  <p className="font-semibold">{profile?.state_of_origin || 'Not provided'}</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <p className="text-xs text-muted-foreground">Local Government Area</p>
                  <p className="font-semibold">{profile?.local_government_area || 'Not provided'}</p>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <h3 className="text-sm font-semibold mb-4">Guardian Information</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <p className="text-xs text-muted-foreground">Name</p>
                    <p className="font-semibold">{profile?.guardian_name || 'Not provided'}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="font-semibold">{profile?.guardian_phone || 'Not provided'}</p>
                  </div>
                  <div className="md:col-span-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-semibold">{profile?.guardian_email || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <h3 className="text-sm font-semibold mb-4">Emergency Contact Information</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <p className="text-xs text-muted-foreground">Name</p>
                    <p className="font-semibold">{profile?.emergency_contact_name || 'Not provided'}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="font-semibold">{profile?.emergency_contact_phone || 'Not provided'}</p>
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
