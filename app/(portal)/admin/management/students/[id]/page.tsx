'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Mail, Phone, Calendar, MapPin, BookOpen, Award, UserCheck, Loader2, Edit, GraduationCap, User, Shield, AlertCircle } from 'lucide-react'
import Link from 'next/link'

type StudentProfile = {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  avatar_url?: string
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

export default function StudentProfilePage() {
  const params = useParams()
  const [student, setStudent] = useState<StudentProfile | null>(null)
  const [loading, setLoading] = useState(true)
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

      // console.log('Full data from Supabase:', data)
      // console.log('Avatar URL from data:', data.avatar_url)

      const studentProfile = data.student_profiles || {}
      setStudent({
        id: data.id,
        firstName: data.first_name,
        lastName: data.last_name,
        email: data.email,
        phone: data.phone || 'N/A',
        avatar_url: data.avatar_url || null,
        studentNumber: studentProfile.student_number || 'N/A',
        matricNumber: studentProfile.matric_number || 'N/A',
        admissionSession: studentProfile.admission_session || 'N/A',
        admissionDate: studentProfile.admission_date || 'N/A',
        dateOfBirth: studentProfile.date_of_birth || 'N/A',
        gender: studentProfile.gender || 'N/A',
        bloodGroup: studentProfile.blood_group || 'N/A',
        genotype: studentProfile.genotype || 'N/A',
        stateOfOrigin: studentProfile.state_of_origin || 'N/A',
        localGovernmentArea: studentProfile.local_government_area || 'N/A',
        nationality: studentProfile.nationality || 'N/A',
        addressLine1: studentProfile.address_line_1 || 'N/A',
        addressLine2: studentProfile.address_line_2 || 'N/A',
        city: studentProfile.city || 'N/A',
        state: studentProfile.state || 'N/A',
        guardianName: studentProfile.guardian_name || 'N/A',
        guardianPhone: studentProfile.guardian_phone || 'N/A',
        guardianEmail: studentProfile.guardian_email || 'N/A',
        emergencyContactName: studentProfile.emergency_contact_name || 'N/A',
        emergencyContactPhone: studentProfile.emergency_contact_phone || 'N/A',
        currentLevel: studentProfile.current_level || 'N/A',
        admissionStatus: studentProfile.admission_status || 'active',
      })
    } catch (error) {
      console.error('Failed to load student:', error)
      toast.error('Failed to load student details')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
      inactive: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
      suspended: 'bg-red-500/10 text-red-600 border-red-500/20',
      graduated: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      withdrawn: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
    }
    return colors[status] || 'bg-gray-500/10 text-gray-600 border-gray-500/20'
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
        <Link href="/admin/management/students">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Student Profile</h1>
          <p className="mt-1 text-sm text-muted-foreground">View and manage student details</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/management/students/${student.id}/edit`}>
            <Button variant="outline" className="w-full md:w-auto">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      {/* Profile Header */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row items-start gap-6">
          {student.avatar_url && student.avatar_url.trim() !== '' && student.avatar_url !== 'N/A' ? (
            <img 
              src={student.avatar_url} 
              alt={`${student.firstName} ${student.lastName}`}
              className="h-20 w-20 rounded-full object-cover border-2 border-border"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-2xl">
              {student.firstName.charAt(0)}{student.lastName.charAt(0)}
            </div>
          )}
          <div className="flex-1">
            <h2 className="text-2xl font-bold">{student.firstName} {student.lastName}</h2>
            <p className="text-muted-foreground">{student.email}</p>
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <Badge className={getStatusColor(student.admissionStatus)}>
                {student.admissionStatus.replace('_', ' ')}
              </Badge>
              <span className="text-sm text-muted-foreground">{student.currentLevel}</span>
              <span className="text-sm text-muted-foreground">•</span>
              <span className="text-sm text-muted-foreground">{student.admissionSession}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Personal Information */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <User className="h-5 w-5" />
          Personal Information
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Full Name</p>
            <p className="font-medium">{student.firstName} {student.lastName}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <p className="font-medium">{student.email}</p>
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Phone</p>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <p className="font-medium">{student.phone}</p>
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Date of Birth</p>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <p className="font-medium">{student.dateOfBirth}</p>
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Gender</p>
            <p className="font-medium">{student.gender}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Nationality</p>
            <p className="font-medium">{student.nationality}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Blood Group</p>
            <p className="font-medium">{student.bloodGroup}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Genotype</p>
            <p className="font-medium">{student.genotype}</p>
          </div>
        </div>
      </Card>

      {/* Academic Information */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <GraduationCap className="h-5 w-5" />
          Academic Information
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Student Number</p>
            <p className="font-medium">{student.studentNumber}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Matric Number</p>
            <p className="font-medium">{student.matricNumber}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Admission Session</p>
            <p className="font-medium">{student.admissionSession}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Admission Date</p>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <p className="font-medium">{student.admissionDate}</p>
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Current Level</p>
            <p className="font-medium">{student.currentLevel}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Admission Status</p>
            <Badge className={getStatusColor(student.admissionStatus)}>
              {student.admissionStatus.replace('_', ' ')}
            </Badge>
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
          <div>
            <p className="text-sm text-muted-foreground">Address Line 1</p>
            <p className="font-medium">{student.addressLine1}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Address Line 2</p>
            <p className="font-medium">{student.addressLine2}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">City</p>
            <p className="font-medium">{student.city}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">State</p>
            <p className="font-medium">{student.state}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">State of Origin</p>
            <p className="font-medium">{student.stateOfOrigin}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Local Government Area</p>
            <p className="font-medium">{student.localGovernmentArea}</p>
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
          <div>
            <p className="text-sm text-muted-foreground">Guardian Name</p>
            <p className="font-medium">{student.guardianName}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Guardian Phone</p>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <p className="font-medium">{student.guardianPhone}</p>
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Guardian Email</p>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <p className="font-medium">{student.guardianEmail}</p>
            </div>
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
          <div>
            <p className="text-sm text-muted-foreground">Emergency Contact Name</p>
            <p className="font-medium">{student.emergencyContactName}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Emergency Contact Phone</p>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <p className="font-medium">{student.emergencyContactPhone}</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
