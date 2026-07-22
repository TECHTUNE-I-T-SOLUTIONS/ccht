'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Mail, Phone, Calendar, MapPin, BookOpen, Award, UserCheck, Loader2, Edit } from 'lucide-react'
import Link from 'next/link'

type LecturerProfile = {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  employeeNumber: string
  staffNumber: string
  qualification: string
  specialization: string
  department: string
  employmentType: string
  employmentStatus: string
  dateJoined: string
  officeLocation: string
  officeHours: string
  canPublishResults: boolean
  canEnterScores: boolean
}

export default function LecturerProfilePage() {
  const params = useParams()
  const [lecturer, setLecturer] = useState<LecturerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (params.id) {
      loadLecturer(params.id as string)
    }
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
      setLecturer({
        id: data.id,
        firstName: data.first_name,
        lastName: data.last_name,
        email: data.email,
        phone: data.phone || 'N/A',
        employeeNumber: teacherProfile.employee_number || 'N/A',
        staffNumber: teacherProfile.staff_number || 'N/A',
        qualification: teacherProfile.qualification || 'N/A',
        specialization: teacherProfile.specialization || 'N/A',
        department: teacherProfile.department || 'N/A',
        employmentType: teacherProfile.employment_type || 'N/A',
        employmentStatus: teacherProfile.employment_status || 'active',
        dateJoined: teacherProfile.date_joined || 'N/A',
        officeLocation: teacherProfile.office_location || 'N/A',
        officeHours: teacherProfile.office_hours || 'N/A',
        canPublishResults: teacherProfile.can_publish_results || false,
        canEnterScores: teacherProfile.can_enter_scores || false,
      })
    } catch (error) {
      console.error('Failed to load lecturer:', error)
      toast.error('Failed to load lecturer details')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
      inactive: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
      suspended: 'bg-red-500/10 text-red-600 border-red-500/20',
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

  if (!lecturer) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Lecturer not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/lecturers">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Lecturer Profile</h1>
          <p className="mt-1 text-sm text-muted-foreground">View and manage lecturer details</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/lecturers/${lecturer.id}/edit`}>
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
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-2xl">
            {lecturer.firstName.charAt(0)}{lecturer.lastName.charAt(0)}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold">{lecturer.firstName} {lecturer.lastName}</h2>
            <p className="text-muted-foreground">{lecturer.email}</p>
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <Badge className={getStatusColor(lecturer.employmentStatus)}>
                {lecturer.employmentStatus.replace('_', ' ')}
              </Badge>
              <span className="text-sm text-muted-foreground">{lecturer.employmentType.replace('_', ' ')}</span>
              <span className="text-sm text-muted-foreground">•</span>
              <span className="text-sm text-muted-foreground">{lecturer.department}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Personal Information */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <UserCheck className="h-5 w-5" />
          Personal Information
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Full Name</p>
            <p className="font-medium">{lecturer.firstName} {lecturer.lastName}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <p className="font-medium">{lecturer.email}</p>
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Phone</p>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <p className="font-medium">{lecturer.phone}</p>
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Date Joined</p>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <p className="font-medium">{lecturer.dateJoined}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Employment Information */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Award className="h-5 w-5" />
          Employment Information
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Employee Number</p>
            <p className="font-medium">{lecturer.employeeNumber}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Staff Number</p>
            <p className="font-medium">{lecturer.staffNumber}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Qualification</p>
            <p className="font-medium">{lecturer.qualification}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Specialization</p>
            <p className="font-medium">{lecturer.specialization}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Department</p>
            <p className="font-medium">{lecturer.department}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Employment Type</p>
            <p className="font-medium">{lecturer.employmentType.replace('_', ' ')}</p>
          </div>
        </div>
      </Card>

      {/* Office Information */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Office Information
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Office Location</p>
            <p className="font-medium">{lecturer.officeLocation}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Office Hours</p>
            <p className="font-medium">{lecturer.officeHours}</p>
          </div>
        </div>
      </Card>

      {/* Permissions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Permissions
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div>
              <p className="font-medium">Publish Results</p>
              <p className="text-sm text-muted-foreground">Can publish student results</p>
            </div>
            <Badge variant={lecturer.canPublishResults ? "default" : "secondary"}>
              {lecturer.canPublishResults ? 'Allowed' : 'Not Allowed'}
            </Badge>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div>
              <p className="font-medium">Enter Scores</p>
              <p className="text-sm text-muted-foreground">Can enter student scores</p>
            </div>
            <Badge variant={lecturer.canEnterScores ? "default" : "secondary"}>
              {lecturer.canEnterScores ? 'Allowed' : 'Not Allowed'}
            </Badge>
          </div>
        </div>
      </Card>
    </div>
  )
}