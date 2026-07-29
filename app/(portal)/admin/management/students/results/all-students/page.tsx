'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, Loader2, ArrowLeft, User } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

type Student = {
  id: string
  first_name: string
  last_name: string
  email: string
  student_profiles?: {
    matric_number: string
    current_level: string
  }[]
}

export default function AllStudentsResultsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const supabase = createClient()

  useEffect(() => {
    loadStudents()
  }, [])

  const loadStudents = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          email,
          student_profiles(
            matric_number,
            current_level
          )
        `)
        .eq('role', 'student')
        .order('last_name', { ascending: true })

      if (error) throw error
      setStudents(data || [])
    } catch (error) {
      console.error('Failed to load students:', error)
      toast.error('Failed to load students')
    } finally {
      setLoading(false)
    }
  }

  const filteredStudents = students.filter(student => {
    const searchLower = searchTerm.toLowerCase()
    const profile = student.student_profiles?.[0]
    return (
      `${student.first_name} ${student.last_name}`.toLowerCase().includes(searchLower) ||
      student.email?.toLowerCase().includes(searchLower) ||
      profile?.matric_number?.toLowerCase().includes(searchLower)
    )
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/management/students/results">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">All Students' Results</h1>
            <p className="mt-1 text-sm text-muted-foreground">View and manage results for all registered students</p>
          </div>
        </div>
      </div>

      <Card className="p-6">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by student name, email, or matric number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {searchTerm ? 'No students found matching your search' : 'No students registered'}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredStudents.map((student) => (
              <Link
                key={student.id}
                href={`/admin/management/students/results/all-students/${student.id}`}
              >
                <Card className="group p-6 hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary/50">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <User className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate">
                        {student.first_name} {student.last_name}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">{student.email}</p>
                      {student.student_profiles?.[0]?.matric_number && (
                        <Badge variant="outline" className="mt-2 text-xs">
                          {student.student_profiles[0].matric_number}
                        </Badge>
                      )}
                      {student.student_profiles?.[0]?.current_level && (
                        <Badge variant="secondary" className="mt-2 ml-2 text-xs">
                          {student.student_profiles[0].current_level}
                        </Badge>
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
