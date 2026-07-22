'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, History, Loader2, Calendar } from 'lucide-react'
import Link from 'next/link'

type EmploymentHistory = {
  id: string
  position: string
  department: string
  start_date: string
  end_date: string | null
  status: string
}

export default function LecturerHistoryPage() {
  const params = useParams()
  const [lecturer, setLecturer] = useState<any>(null)
  const [history, setHistory] = useState<EmploymentHistory[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (params.id) {
      loadLecturerHistory(params.id as string)
    }
  }, [params.id])

  const loadLecturerHistory = async (id: string) => {
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*, teacher_profiles(*)')
        .eq('id', id)
        .single()

      setLecturer(profileData)
      
      // For now, show current employment as history
      // In a real app, you'd have a separate employment_history table
      if (profileData.teacher_profiles) {
        setHistory([{
          id: 'current',
          position: 'Lecturer',
          department: profileData.teacher_profiles.department || 'N/A',
          start_date: profileData.teacher_profiles.date_joined || new Date().toISOString(),
          end_date: null,
          status: profileData.teacher_profiles.employment_status || 'active'
        }])
      }
    } catch (error) {
      console.error('Failed to load lecturer history:', error)
      toast.error('Failed to load history')
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
          <h1 className="text-3xl font-bold">Employment History</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {lecturer ? `${lecturer.first_name} ${lecturer.last_name}'s employment records` : 'Loading...'}
          </p>
        </div>
      </div>

      {history.length === 0 ? (
        <Card className="p-12 text-center">
          <History className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
          <p className="text-lg text-muted-foreground">No employment history</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {history.map((record) => (
            <Card key={record.id} className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{record.position}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{record.department}</p>
                  <div className="flex items-center gap-3 mt-3">
                    <Badge variant={record.status === 'active' ? 'default' : 'secondary'}>
                      {record.status}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{new Date(record.start_date).toLocaleDateString()}</span>
                  </div>
                  {record.end_date && (
                    <p className="text-sm text-muted-foreground mt-1">
                      to {new Date(record.end_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}