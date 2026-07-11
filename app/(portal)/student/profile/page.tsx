'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { User } from 'lucide-react'

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState<any>({})
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        const { data } = await supabase.from('profiles').select('*').eq('id', authUser.id).single()
        setUser(data)
        setFormData(data)
      }
      setLoading(false)
    }

    getUser()
  }, [])

  const handleSave = async () => {
    const { error } = await supabase.from('profiles').update(formData).eq('id', user.id)
    if (!error) {
      setUser(formData)
      setEditing(false)
    }
  }

  if (loading) return <div className="p-8">Loading profile...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Profile</h1>
          <p className="text-muted-foreground">Manage your account information</p>
        </div>
        <Button onClick={() => setEditing(!editing)}>{editing ? 'Cancel' : 'Edit Profile'}</Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="rounded-[2rem] border bg-white p-6 lg:col-span-1">
          <div className="text-center">
            <User className="mx-auto mb-4 h-20 w-20 text-primary opacity-30" />
            <h2 className="text-xl font-bold">
              {user?.first_name} {user?.last_name}
            </h2>
            <p className="mt-1 text-sm capitalize text-muted-foreground">{user?.role} account</p>
            <p className="mt-4 text-xs text-muted-foreground">Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</p>
          </div>
        </Card>

        <Card className="rounded-[2rem] border bg-white p-6 lg:col-span-2">
          <h2 className="mb-4 text-lg font-bold">Personal Information</h2>
          {editing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">First Name</label>
                  <Input value={formData.first_name || ''} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Last Name</label>
                  <Input value={formData.last_name || ''} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Email</label>
                <Input value={formData.email || ''} disabled className="bg-muted" />
                <p className="mt-1 text-xs text-muted-foreground">Email cannot be changed</p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Phone</label>
                <Input value={formData.phone || ''} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+234..." />
              </div>
              <Button onClick={handleSave} className="w-full">Save Changes</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">First Name</p>
                  <p className="font-medium">{user?.first_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Name</p>
                  <p className="font-medium">{user?.last_name}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{user?.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{user?.phone || 'Not set'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Account Status</p>
                <p className={`font-medium ${user?.is_active ? 'text-green-600' : 'text-red-600'}`}>{user?.is_active ? 'Active' : 'Inactive'}</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
