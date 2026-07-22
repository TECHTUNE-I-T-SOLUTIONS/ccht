'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, ClipboardList, Loader2, Calendar } from 'lucide-react'
import Link from 'next/link'

type ExamAssignment = {
  id: string
  exam_name: string
  course_name: string
  exam_date: string
  start_time: string
  end_time: string
  venue: string
  role: string
  status: string
}

export default function LecturerExamsPage() {
  const params = useParams()
  const [lecturer, setLecturer] = useState<any>(null)
  const [exams, setExams] = useState<ExamAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (params.id) {
      loadLecturerExams(params.id as string)
    }
  }, [params.id])

  const loadLecturerExams = async (id: string) => {
    try {
      // Load lecturer info
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*, teacher_profiles(*)')
        .eq('id', id)
        .single()

      setLecturer(profileData)

      // For now, show empty state - exam supervision assignments would come from a separate table
      setExams([])
    } catch (error) {
      console.error('Failed to load lecturer exams:', error)
      toast.error('Failed to load exams')
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
          <h1 className="text-3xl font-bold">Exam Supervision</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {lecturer ? `${lecturer.first_name} ${lecturer.last_name}'s exam duties` : 'Loading...'}
          </p>
        </div>
      </div>

      {exams.length === 0 ? (
        <Card className="p-12 text-center">
          <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
          <p className="text-lg text-muted-foreground">No exam supervision assignments</p>
          <p className="text-sm text-muted-foreground mt-2">This lecturer has not been assigned to any exam supervision duties yet</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {exams.map((exam) => (
            <Card key={exam.id} className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{exam.exam_name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{exam.course_name}</p>
                  <div className="flex items-center gap-3 mt-3">
                    <Badge variant="outline">{exam.role}</Badge>
                    <Badge variant={exam.status === 'scheduled' ? 'default' : 'secondary'}>
                      {exam.status}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{exam.exam_date}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {exam.start_time} - {exam.end_time}
                  </p>
                  {exam.venue && (
                    <p className="text-sm text-muted-foreground mt-1">{exam.venue}</p>
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