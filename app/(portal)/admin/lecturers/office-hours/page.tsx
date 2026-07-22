'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Clock, Loader2, Calendar } from 'lucide-react'
import Link from 'next/link'

export default function LecturerOfficeHoursPage() {
  const params = useParams()
  const [lecturer, setLecturer] = useState<any>(null)
  const [officeHours, setOfficeHours] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (params.id) {
      loadLecturerOfficeHours(params.id as string)
    }
  }, [params.id])

  const loadLecturerOfficeHours = async (id: string) => {
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*, teacher_profiles(*)')
        .eq('id', id)
        .single()

      setLecturer(profileData)
      
      // Get office hours from teacher profile
      if (profileData.teacher_profiles?.office_hours) {
        setOfficeHours([{
          id: '1',
          schedule: profileData.teacher_profiles.office_hours,
          location: profileData.teacher_profiles.office_location || 'TBD',
          isActive: true
        }])
      }
    } catch (error) {
      console.error('Failed to load office hours:', error)
      toast.error('Failed to load office hours')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/admin/lecturers/${params.id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Office Hours</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {lecturer ? `${lecturer.first_name} ${lecturer.last_name}'s office hours` : 'Loading...'}
          </p>
        </div>
      </div>

      {officeHours.length === 0 ? (
        <Card className="p-12 text-center">
          <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
          <p className="text-lg text-muted-foreground">No office hours scheduled</p>
          <p className="text-sm text-muted-foreground mt-2">Office hours can be configured in the lecturer's profile</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {officeHours.map((slot) => (
            <Card key={slot.id} className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Office Hours</h3>
                  <p className="text-sm text-muted-foreground mt-1">{slot.schedule}</p>
                  <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{slot.location}</span>
                  </div>
                </div>
                <Badge variant={slot.isActive ? 'default' : 'secondary'}>
                  {slot.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}