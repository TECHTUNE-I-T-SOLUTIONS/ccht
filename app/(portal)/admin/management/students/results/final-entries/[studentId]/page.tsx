'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Loader2, Search, Edit, Save, X, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useIsMobile } from '@/hooks/use-mobile'
import { createClient } from '@/lib/supabase/client'

type Student = {
  matric_number: string
  current_level: string
  profiles?: {
    id: string
    first_name: string
    last_name: string
    email: string
  }[]
}

type FinalResult = {
  id: string
  student_id: string
  enrollment_id: string
  session_id: string
  semester_id: string
  gpa: number
  cgpa: number
  total_credit_units: number
  total_grade_points: number
  academic_standing: string
  remarks: string
  session?: {
    name: string
  }[]
  semester?: {
    semester_name: string
  }[]
}

type Course = {
  id: string
  code: string
  title: string
  credit_units: number
}

type Enrollment = {
  id: string
  student_id: string
  program_id: string
  program?: {
    title: string
  }[]
  selected_courses?: {
    course: {
      id: string
      code: string
      title: string
    }[]
  }[]
}

type Session = {
  id: string
  name: string
}

type Semester = {
  id: string
  semester_name: string
}

export default function FinalEntriesPage() {
  const params = useParams()
  const router = useRouter()
  const studentId = params.studentId as string
  const supabase = createClient()

  const [student, setStudent] = useState<Student | null>(null)
  const [finalResults, setFinalResults] = useState<FinalResult[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('gpa')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const isMobile = useIsMobile()
  const [editingResult, setEditingResult] = useState<FinalResult | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newResult, setNewResult] = useState({
    enrollment_id: '',
    session_id: '',
    semester_id: '',
    gpa: 0,
    cgpa: 0,
    total_credit_units: 0,
    total_grade_points: 0,
    academic_standing: 'good',
    remarks: ''
  })

  useEffect(() => {
    loadData()
  }, [studentId])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load student details
      const { data: studentData, error: studentError } = await supabase
        .from('student_profiles')
        .select(`
          matric_number,
          current_level,
          profiles!student_profiles_profile_id_fkey(
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('profile_id', studentId)
        .single()

      if (studentError) throw studentError
      setStudent(studentData)

      // Load existing final results
      const { data: resultsData, error: resultsError } = await supabase
        .from('final_results')
        .select(`
          *,
          session:academic_sessions(name),
          semester:academic_semesters(semester_name)
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })

      if (resultsError) throw resultsError
      setFinalResults(resultsData || [])

      // Load dropdown data
      const [coursesRes, enrollmentsRes, sessionsRes, semestersRes] = await Promise.all([
        supabase.from('courses').select('id, code, title, credit_units').order('code'),
        supabase
          .from('enrollments')
          .select(`
            id,
            student_id,
            program_id,
            program:programs(title),
            selected_courses:selected_courses(
              course:courses(id, code, title)
            )
          `)
          .eq('student_id', studentId),
        supabase.from('academic_sessions').select('id, name').order('name'),
        supabase.from('academic_semesters').select('id, semester_name').order('semester_name')
      ])

      if (coursesRes.error) throw coursesRes.error
      if (enrollmentsRes.error) throw enrollmentsRes.error
      if (sessionsRes.error) throw sessionsRes.error
      if (semestersRes.error) throw semestersRes.error

      setCourses(coursesRes.data || [])
      setEnrollments(enrollmentsRes.data || [])
      setSessions(sessionsRes.data || [])
      setSemesters(semestersRes.data || [])
    } catch (error) {
      console.error('Failed to load data:', error)
      toast.error('Failed to load student data')
    } finally {
      setLoading(false)
    }
  }

  const handleEditResult = (result: FinalResult) => {
    setEditingResult(result)
    setEditDialogOpen(true)
  }

  const handleSaveResult = async () => {
    if (!editingResult) return

    try {
      const { error } = await supabase
        .from('final_results')
        .update({
          gpa: editingResult.gpa,
          cgpa: editingResult.cgpa,
          total_credit_units: editingResult.total_credit_units,
          total_grade_points: editingResult.total_grade_points,
          academic_standing: editingResult.academic_standing,
          remarks: editingResult.remarks
        })
        .eq('id', editingResult.id)

      if (error) throw error
      toast.success('Final result updated successfully')
      setEditDialogOpen(false)
      loadData()
    } catch (error) {
      console.error('Failed to update final result:', error)
      toast.error('Failed to update final result')
    }
  }

  const handleCreateResult = async () => {
    try {
      const { error } = await supabase
        .from('final_results')
        .insert({
          student_id: studentId,
          enrollment_id: newResult.enrollment_id,
          session_id: newResult.session_id,
          semester_id: newResult.semester_id,
          gpa: newResult.gpa,
          cgpa: newResult.cgpa,
          total_credit_units: newResult.total_credit_units,
          total_grade_points: newResult.total_grade_points,
          academic_standing: newResult.academic_standing,
          remarks: newResult.remarks
        })

      if (error) throw error
      toast.success('Final result created successfully')
      setCreateDialogOpen(false)
      setNewResult({
        enrollment_id: '',
        session_id: '',
        semester_id: '',
        gpa: 0,
        cgpa: 0,
        total_credit_units: 0,
        total_grade_points: 0,
        academic_standing: 'good',
        remarks: ''
      })
      loadData()
    } catch (error) {
      console.error('Failed to create final result:', error)
      toast.error('Failed to create final result')
    }
  }

  const getStandingColor = (standing: string) => {
    if (standing === 'first_class' || standing === 'excellent') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
    if (standing === 'second_class_upper' || standing === 'very_good') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    if (standing === 'second_class_lower' || standing === 'good') return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
    if (standing === 'third_class' || standing === 'fair') return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
    return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
  }

  const filteredResults = finalResults.filter(result => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch =
      result.session?.[0]?.name?.toLowerCase().includes(searchLower) ||
      result.semester?.[0]?.semester_name?.toLowerCase().includes(searchLower) ||
      result.academic_standing?.toLowerCase().includes(searchLower)
    
    const matchesStatus = statusFilter === 'all' || result.academic_standing === statusFilter
    
    return matchesSearch && matchesStatus
  }).sort((a, b) => {
    let comparison = 0
    if (sortBy === 'gpa') {
      comparison = a.gpa - b.gpa
    } else if (sortBy === 'cgpa') {
      comparison = a.cgpa - b.cgpa
    }
    return sortOrder === 'asc' ? comparison : -comparison
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/management/students/results/all-students">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">
              {student?.profiles?.[0]?.first_name} {student?.profiles?.[0]?.last_name}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {student?.matric_number} • {student?.current_level}
            </p>
          </div>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="border border-primary hover:text-blue-600 hover:shadow-lg hover:shadow-blue-700">
              <Plus className="h-4 w-4 mr-2" /> Add Final Result
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-black">
            <DialogHeader>
              <DialogTitle>Create New Final Result</DialogTitle>
              <DialogDescription>
                Enter the final result details for this student.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Enrollment</Label>
                  <Select
                    value={newResult.enrollment_id}
                    onValueChange={(value) => setNewResult({ ...newResult, enrollment_id: value })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select enrollment" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {enrollments.map((enrollment) => (
                        <SelectItem key={enrollment.id} value={enrollment.id}>
                          {enrollment.program?.[0]?.title || 'No Program'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Session</Label>
                  <Select
                    value={newResult.session_id}
                    onValueChange={(value) => setNewResult({ ...newResult, session_id: value })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select session" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {sessions.map((session) => (
                        <SelectItem key={session.id} value={session.id}>
                          {session.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Semester</Label>
                <Select
                  value={newResult.semester_id}
                  onValueChange={(value) => setNewResult({ ...newResult, semester_id: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {semesters.map((semester) => (
                      <SelectItem key={semester.id} value={semester.id}>
                        {semester.semester_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>GPA</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="5"
                    value={newResult.gpa}
                    onChange={(e) => setNewResult({ ...newResult, gpa: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>CGPA</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="5"
                    value={newResult.cgpa}
                    onChange={(e) => setNewResult({ ...newResult, cgpa: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Total Credit Units</Label>
                  <Input
                    type="number"
                    value={newResult.total_credit_units}
                    onChange={(e) => setNewResult({ ...newResult, total_credit_units: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>Total Grade Points</Label>
                  <Input
                    type="number"
                    value={newResult.total_grade_points}
                    onChange={(e) => setNewResult({ ...newResult, total_grade_points: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Academic Standing</Label>
                  <Select
                    value={newResult.academic_standing}
                    onValueChange={(value) => setNewResult({ ...newResult, academic_standing: value })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="first_class">First Class</SelectItem>
                      <SelectItem value="second_class_upper">Second Class Upper</SelectItem>
                      <SelectItem value="second_class_lower">Second Class Lower</SelectItem>
                      <SelectItem value="third_class">Third Class</SelectItem>
                      <SelectItem value="pass">Pass</SelectItem>
                      <SelectItem value="fail">Fail</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Remarks</Label>
                  <Input
                    value={newResult.remarks}
                    onChange={(e) => setNewResult({ ...newResult, remarks: e.target.value })}
                    placeholder="Optional remarks"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  <X className="h-4 w-4 mr-2" /> Cancel
                </Button>
                <Button onClick={handleCreateResult} className="border border-primary hover:text-blue-600 hover:shadow-lg hover:shadow-blue-700">
                  <Save className="h-4 w-4 mr-2" /> Create
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-6">
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by session, semester, or standing..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Standing" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Standing</SelectItem>
                <SelectItem value="first_class">First Class</SelectItem>
                <SelectItem value="second_class_upper">Second Class Upper</SelectItem>
                <SelectItem value="second_class_lower">Second Class Lower</SelectItem>
                <SelectItem value="third_class">Third Class</SelectItem>
                <SelectItem value="pass">Pass</SelectItem>
                <SelectItem value="fail">Fail</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpa">GPA</SelectItem>
                <SelectItem value="cgpa">CGPA</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </Button>
          </div>
        </div>

        {filteredResults.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No final results found</div>
        ) : isMobile ? (
          <div className="space-y-4">
            {filteredResults.map((result) => (
              <Card key={result.id} className="p-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{result.session?.[0]?.name}</p>
                      <p className="text-sm text-muted-foreground">{result.semester?.[0]?.semester_name}</p>
                    </div>
                    <Badge className={getStandingColor(result.academic_standing)}>
                      {result.academic_standing}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>GPA: {result.gpa.toFixed(2)}</div>
                    <div className="font-semibold">CGPA: {result.cgpa.toFixed(2)}</div>
                    <div>Credits: {result.total_credit_units}</div>
                    <div>Grade Points: {result.total_grade_points}</div>
                  </div>
                  {result.remarks && (
                    <p className="text-sm text-muted-foreground">Remarks: {result.remarks}</p>
                  )}
                  <div className="pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => handleEditResult(result)}
                    >
                      <Edit className="h-4 w-4 mr-2" /> Edit
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Session</TableHead>
                  <TableHead>Semester</TableHead>
                  <TableHead>GPA</TableHead>
                  <TableHead>CGPA</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Grade Points</TableHead>
                  <TableHead>Standing</TableHead>
                  <TableHead>Remarks</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResults.map((result) => (
                  <TableRow key={result.id}>
                    <TableCell>{result.session?.[0]?.name || '-'}</TableCell>
                    <TableCell>{result.semester?.[0]?.semester_name || '-'}</TableCell>
                    <TableCell className="font-semibold">{result.gpa.toFixed(2)}</TableCell>
                    <TableCell className="font-semibold">{result.cgpa.toFixed(2)}</TableCell>
                    <TableCell>{result.total_credit_units}</TableCell>
                    <TableCell>{result.total_grade_points}</TableCell>
                    <TableCell>
                      <Badge className={getStandingColor(result.academic_standing)}>
                        {result.academic_standing}
                      </Badge>
                    </TableCell>
                    <TableCell>{result.remarks || '-'}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditResult(result)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Edit Result Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-black">
          <DialogHeader>
            <DialogTitle>Edit Final Result</DialogTitle>
            <DialogDescription>
              Update the final result for this student.
            </DialogDescription>
          </DialogHeader>
          {editingResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>GPA</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="5"
                    value={editingResult.gpa}
                    onChange={(e) => setEditingResult({ ...editingResult, gpa: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>CGPA</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="5"
                    value={editingResult.cgpa}
                    onChange={(e) => setEditingResult({ ...editingResult, cgpa: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Total Credit Units</Label>
                  <Input
                    type="number"
                    value={editingResult.total_credit_units}
                    onChange={(e) => setEditingResult({ ...editingResult, total_credit_units: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label>Total Grade Points</Label>
                  <Input
                    type="number"
                    value={editingResult.total_grade_points}
                    onChange={(e) => setEditingResult({ ...editingResult, total_grade_points: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div>
                <Label>Academic Standing</Label>
                <Select
                  value={editingResult.academic_standing}
                  onValueChange={(value) => setEditingResult({ ...editingResult, academic_standing: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="first_class">First Class</SelectItem>
                    <SelectItem value="second_class_upper">Second Class Upper</SelectItem>
                    <SelectItem value="second_class_lower">Second Class Lower</SelectItem>
                    <SelectItem value="third_class">Third Class</SelectItem>
                    <SelectItem value="pass">Pass</SelectItem>
                    <SelectItem value="fail">Fail</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Remarks</Label>
                <Input
                  value={editingResult.remarks}
                  onChange={(e) => setEditingResult({ ...editingResult, remarks: e.target.value })}
                  placeholder="Optional remarks"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  <X className="h-4 w-4 mr-2" /> Cancel
                </Button>
                <Button onClick={handleSaveResult} className="border border-primary hover:shadow-lg hover:shadow-blue-600">
                  <Save className="h-4 w-4 mr-2" /> Save
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
