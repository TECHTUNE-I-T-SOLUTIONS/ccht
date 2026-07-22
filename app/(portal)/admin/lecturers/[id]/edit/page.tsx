'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'

type Department = {
  id: string
  name: string
}

type Program = {
  id: string
  title: string
  department_id: string
}

export default function EditLecturerPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [departments, setDepartments] = useState<Department[]>([])
  const [programs, setPrograms] = useState<Program[]>([])
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    employeeNumber: '',
    staffNumber: '',
    qualification: '',
    specialization: '',
    departmentId: '',
    programId: '',
    employmentType: 'full_time',
    employmentStatus: 'active',
    dateJoined: '',
    officeLocation: '',
    officeHours: '',
    canPublishResults: true,
    canEnterScores: true,
  })

  useEffect(() => {
    if (params.id) {
      loadLecturer(params.id as string)
    }
    loadDepartments()
  }, [params.id])

  const loadLecturer = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, teacher_profiles(*)')
        .eq('id', id)
        .single()

      if (error) throw error

      const teacherProfile = data.teacher_profiles || {}
      setFormData({
        firstName: data.first_name,
        lastName: data.last_name,
        email: data.email,
        phone: data.phone || '',
        employeeNumber: teacherProfile.employee_number || '',
        staffNumber: teacherProfile.staff_number || '',
        qualification: teacherProfile.qualification || '',
        specialization: teacherProfile.specialization || '',
        departmentId: teacherProfile.department || '',
        programId: '',
        employmentType: teacherProfile.employment_type || 'full_time',
        employmentStatus: teacherProfile.employment_status || 'active',
        dateJoined: teacherProfile.date_joined || '',
        officeLocation: teacherProfile.office_location || '',
        officeHours: teacherProfile.office_hours || '',
        canPublishResults: teacherProfile.can_publish_results || false,
        canEnterScores: teacherProfile.can_enter_scores || false,
      })

      // Load programs for the department
      if (teacherProfile.department) {
        const { data: progData } = await supabase
          .from('programs')
          .select('*')
          .eq('department_id', teacherProfile.department)
          .eq('is_active', true)
        setPrograms(progData || [])
      }
    } catch (error) {
      console.error('Failed to load lecturer:', error)
      toast.error('Failed to load lecturer details')
    }
  }

  const loadDepartments = async () => {
    try {
      const { data } = await supabase.from('departments').select('*').order('name')
      setDepartments(data || [])
    } catch (error) {
      console.error('Failed to load departments:', error)
    }
  }

  const handleDepartmentChange = async (departmentId: string) => {
    setFormData({ ...formData, departmentId, programId: '' })
    try {
      const { data } = await supabase.from('programs').select('*').eq('department_id', departmentId).eq('is_active', true)
      setPrograms(data || [])
    } catch (error) {
      console.error('Failed to load programs:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone,
        })
        .eq('id', params.id)

      if (profileError) throw profileError

      // Update teacher profile
      const { error: teacherError } = await supabase
        .from('teacher_profiles')
        .update({
          employee_number: formData.employeeNumber,
          staff_number: formData.staffNumber,
          qualification: formData.qualification,
          specialization: formData.specialization,
          department: formData.departmentId,
          employment_type: formData.employmentType,
          date_joined: formData.dateJoined,
          office_location: formData.officeLocation,
          office_hours: formData.officeHours,
          can_publish_results: formData.canPublishResults,
          can_enter_scores: formData.canEnterScores,
          employment_status: formData.employmentStatus,
        })
        .eq('profile_id', params.id)

      if (teacherError) throw teacherError

      toast.success('Lecturer updated successfully')
      router.push(`/admin/lecturers/${params.id}`)
    } catch (error: any) {
      console.error('Failed to update lecturer:', error)
      toast.error(error.message || 'Failed to update lecturer')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Lecturer</h1>
          <p className="mt-1 text-sm text-muted-foreground">Update lecturer information</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Personal Information */}
          <Card className="p-6 lg:col-span-2">
            <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
          </Card>

          {/* Employment Information */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Employment Information</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="employeeNumber">Employee Number *</Label>
                <Input
                  id="employeeNumber"
                  value={formData.employeeNumber}
                  onChange={(e) => setFormData({ ...formData, employeeNumber: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="staffNumber">Staff Number</Label>
                <Input
                  id="staffNumber"
                  value={formData.staffNumber}
                  onChange={(e) => setFormData({ ...formData, staffNumber: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="employmentType">Employment Type *</Label>
                <Select value={formData.employmentType} onValueChange={(value) => setFormData({ ...formData, employmentType: value })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_time">Full-Time</SelectItem>
                    <SelectItem value="part_time">Part-Time</SelectItem>
                    <SelectItem value="adjunct">Adjunct</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="employmentStatus">Employment Status *</Label>
                <Select value={formData.employmentStatus} onValueChange={(value) => setFormData({ ...formData, employmentStatus: value })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="dateJoined">Date Joined *</Label>
                <Input
                  id="dateJoined"
                  type="date"
                  value={formData.dateJoined}
                  onChange={(e) => setFormData({ ...formData, dateJoined: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>
            </div>
          </Card>

          {/* Academic Information */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Academic Information</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="qualification">Qualification *</Label>
                <Input
                  id="qualification"
                  value={formData.qualification}
                  onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                  placeholder="e.g., PhD, MSc, BSc"
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="specialization">Specialization *</Label>
                <Input
                  id="specialization"
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  placeholder="e.g., Computer Science, Mathematics"
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="departmentId">Department *</Label>
                <Select value={formData.departmentId} onValueChange={handleDepartmentChange}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="programId">Program</Label>
                <Select value={formData.programId} onValueChange={(value) => setFormData({ ...formData, programId: value })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select program" />
                  </SelectTrigger>
                  <SelectContent>
                    {programs.map((prog) => (
                      <SelectItem key={prog.id} value={prog.id}>{prog.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Office Information */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Office Information</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="officeLocation">Office Location</Label>
                <Input
                  id="officeLocation"
                  value={formData.officeLocation}
                  onChange={(e) => setFormData({ ...formData, officeLocation: e.target.value })}
                  placeholder="e.g., Room 201, Building A"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="officeHours">Office Hours</Label>
                <Textarea
                  id="officeHours"
                  value={formData.officeHours}
                  onChange={(e) => setFormData({ ...formData, officeHours: e.target.value })}
                  placeholder="e.g., Mon-Fri, 9:00 AM - 12:00 PM"
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>
          </Card>

          {/* Permissions */}
          <Card className="p-6 lg:col-span-2">
            <h3 className="text-lg font-semibold mb-4">Permissions</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="canPublishResults"
                  checked={formData.canPublishResults}
                  onChange={(e) => setFormData({ ...formData, canPublishResults: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="canPublishResults" className="cursor-pointer">
                  Can Publish Results
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="canEnterScores"
                  checked={formData.canEnterScores}
                  onChange={(e) => setFormData({ ...formData, canEnterScores: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="canEnterScores" className="cursor-pointer">
                  Can Enter Scores
                </Label>
              </div>
            </div>
          </Card>

          {/* Submit Button */}
          <div className="lg:col-span-2">
            <Button type="submit" disabled={loading} className="w-full md:w-auto">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating Lecturer...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Update Lecturer
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}