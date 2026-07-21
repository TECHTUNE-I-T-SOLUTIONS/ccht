'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Search, CheckCircle, Loader2, FileText, Download } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

type Result = {
  id: string
  student_id: string
  enrollment_id: string
  assessment_id: string
  score: number
  grade: string
  remarks?: string
  is_published: boolean
  published_at?: string
  created_at: string
  student?: {
    first_name: string
    last_name: string
    email: string
    student_profiles?: {
      matric_number: string
      current_level: string
    }
  }
  assessment?: {
    title: string
    course?: {
      code: string
      title: string
    }
    session?: {
      name: string
    }
    semester?: {
      semester_name: string
    }
  }
}

export default function StudentResultsPage() {
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const supabase = createClient()

  useEffect(() => {
    loadResults()
  }, [])

  const loadResults = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('results')
        .select(`
          *,
          student:profiles(
            first_name,
            last_name,
            email,
            student_profiles(
              matric_number,
              current_level
            )
          ),
          assessment:assessments(
            title,
            course:courses(code, title),
            session:academic_sessions(name),
            semester:academic_semesters(semester_name)
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setResults(data || [])
    } catch (error) {
      console.error('Failed to load results:', error)
      toast.error('Failed to load results')
    } finally {
      setLoading(false)
    }
  }

  const handlePublish = async (id: string) => {
    try {
      const { error } = await supabase
        .from('results')
        .update({ 
          is_published: true,
          published_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error
      toast.success('Result published successfully')
      loadResults()
    } catch (error) {
      console.error('Failed to publish result:', error)
      toast.error('Failed to publish result')
    }
  }

  const handleUnpublish = async (id: string) => {
    try {
      const { error } = await supabase
        .from('results')
        .update({ 
          is_published: false,
          published_at: null
        })
        .eq('id', id)

      if (error) throw error
      toast.success('Result unpublished successfully')
      loadResults()
    } catch (error) {
      console.error('Failed to unpublish result:', error)
      toast.error('Failed to unpublish result')
    }
  }

  const filteredResults = results.filter(result => {
    const matchesSearch = 
      `${result.student?.first_name} ${result.student?.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.student?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.student?.student_profiles?.matric_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.assessment?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.assessment?.course?.code?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'published' && result.is_published) ||
      (statusFilter === 'unpublished' && !result.is_published)
    return matchesSearch && matchesStatus
  })

  const getGradeColor = (grade: string) => {
    const gradeNum = parseFloat(grade)
    if (gradeNum >= 70) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
    if (gradeNum >= 60) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    if (gradeNum >= 50) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
    if (gradeNum >= 40) return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
    return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Student Results</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage and publish student examination results</p>
        </div>
      </div>

      <Card className="p-6">
        <div className="mb-4 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by student name, email, matric number, course, or assessment..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="unpublished">Unpublished</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredResults.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No results found</div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Matric No</TableHead>
                  <TableHead>Assessment</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Session</TableHead>
                  <TableHead>Semester</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResults.map((result) => (
                  <TableRow key={result.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{result.student?.first_name} {result.student?.last_name}</p>
                        <p className="text-sm text-muted-foreground">{result.student?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{result.student?.student_profiles?.matric_number || '-'}</TableCell>
                    <TableCell>{result.assessment?.title}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{result.assessment?.course?.code}</p>
                        <p className="text-sm text-muted-foreground">{result.assessment?.course?.title}</p>
                      </div>
                    </TableCell>
                    <TableCell>{result.assessment?.session?.name}</TableCell>
                    <TableCell>{result.assessment?.semester?.semester_name}</TableCell>
                    <TableCell className="font-semibold">{result.score}%</TableCell>
                    <TableCell>
                      <Badge className={getGradeColor(result.grade)}>
                        {result.grade}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {result.is_published ? (
                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                          <CheckCircle className="h-3 w-3 mr-1" /> Published
                        </Badge>
                      ) : (
                        <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400">
                          Draft
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {!result.is_published ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePublish(result.id)}
                          >
                            Publish
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUnpublish(result.id)}
                          >
                            Unpublish
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  )
}
