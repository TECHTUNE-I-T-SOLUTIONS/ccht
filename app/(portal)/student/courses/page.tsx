'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { BookOpen } from 'lucide-react'

export default function CoursesPage() {
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const getEnrollments = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('enrollments')
          .select('*, programs(*)')
          .eq('student_id', user.id)
          .eq('status', 'active')
        setEnrollments(data || [])
      }
      setLoading(false)
    }

    getEnrollments()
  }, [])

  if (loading) return <div className="p-8">Loading courses...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Courses</h1>
        <p className="text-muted-foreground">View your enrolled programs and coursework</p>
      </div>

      {enrollments.length === 0 ? (
        <Card className="p-12 text-center">
          <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
          <p className="text-lg text-muted-foreground">No active enrollments</p>
          <p className="text-sm text-muted-foreground mt-2">Contact administration to enroll in a program</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {enrollments.map((enrollment) => (
            <Card key={enrollment.id} className="p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-lg font-bold mb-2">{enrollment.programs?.title}</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p><span className="text-foreground font-medium">Duration:</span> {enrollment.programs?.duration_months} {enrollment.programs?.duration_unit}</p>
                <p><span className="text-foreground font-medium">Level:</span> {enrollment.programs?.level}</p>
                <p><span className="text-foreground font-medium">Status:</span> <span className="text-green-600 font-medium">{enrollment.status}</span></p>
                <p><span className="text-foreground font-medium">Enrolled:</span> {new Date(enrollment.enrollment_date).toLocaleDateString()}</p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
