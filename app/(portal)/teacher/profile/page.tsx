'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Upload, UserRound, Edit2, Save, X } from 'lucide-react'
import { toast } from 'sonner'

const QUALIFICATIONS = [
  'PhD',
  'MSc',
  'MPhil',
  'M.Tech',
  'M.A',
  'M.Ed',
  'BSc',
  'B.Tech',
  'B.A',
  'B.Ed',
  'HND',
  'ND',
  'NCE',
  'Other',
]

const EMPLOYMENT_TYPES = [
  'full_time',
  'part_time',
  'contract',
  'adjunct',
  'visiting',
]

export default function TeacherProfilePage() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [form, setForm] = useState<any>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    ;(async () => {
      const res = await fetch('/api/v1/teacher/profile')
      const data = await res.json()
      setProfile(data.data || null)
      setForm({
        first_name: data.data?.profile?.first_name || '',
        last_name: data.data?.profile?.last_name || '',
        phone: data.data?.profile?.phone || '',
        qualification: data.data?.qualification || '',
        specialization: data.data?.specialization || '',
        office_location: data.data?.office_location || '',
        office_hours: data.data?.office_hours || '',
        employment_type: data.data?.employment_type || '',
      })
      setLoading(false)
    })()
  }, [])

  const uploadPhoto = async (file: File) => {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('userId', profile?.profile_id || '')
      const res = await fetch('/api/v1/public/signup/upload-passport', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Upload failed')
      
      // Update profile with new Cloudinary URL
      setProfile((p: any) => ({ ...p, profile: { ...p.profile, avatar_url: data.url } }))
      
      // Also save to database
      await fetch('/api/v1/teacher/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          avatar_url: data.url,
        }),
      })
      
      toast.success('Profile photo updated')
      return data.url
    } catch (err: any) {
      toast.error(err.message || 'Upload failed')
      throw err
    } finally {
      setUploading(false)
    }
  }

  const saveProfile = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/v1/teacher/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          avatar_url: profile?.profile?.avatar_url || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Save failed')
      toast.success('Profile updated')
      setIsEditing(false)
    } catch (err: any) {
      toast.error(err.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const cancelEdit = () => {
    setForm({
      first_name: profile?.profile?.first_name || '',
      last_name: profile?.profile?.last_name || '',
      phone: profile?.profile?.phone || '',
      qualification: profile?.qualification || '',
      specialization: profile?.specialization || '',
      office_location: profile?.office_location || '',
      office_hours: profile?.office_hours || '',
      employment_type: profile?.employment_type || '',
    })
    setIsEditing(false)
  }

  if (loading) return <div className="p-8">Loading profile...</div>
  if (!profile) return <div className="p-8">Profile not found</div>

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <Card className="p-6">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border">
            {profile.profile?.avatar_url ? <img src={profile.profile.avatar_url} alt="" className="h-full w-full object-cover" /> : <UserRound className="h-12 w-12" />}
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold">{profile.profile?.first_name} {profile.profile?.last_name}</h1>
            <p className="text-sm text-muted-foreground">{profile.profile?.email}</p>
          </div>
          <label className="w-full">
            <Input 
              type="file" 
              accept="image/*" 
              disabled={uploading}
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                try {
                  await uploadPhoto(file)
                } catch (err: any) {
                  console.error(err)
                }
              }} 
            />
            {uploading && <p className="text-xs text-muted-foreground mt-2">Uploading to Cloudinary...</p>}
          </label>
        </div>
      </Card>
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Personal Information</h2>
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} size="sm">
              <Edit2 className="mr-2 h-4 w-4" />
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button onClick={saveProfile} disabled={saving} size="sm">
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Saving...' : 'Save'}
              </Button>
              <Button onClick={cancelEdit} variant="outline" size="sm">
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </div>
          )}
        </div>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>First Name</Label>
            <Input 
              value={form?.first_name || ''} 
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              disabled={!isEditing}
              className={!isEditing ? 'bg-muted' : ''}
            />
          </div>
          <div>
            <Label>Last Name</Label>
            <Input 
              value={form?.last_name || ''} 
              onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              disabled={!isEditing}
              className={!isEditing ? 'bg-muted' : ''}
            />
          </div>
          <div>
            <Label>Phone</Label>
            <Input 
              value={form?.phone || ''} 
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              disabled={!isEditing}
              className={!isEditing ? 'bg-muted' : ''}
            />
          </div>
          <div>
            <Label>Qualification</Label>
            <Select 
              value={form?.qualification || ''} 
              onValueChange={(value) => setForm({ ...form, qualification: value })}
              disabled={!isEditing}
            >
              <SelectTrigger className={!isEditing ? 'bg-muted' : ''}>
                <SelectValue placeholder="Select qualification" />
              </SelectTrigger>
              <SelectContent>
                {QUALIFICATIONS.map((qual) => (
                  <SelectItem key={qual} value={qual}>
                    {qual}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Specialization</Label>
            <Input 
              value={form?.specialization || ''} 
              onChange={(e) => setForm({ ...form, specialization: e.target.value })}
              disabled={!isEditing}
              className={!isEditing ? 'bg-muted' : ''}
            />
          </div>
          <div>
            <Label>Employment Type</Label>
            <Select 
              value={form?.employment_type || ''} 
              onValueChange={(value) => setForm({ ...form, employment_type: value })}
              disabled={!isEditing}
            >
              <SelectTrigger className={!isEditing ? 'bg-muted' : ''}>
                <SelectValue placeholder="Select employment type" />
              </SelectTrigger>
              <SelectContent>
                {EMPLOYMENT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Office Location</Label>
            <Input 
              value={form?.office_location || ''} 
              onChange={(e) => setForm({ ...form, office_location: e.target.value })}
              disabled={!isEditing}
              className={!isEditing ? 'bg-muted' : ''}
            />
          </div>
          <div>
            <Label>Office Hours</Label>
            <Textarea 
              value={form?.office_hours || ''} 
              onChange={(e) => setForm({ ...form, office_hours: e.target.value })}
              disabled={!isEditing}
              className={!isEditing ? 'bg-muted' : ''}
            />
          </div>
        </div>
      </Card>
    </div>
  )
}
