'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, BookOpen, Clock, Calendar, Loader2, TrendingUp } from 'lucide-react'
import Link from 'next/link'

type WorkloadData = {
  totalCourses: number
  totalHours: number
  totalClasses: number
  courses: {
    courseCode: string
    courseTitle: string
    level: string
    semester: number
    weeklyHours: number
    classCount: number
  }[]
}

export default function LecturerWorkloadPage() {
  const params = useParams()
  const [lecturer, setLecturer] = useState<any>(null)
  const [workload, setWorkload] = useState<WorkloadData>({
    totalCourses: 0,
    totalHours: 0,
    totalClasses: 0,
    courses: []
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (params.id) {
      loadLecturerWorkload(params.id as string)
    }
  }, [params.id])

  const loadLecturerWorkload = async (id: string) => {
    try {
      // Load lecturer info
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*, teacher_profiles(*)')
        .eq('id', id)
        .single()

      setLecturer(profileData)

      // Load timetable entries for this lecturer
      const { data: entriesData } = await supabase
        .from('timetable_entries')
        .select(`
          id,
          course_id,
          start_time,
          end_time,
          course:courses(code, title, level, semester)
        `)
        .eq('lecturer_id', id)

      // Calculate workload
      const courseMap = new Map<string, any>()
      let totalHours = 0
      let totalClasses = 0

      (entriesData || []).forEach((entry: any) => {
        const courseId = entry.course_id
        const startTime = entry.start_time
        const endTime = entry.end_time
        
        // Calculate hours
        const start = new Date(`2000-01-01T${startTime}`)
        const end = new Date(`2000-01-01T${endTime}`)
        const hours = Number((end.getTime() - start.getTime()) / (1000 * 60 * 60))
        
        totalHours = Number(totalHours) + hours
        totalClasses = Number(totalClasses) + 1

        if (!courseMap.has(courseId)) {
          courseMap.set(courseId, {
            courseCode: entry.course.code,
            courseTitle: entry.course.title,
            level: entry.course.level,
            semester: entry.course.semester,
            weeklyHours: 0,
            classCount: 0
          })
        }
        
        const course = courseMap.get(courseId)!
        course.weeklyHours += hours
        course.classCount += 1
      })

      setWorkload({
        totalCourses: courseMap.size,
        totalHours: Math.round(totalHours * 100) / 100,
        totalClasses: totalClasses,
        courses: Array.from(courseMap.values())
      })
    } catch (error) {
      console.error('Failed to load lecturer workload:', error)
      toast.error('Failed to load workload')
    } finally {
      setLoading(false)
    }
  }

  const getWorkloadColor = (hours: number) => {
    if (hours <= 6) return 'text-emerald-600'
    if (hours <= 12) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getWorkloadStatus = (hours: number) => {
    if (hours <= 6) return 'Light'
    if (hours <= 12) return 'Moderate'
    return 'Heavy'
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
          <h1 className="text-3xl font-bold">Lecturer Workload</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {lecturer ? `${lecturer.first_name} ${lecturer.last_name}'s teaching workload` : 'Loading...'}
          </p>
        </div>
      </div>

      {/* Workload Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Courses</p>
              <p className="text-3xl font-bold">{workload.totalCourses}</p>
            </div>
            <BookOpen className="h-8 w-8 text-blue-600" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Weekly Hours</p>
              <p className={`text-3xl font-bold ${getWorkloadColor(workload.totalHours)}`}>
                {workload.totalHours}
              </p>
            </div>
            <Clock className="h-8 w-8 text-purple-600" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Classes/Week</p>
              <p className="text-3xl font-bold">{workload.totalClasses}</p>
            </div>
            <Calendar className="h-8 w-8 text-emerald-600" />
          </div>
        </Card>
      </div>

      {/* Workload Status */}
      <Card className="p-6">
        <div className="flex items-center gap-3">
          <TrendingUp className="h-6 w-6 text-primary" />
          <div>
            <p className="text-sm text-muted-foreground">Workload Status</p>
            <p className="text-xl font-semibold">{getWorkloadStatus(workload.totalHours)}</p>
          </div>
        </div>
      </Card>

      {/* Course Breakdown */}
      {workload.courses.length === 0 ? (
        <Card className="p-12 text-center">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
          <p className="text-lg text-muted-foreground">No courses assigned</p>
          <p className="text-sm text-muted-foreground mt-2">This lecturer has not been assigned to any courses yet</p>
        </Card>
      ) : (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Course Breakdown</h3>
          <div className="space-y-3">
            {workload.courses.map((course, index) => (
              <div key={index} className="flex items-center justify-between rounded-lg border border-border p-4">
                <div className="flex-1">
                  <p className="font-semibold">{course.courseCode} - {course.courseTitle}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline">{course.level}L</Badge>
                    <Badge variant="outline">Semester {course.semester}</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Classes/Week</p>
                    <p className="font-semibold">{course.classCount}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Hours/Week</p>
                    <p className={`font-semibold ${getWorkloadColor(course.weeklyHours)}`}>
                      {course.weeklyHours}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}