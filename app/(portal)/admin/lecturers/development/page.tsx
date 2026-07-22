'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, GraduationCap, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function LecturerDevelopmentPage() {
  const params = useParams()
  const [lecturer, setLecturer] = useState<any>(null)
  const [development, setDevelopment] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (params.id) {
      loadLecturerDevelopment(params.id as string)
    }
  }, [params.id])

  const loadLecturerDevelopment = async (id: string) => {
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*, teacher_profiles(*)')
        .eq('id', id)
        .single()

      setLecturer(profileData)
      setDevelopment([]) // Placeholder
    } catch (error) {
      console.error('Failed to load development data:', error)
      toast.error('Failed to load development data')
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
          <h1 className="text-3xl font-bold">Professional Development</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {lecturer ? `${lecturer.first_name} ${lecturer.last_name}'s professional development` : 'Loading...'}
          </p>
        </div>
      </div>

      <Card className="p-12 text-center">
        <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
        <p className="text-lg text-muted-foreground">No development records</p>
        <p className="text-sm text-muted-foreground mt-2">Professional development records will appear here</p>
      </Card>
    </div>
  )
}