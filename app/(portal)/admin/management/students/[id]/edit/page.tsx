'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Loader2, Save, Lock, User, MapPin, Shield, AlertCircle } from 'lucide-react'
import Link from 'next/link'

type StudentProfile = {
  id: string
  firstName: string
  lastName: string
  middleName?: string
  email: string
  phone: string
  avatarUrl?: string
  studentNumber: string
  matricNumber: string
  admissionSession: string
  admissionDate: string
  dateOfBirth: string
  gender: string
  bloodGroup: string
  genotype: string
  stateOfOrigin: string
  localGovernmentArea: string
  nationality: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  guardianName: string
  guardianPhone: string
  guardianEmail: string
  emergencyContactName: string
  emergencyContactPhone: string
  currentLevel: string
  admissionStatus: string
}

export default function StudentEditPage() {
  const params = useParams()
  const router = useRouter()
  const [student, setStudent] = useState<StudentProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPasswordSection, setShowPasswordSection] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const supabase = createClient()

  useEffect(() => {
    if (params.id) {
      loadStudent(params.id as string)
    }
  }, [params.id])

  const loadStudent = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, student_profiles(*)')
        .eq('id', id)
        .single()

      if (error) throw error

      const studentProfile = data.student_profiles || {}
      setStudent({
        id: data.id,
        firstName: data.first_name,
        lastName: data.last_name,
        middleName: data.middle_name,
        email: data.email,
        phone: data.phone || '',
        avatarUrl: data.avatar_url,
        studentNumber: studentProfile.student_number || '',
        matricNumber: studentProfile.matric_number || '',
        admissionSession: studentProfile.admission_session || '',
        admissionDate: studentProfile.admission_date || '',
        dateOfBirth: studentProfile.date_of_birth || '',
        gender: studentProfile.gender || '',
        bloodGroup: studentProfile.blood_group || '',
        genotype: studentProfile.genotype || '',
        stateOfOrigin: studentProfile.state_of_origin || '',
        localGovernmentArea: studentProfile.local_government_area || '',
        nationality: studentProfile.nationality || 'Nigerian',
        addressLine1: studentProfile.address_line_1 || '',
        addressLine2: studentProfile.address_line_2 || '',
        city: studentProfile.city || '',
        state: studentProfile.state || '',
        guardianName: studentProfile.guardian_name || '',
        guardianPhone: studentProfile.guardian_phone || '',
        guardianEmail: studentProfile.guardian_email || '',
        emergencyContactName: studentProfile.emergency_contact_name || '',
        emergencyContactPhone: studentProfile.emergency_contact_phone || '',
        currentLevel: studentProfile.current_level || '',
        admissionStatus: studentProfile.admission_status || 'active',
      })
    } catch (error) {
      console.error('Failed to load student:', error)
      toast.error('Failed to load student details')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!student) return

    try {
      setSaving(true)

      // Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: student.firstName,
          last_name: student.lastName,
          middle_name: student.middleName,
          email: student.email,
          phone: student.phone,
        })
        .eq('id', student.id)

      if (profileError) throw profileError

      // Update student_profiles table
      const { error: studentProfileError } = await supabase
        .from('student_profiles')
        .update({
          student_number: student.studentNumber,
          matric_number: student.matricNumber,
          admission_session: student.admissionSession,
          admission_date: student.admissionDate || null,
          date_of_birth: student.dateOfBirth || null,
          gender: student.gender,
          blood_group: student.bloodGroup,
          genotype: student.genotype,
          state_of_origin: student.stateOfOrigin,
          local_government_area: student.localGovernmentArea,
          nationality: student.nationality,
          address_line_1: student.addressLine1,
          address_line_2: student.addressLine2,
          city: student.city,
          state: student.state,
          guardian_name: student.guardianName,
          guardian_phone: student.guardianPhone,
          guardian_email: student.guardianEmail,
          emergency_contact_name: student.emergencyContactName,
          emergency_contact_phone: student.emergencyContactPhone,
          current_level: student.currentLevel,
          admission_status: student.admissionStatus,
        })
        .eq('profile_id', student.id)

      if (studentProfileError) throw studentProfileError

      toast.success('Student profile updated successfully')
      router.push(`/admin/management/students/${student.id}`)
    } catch (error) {
      console.error('Failed to update student:', error)
      toast.error('Failed to update student profile')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async () => {
    if (!student) return

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    try {
      setSaving(true)

      const { error } = await supabase.auth.admin.updateUserById(
        student.id,
        { password: newPassword }
      )

      if (error) throw error

      toast.success('Password changed successfully')
      setNewPassword('')
      setConfirmPassword('')
      setShowPasswordSection(false)
    } catch (error) {
      console.error('Failed to change password:', error)
      toast.error('Failed to change password')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!student) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Student not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/admin/management/students/${student.id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Edit Student Profile</h1>
          <p className="mt-1 text-sm text-muted-foreground">Update student information and settings</p>
        </div>
      </div>

      {/* Personal Information */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <User className="h-5 w-5" />
          Personal Information
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name *</Label>
            <Input
              id="firstName"
              value={student.firstName}
              onChange={(e) => setStudent({ ...student, firstName: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name *</Label>
            <Input
              id="lastName"
              value={student.lastName}
              onChange={(e) => setStudent({ ...student, lastName: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="middleName">Middle Name</Label>
            <Input
              id="middleName"
              value={student.middleName || ''}
              onChange={(e) => setStudent({ ...student, middleName: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={student.email}
              onChange={(e) => setStudent({ ...student, email: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={student.phone}
              onChange={(e) => setStudent({ ...student, phone: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dateOfBirth">Date of Birth</Label>
            <Input
              id="dateOfBirth"
              type="date"
              value={student.dateOfBirth}
              onChange={(e) => setStudent({ ...student, dateOfBirth: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <Select value={student.gender} onValueChange={(value) => setStudent({ ...student, gender: value })}>
              <SelectTrigger>
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
          <div className="space-y-2">
            <Label htmlFor="nationality">Nationality</Label>
            <Input
              id="nationality"
              value={student.nationality}
              onChange={(e) => setStudent({ ...student, nationality: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bloodGroup">Blood Group</Label>
            <Select value={student.bloodGroup} onValueChange={(value) => setStudent({ ...student, bloodGroup: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select blood group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A+">A+</SelectItem>
                <SelectItem value="A-">A-</SelectItem>
                <SelectItem value="B+">B+</SelectItem>
                <SelectItem value="B-">B-</SelectItem>
                <SelectItem value="AB+">AB+</SelectItem>
                <SelectItem value="AB-">AB-</SelectItem>
                <SelectItem value="O+">O+</SelectItem>
                <SelectItem value="O-">O-</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="genotype">Genotype</Label>
            <Select value={student.genotype} onValueChange={(value) => setStudent({ ...student, genotype: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select genotype" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AA">AA</SelectItem>
                <SelectItem value="AS">AS</SelectItem>
                <SelectItem value="SS">SS</SelectItem>
                <SelectItem value="AC">AC</SelectItem>
                <SelectItem value="CC">CC</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Academic Information */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <User className="h-5 w-5" />
          Academic Information
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="studentNumber">Student Number</Label>
            <Input
              id="studentNumber"
              value={student.studentNumber}
              onChange={(e) => setStudent({ ...student, studentNumber: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="matricNumber">Matric Number</Label>
            <Input
              id="matricNumber"
              value={student.matricNumber}
              onChange={(e) => setStudent({ ...student, matricNumber: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admissionSession">Admission Session</Label>
            <Input
              id="admissionSession"
              value={student.admissionSession}
              onChange={(e) => setStudent({ ...student, admissionSession: e.target.value })}
              placeholder="e.g., 2024/2025"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admissionDate">Admission Date</Label>
            <Input
              id="admissionDate"
              type="date"
              value={student.admissionDate}
              onChange={(e) => setStudent({ ...student, admissionDate: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currentLevel">Current Level</Label>
            <Select value={student.currentLevel} onValueChange={(value) => setStudent({ ...student, currentLevel: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="100">100 Level</SelectItem>
                <SelectItem value="200">200 Level</SelectItem>
                <SelectItem value="300">300 Level</SelectItem>
                <SelectItem value="400">400 Level</SelectItem>
                <SelectItem value="500">500 Level</SelectItem>
                <SelectItem value="600">600 Level</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="admissionStatus">Admission Status</Label>
            <Select value={student.admissionStatus} onValueChange={(value) => setStudent({ ...student, admissionStatus: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="graduated">Graduated</SelectItem>
                <SelectItem value="withdrawn">Withdrawn</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Address Information */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Address Information
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="addressLine1">Address Line 1</Label>
            <Input
              id="addressLine1"
              value={student.addressLine1}
              onChange={(e) => setStudent({ ...student, addressLine1: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="addressLine2">Address Line 2</Label>
            <Input
              id="addressLine2"
              value={student.addressLine2}
              onChange={(e) => setStudent({ ...student, addressLine2: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={student.city}
              onChange={(e) => setStudent({ ...student, city: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Input
              id="state"
              value={student.state}
              onChange={(e) => setStudent({ ...student, state: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="stateOfOrigin">State of Origin</Label>
            <Input
              id="stateOfOrigin"
              value={student.stateOfOrigin}
              onChange={(e) => setStudent({ ...student, stateOfOrigin: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="localGovernmentArea">Local Government Area</Label>
            <Input
              id="localGovernmentArea"
              value={student.localGovernmentArea}
              onChange={(e) => setStudent({ ...student, localGovernmentArea: e.target.value })}
            />
          </div>
        </div>
      </Card>

      {/* Guardian Information */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Guardian Information
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="guardianName">Guardian Name</Label>
            <Input
              id="guardianName"
              value={student.guardianName}
              onChange={(e) => setStudent({ ...student, guardianName: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="guardianPhone">Guardian Phone</Label>
            <Input
              id="guardianPhone"
              value={student.guardianPhone}
              onChange={(e) => setStudent({ ...student, guardianPhone: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="guardianEmail">Guardian Email</Label>
            <Input
              id="guardianEmail"
              type="email"
              value={student.guardianEmail}
              onChange={(e) => setStudent({ ...student, guardianEmail: e.target.value })}
            />
          </div>
        </div>
      </Card>

      {/* Emergency Contact */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Emergency Contact
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="emergencyContactName">Emergency Contact Name</Label>
            <Input
              id="emergencyContactName"
              value={student.emergencyContactName}
              onChange={(e) => setStudent({ ...student, emergencyContactName: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emergencyContactPhone">Emergency Contact Phone</Label>
            <Input
              id="emergencyContactPhone"
              value={student.emergencyContactPhone}
              onChange={(e) => setStudent({ ...student, emergencyContactPhone: e.target.value })}
            />
          </div>
        </div>
      </Card>

      {/* Password Change */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Password Management
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPasswordSection(!showPasswordSection)}
          >
            {showPasswordSection ? 'Cancel' : 'Change Password'}
          </Button>
        </div>
        {showPasswordSection && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 6 characters)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
            <div className="md:col-span-2">
              <Button
                onClick={handlePasswordChange}
                disabled={saving}
                className="w-full md:w-auto"
              >
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Lock className="h-4 w-4 mr-2" />}
                Update Password
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Link href={`/admin/management/students/${student.id}`}>
          <Button variant="outline">
            Cancel
          </Button>
        </Link>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save Changes
        </Button>
      </div>
    </div>
  )
}
