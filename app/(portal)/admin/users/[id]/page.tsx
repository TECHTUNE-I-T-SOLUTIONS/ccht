'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Save, UserRound } from 'lucide-react'
import { toast } from 'sonner'
import { getUserDetailsAction, updateUserAction } from '@/app/actions/admin/user-actions'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminUserDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'student'
  })

  useEffect(() => {
    if (id) loadUser()
  }, [id])

  const loadUser = async () => {
    setLoading(true)
    try {
      const res = await getUserDetailsAction(id as string)
      if (res.success && res.data) {
        setUser(res.data)
        setFormData({
          firstName: res.data.first_name || '',
          lastName: res.data.last_name || '',
          email: res.data.email || '',
          phone: res.data.phone || '',
          role: res.data.role || 'student'
        })
      } else {
        toast.error('Failed to load user details: ' + res.error)
      }
    } catch (err) {
      toast.error('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const res = await updateUserAction(id as string, formData)
      if (res.success) {
        toast.success('User updated successfully')
        loadUser()
      } else {
        toast.error(res.error || 'Failed to update user')
      }
    } catch (err) {
      toast.error('An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return <div className="flex h-[50vh] items-center justify-center">Loading user details...</div>
  }

  if (!user) {
    return <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
      <p>User not found.</p>
      <Button asChild><Link href="/admin/users">Back to Users</Link></Button>
    </div>
  }

  return (
    <div className="space-y-8">
      <div className="rounded-[2.5rem] border border-border bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.12),transparent_30%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--accent-soft)))] p-8 md:p-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
          <Button variant="ghost" size="icon" className="rounded-full bg-white/50 dark:bg-slate-900/50" asChild>
            <Link href="/admin/users"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-border bg-white dark:bg-slate-900">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <UserRound className="h-8 w-8 text-primary" />
              )}
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">{user.role}</p>
              <h1 className="mt-1 text-3xl font-extrabold md:text-4xl">{user.first_name} {user.last_name}</h1>
              <p className="mt-1 text-sm text-foreground/75">{user.email}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        <Card className="rounded-[2rem] border bg-white dark:bg-slate-900 shadow-sm p-6 md:col-span-2">
          <h2 className="text-xl font-bold mb-6">Edit Profile</h2>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">First Name</label>
                <Input required value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Last Name</label>
                <Input required value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone</label>
                <Input type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <Select value={formData.role} onValueChange={(val) => setFormData({...formData, role: val})}>
                <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="aspirant">Aspirant</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isSubmitting} className="rounded-xl px-6">
                <Save className="mr-2 h-4 w-4" /> {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Card>

        <Card className="rounded-[2rem] border bg-white dark:bg-slate-900 shadow-sm p-6">
          <h2 className="text-xl font-bold mb-6">Role Details</h2>
          <div className="space-y-4">
            {user.role === 'student' && user.student_profiles?.[0] && (
              <>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Matric Number</p>
                  <p className="font-medium">{user.student_profiles[0].matric_number || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Current Level</p>
                  <p className="font-medium">{user.student_profiles[0].current_level || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Status</p>
                  <p className="font-medium capitalize">{user.student_profiles[0].admission_status}</p>
                </div>
              </>
            )}
            {user.role === 'teacher' && user.teacher_profiles?.[0] && (
              <>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Staff Number</p>
                  <p className="font-medium">{user.teacher_profiles[0].staff_number || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Department</p>
                  <p className="font-medium">{user.teacher_profiles[0].department || 'N/A'}</p>
                </div>
              </>
            )}
            {user.role === 'admin' && user.admin_profiles?.[0] && (
              <>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Staff ID</p>
                  <p className="font-medium">{user.admin_profiles[0].staff_id || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Scope</p>
                  <p className="font-medium capitalize">{user.admin_profiles[0].admin_scope}</p>
                </div>
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
