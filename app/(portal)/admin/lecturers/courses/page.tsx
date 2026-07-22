'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, BookOpen, Loader2, Calendar, Clock, MapPin } from 'lucide-react'
import Link from 'next/link'

type CourseAssignment = {
  id: string
  courseId: string
  courseCode: string
  courseTitle: string
  programTitle: string
  level: string
  semester: number
  timetableEntries: {
    id: string
    day_of_week: string
    start_time: string
    end_time: string
    venue: string
  }[]
}

export default function LecturerCoursesPage() {
  const params = useParams()
  const [lecturer, setLecturer] = useState<any>(null)
  const [courses, setCourses] = useState<CourseAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (params.id) {
      loadLecturerCourses(params.id as string)
    }
  }, [params.id])

  const loadLecturerCourses = async (id: string) => {
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
          day_of_week,
          start_time,
          end_time,
          venue,
          course:courses(code, title, program_id, level, semester)
        `)
        .eq('lecturer_id', id)

      // Group by course
      const courseMap = new Map<string, CourseAssignment>()
      
      (entriesData || []).forEach((entry: any) => {
        const courseId = entry.course_id
        if (!courseMap.has(courseId)) {
          courseMap.set(courseId, {
            id: courseId,
            courseId: courseId,
            courseCode: entry.course.code,
            courseTitle: entry.course.title,
            programTitle: '', // Will be loaded separately if needed
            level: entry.course.level,
            semester: entry.course.semester,
            timetableEntries: []
          })
        }
        const existingCourse = courseMap.get(courseId)
        if (existingCourse) {
          existingCourse.timetableEntries.push({
            id: entry.id,
            day_of_week: entry.day_of_week,
            start_time: entry.start_time,
            end_time: entry.end_time,
            venue: entry.venue
          })
        }
      })

      setCourses(Array.from(courseMap.values()))
    } catch (error) {
      console.error('Failed to load lecturer courses:', error)
      toast.error('Failed to load courses')
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
          <h1 className="text-3xl font-bold">Lecturer Courses</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {lecturer ? `${lecturer.first_name} ${lecturer.last_name}'s course assignments` : 'Loading...'}
          </p>
        </div>
      </div>

      {courses.length === 0 ? (
        <Card className="p-12 text-center">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
          <p className="text-lg text-muted-foreground">No courses assigned</p>
          <p className="text-sm text-muted-foreground mt-2">This lecturer has not been assigned to any courses yet</p>
        </Card>
      ) : (
        <div className="grid gap-6">
          {courses.map((course) => (
            <Card key={course.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{course.courseCode} - {course.courseTitle}</h3>
                  <div className="flex items-center gap-3 mt-2">
                    <Badge variant="outline">{course.level}L</Badge>
                    <Badge variant="outline">Semester {course.semester}</Badge>
                  </div>
                </div>
              </div>

              {course.timetableEntries.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-muted-foreground mb-2">Class Schedule</h4>
                  {course.timetableEntries.map((entry) => (
                    <div key={entry.id} className="flex items-center gap-4 rounded-lg border border-border p-3 bg-slate-50 dark:bg-slate-800/50">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{entry.day_of_week}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{entry.start_time} - {entry.end_time}</span>
                      </div>
                      {entry.venue && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{entry.venue}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}