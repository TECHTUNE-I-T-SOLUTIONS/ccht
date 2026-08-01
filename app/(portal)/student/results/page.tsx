'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Award, FileText, Sparkles, Clock3, AlertCircle, CheckCircle2, Filter, Search, Download, X, Eye } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { generateStudentResults } from '@/lib/templates/student-results'

const gradePoints: Record<string, number> = { A: 5, B: 4, C: 3, D: 2, E: 1, F: 0 }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Result = any

export default function ResultsPage() {
  const router = useRouter()
  const [results, setResults] = useState<Result[]>([])
  const [studentProfile, setStudentProfile] = useState<any>(null)
  const [enrollment, setEnrollment] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterSession, setFilterSession] = useState('all')
  const [filterSemester, setFilterSemester] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedResult, setSelectedResult] = useState<Result | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [resultAssessment, setResultAssessment] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Load user profile, student profile, enrollments, and results
      const [profileRes, resultsRes, studentProfileRes, enrollmentRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase
          .from('results')
          .select('*')
          .eq('student_id', user.id)
          .order('academic_year', { ascending: false })
          .order('semester', { ascending: false }),
        supabase.from('student_profiles').select('*').eq('profile_id', user.id).single(),
        supabase.from('enrollments').select('*, program:programs(title, department:departments(name))').eq('student_id', user.id).eq('status', 'active').maybeSingle()
      ])

      if (profileRes.data) setUserProfile(profileRes.data)
      if (resultsRes.data) {
        // Map published boolean to status string
        const mapped = resultsRes.data.map((r: any) => ({
          ...r,
          status: r.published ? 'published' : 'pending',
          credit_units: 3 // Default credit units since results table doesn't have this
        }))
        setResults(mapped)
      }
      if (studentProfileRes.data) setStudentProfile(studentProfileRes.data)
      if (enrollmentRes.data) setEnrollment(enrollmentRes.data)
    } catch (error) {
      console.error('Failed to load data:', error)
      toast.error('Failed to load results')
    } finally {
      setLoading(false)
    }
  }

  const sessions = Array.from(new Set(results.map((r: any) => r.academic_year))).sort().reverse()
  const semesters = [1, 2]

  const filteredResults = results.filter((result: any) => {
    if (filterStatus !== 'all' && result.status !== filterStatus) return false
    if (filterSession !== 'all' && result.academic_year !== filterSession) return false
    if (filterSemester !== 'all' && result.semester !== parseInt(filterSemester)) return false
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return result.course_name?.toLowerCase().includes(query)
    }
    return true
  })

  // Group results by session and semester
  const groupedResults = filteredResults.reduce((acc: any, result: any) => {
    const key = `${result.academic_year} - Semester ${result.semester}`
    if (!acc[key]) acc[key] = []
    acc[key].push(result)
    return acc
  }, {} as Record<string, Result[]>)

  const calculatedGPAs = (() => {
    const semesters: Record<string, { totalPoints: number; totalUnits: number }> = {}
    let cgpaPoints = 0
    let cgpaUnits = 0

    results.forEach((r: any) => {
      if (r.status !== 'published' || !r.grade) return
      const units = r.credit_units || 3
      const grade = r.grade || 'F'
      const point = gradePoints[grade] ?? 0
      const key = `${r.academic_year || 'Session'} - Semester ${r.semester || 1}`
      if (!semesters[key]) semesters[key] = { totalPoints: 0, totalUnits: 0 }
      semesters[key].totalPoints += point * units
      semesters[key].totalUnits += units
      cgpaPoints += point * units
      cgpaUnits += units
    })

    return {
      semesterGPAs: Object.entries(semesters).map(([semester, val]) => ({
        semester,
        gpa: val.totalUnits > 0 ? (val.totalPoints / val.totalUnits).toFixed(2) : '0.00',
      })),
      overallCGPA: cgpaUnits > 0 ? (cgpaPoints / cgpaUnits).toFixed(2) : '0.00',
    }
  })()

  const downloadResults = async (sessionKey?: string) => {
    if (!studentProfile || !enrollment) {
      toast.error('Student data not loaded')
      return
    }

    const resultsToDownload = sessionKey ? groupedResults[sessionKey] : filteredResults
    
    if (resultsToDownload.length === 0) {
      toast.error('No results to download')
      return
    }

    const session = sessionKey ? sessionKey.split(' - ')[0] : filterSession === 'all' ? sessions[0] : filterSession
    const semester = sessionKey ? sessionKey.split(' - ')[1] : filterSemester === 'all' ? 'Semester 1' : `Semester ${filterSemester}`
    
    // Fetch assessment data and course codes for each result
    const resultsWithDetails = await Promise.all(
      resultsToDownload.map(async (r: any) => {
        let assessment = null
        let courseCode = r.course_code

        // Try to fetch assessment by assessment_id
        if (r.assessment_id) {
          const { data } = await supabase
            .from('assessments')
            .select('*')
            .eq('id', r.assessment_id)
            .single()
          assessment = data
        } else {
          // Fallback: try to find by course name and student
          const parsedCourseCode = r.course_name?.split(' - ')[0]
          if (parsedCourseCode) {
            const { data: courses } = await supabase
              .from('courses')
              .select('id, code')
              .ilike('code', parsedCourseCode)
              .limit(1)
            
            if (courses && courses.length > 0) {
              courseCode = courses[0].code
              const { data: assessmentData } = await supabase
                .from('assessments')
                .select('*')
                .eq('student_id', r.student_id)
                .eq('course_id', courses[0].id)
                .single()
              assessment = assessmentData
            }
          }
        }

        return { ...r, assessment, courseCode }
      })
    )
    
    const totalCredits = resultsWithDetails.reduce((sum: number, r: any) => sum + (r.credit_units || 3), 0)
    const totalGradePoints = resultsWithDetails.reduce((sum: number, r: any) => {
      if (!r.grade) return sum
      const units = r.credit_units || 3
      return sum + (gradePoints[r.grade] || 0) * units
    }, 0)
    const gpa = totalCredits > 0 ? totalGradePoints / totalCredits : 0

    const doc = generateStudentResults({
      firstName: userProfile?.first_name || '',
      lastName: userProfile?.last_name || '',
      matricNumber: studentProfile?.matric_number || '',
      program: enrollment?.program?.title || '',
      department: enrollment?.program?.department?.name || '',
      session,
      semester,
      level: studentProfile?.current_level || '100',
      results: resultsWithDetails.map((r: any) => ({
        courseCode: r.courseCode || r.course_code || 'N/A',
        courseTitle: r.course_name,
        credit: r.credit_units || 3,
        ca: r.assessment?.continuous_assessment || 0,
        exam: r.assessment?.exam_score || 0,
        total: r.score || 0,
        grade: r.grade || 'N/A',
        gradePoint: r.grade ? (gradePoints[r.grade] || 0) : 0
      })),
      totalCredits,
      totalGradePoints,
      gpa,
      cgpa: parseFloat(calculatedGPAs.overallCGPA),
      generatedDate: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    })

    doc.save(`Results_${sessionKey || 'All'}.pdf`)
    toast.success('Results downloaded')
  }

  const openResultDetail = async (result: any) => {
    setSelectedResult(result)
    setResultAssessment(null)
    setDetailDialogOpen(true)
    
    // Fetch the assessment for this result
    if (result.assessment_id) {
      const { data: assessment } = await supabase
        .from('assessments')
        .select('*')
        .eq('id', result.assessment_id)
        .single()
      setResultAssessment(assessment)
    } else {
      // Try to find by course name and student
      const courseCode = result.course_name?.split(' - ')[0]
      if (courseCode) {
        const { data: courses } = await supabase
          .from('courses')
          .select('id')
          .ilike('code', courseCode)
          .limit(1)
        
        if (courses && courses.length > 0) {
          const { data: assessment } = await supabase
            .from('assessments')
            .select('*')
            .eq('student_id', result.student_id)
            .eq('course_id', courses[0].id)
            .single()
          setResultAssessment(assessment)
        }
      }
    }
  }

  const getGradeColor = (grade: string | null) => {
    if (!grade) return 'bg-gray-500/10 text-gray-600'
    const gradeUpper = grade.toUpperCase()
    if (['A', 'B'].includes(gradeUpper)) return 'bg-emerald-500/10 text-emerald-600'
    if (['C'].includes(gradeUpper)) return 'bg-blue-500/10 text-blue-600'
    if (['D', 'E'].includes(gradeUpper)) return 'bg-amber-500/10 text-amber-600'
    return 'bg-red-500/10 text-red-600'
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20"><CheckCircle2 className="h-3 w-3 mr-1" /> Published</Badge>
      case 'pending':
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20"><Clock3 className="h-3 w-3 mr-1" /> Pending</Badge>
      default:
        return <Badge className="bg-gray-500/10 text-gray-600 border-gray-500/20"><AlertCircle className="h-3 w-3 mr-1" /> Unknown</Badge>
    }
  }

  if (loading) return <div className="p-8 font-technical">Loading results and grades...</div>

  const publishedResults = results.filter((r: any) => r.status === 'published')

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-border bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.12),transparent_30%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--accent-soft)))] p-6 md:p-8">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-extrabold">Academic transcript and results</h1>
            <p className="text-muted-foreground">View your GPA performance and exam scores</p>
          </div>
          {publishedResults.length > 0 && (
            <div className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-white dark:bg-black p-4 text-primary shadow-sm">
              <Award className="h-10 w-10" />
              <div>
                <span className="block text-[10px] font-technical uppercase font-bold tracking-wider">Cumulative CGPA</span>
                <span className="text-3xl font-black font-technical">{calculatedGPAs.overallCGPA}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Published Results</p>
              <p className="text-2xl font-bold">{results.filter((r: any) => r.status === 'published').length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-600">
              <Clock3 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pending Results</p>
              <p className="text-2xl font-bold">{results.filter((r: any) => r.status === 'pending').length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-gray-500/10 p-3 text-gray-600">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Courses</p>
              <p className="text-2xl font-bold">{results.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {results.length === 0 ? (
        <Card className="rounded-[2.5rem] border p-12 text-center">
          <FileText className="mx-auto mb-4 h-16 w-16 text-muted-foreground opacity-50" />
          <p className="text-lg text-muted-foreground">No results available</p>
          <p className="mt-2 text-sm text-muted-foreground">Results will appear here once exams are graded and published</p>
        </Card>
      ) : (
        <>
          {/* Filters */}
          <Card className="p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search courses..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 rounded-xl"
                  />
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[140px] rounded-xl">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterSession} onValueChange={setFilterSession}>
                  <SelectTrigger className="w-[140px] rounded-xl">
                    <SelectValue placeholder="Session" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sessions</SelectItem>
                    {sessions.map((session: string) => (
                      <SelectItem key={session} value={session}>{session}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterSemester} onValueChange={setFilterSemester}>
                  <SelectTrigger className="w-[140px] rounded-xl">
                    <SelectValue placeholder="Semester" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Semesters</SelectItem>
                    {semesters.map(sem => (
                      <SelectItem key={sem} value={sem.toString()}>Semester {sem}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={() => downloadResults()} className="rounded-xl">
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
              </div>
            </div>
          </Card>

          {/* Grouped Results */}
          {Object.keys(groupedResults).length === 0 ? (
            <Card className="rounded-[2.5rem] border p-12 text-center">
              <Filter className="mx-auto mb-4 h-16 w-16 text-muted-foreground opacity-50" />
              <p className="text-lg text-muted-foreground">No results match your filters</p>
            </Card>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedResults).map(([sessionKey, sessionResults]) => {
                const sessionResultsTyped = sessionResults as Result[]
                const total = sessionResultsTyped.length
                const published = sessionResultsTyped.filter((r: any) => r.status === 'published').length
                const avgScore = sessionResultsTyped
                  .filter((r: any) => r.status === 'published' && r.score)
                  .reduce((acc: number, r: any) => acc + (r.score || 0), 0) / (published || 1)

                return (
                  <Card key={sessionKey} className="rounded-[2.5rem] border bg-white dark:bg-black p-6 shadow-sm md:p-8">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-xl font-bold">{sessionKey}</h2>
                        <p className="text-sm text-muted-foreground">
                          {published} of {total} published | Avg Score: {avgScore.toFixed(1)}%
                        </p>
                      </div>
                      <Button 
                        onClick={() => downloadResults(sessionKey)}
                        variant="outline" 
                        size="sm"
                        className="rounded-xl"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="border-b bg-slate-50 dark:bg-slate-900">
                          <tr>
                            <th className="px-4 py-3 text-left font-semibold">Course</th>
                            <th className="px-4 py-3 text-left font-semibold">Credit</th>
                            <th className="px-4 py-3 text-left font-semibold">Score</th>
                            <th className="px-4 py-3 text-left font-semibold">Grade</th>
                            <th className="px-4 py-3 text-left font-semibold">GP</th>
                            <th className="px-4 py-3 text-left font-semibold">Status</th>
                            <th className="px-4 py-3 text-left font-semibold">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {sessionResultsTyped.map((result: any) => (
                            <tr key={result.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer" onClick={() => openResultDetail(result)}>
                              <td className="px-4 py-3">
                                <div>
                                  <p className="font-semibold">{result.course_name}</p>
                                </div>
                              </td>
                              <td className="px-4 py-3">{result.credit_units || 3}</td>
                              <td className="px-4 py-3 font-technical">
                                {result.status === 'published' ? (
                                  <span className="font-semibold">{result.score?.toFixed(2)}%</span>
                                ) : (
                                  <span className="text-muted-foreground">--</span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                {result.status === 'published' && result.grade ? (
                                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${getGradeColor(result.grade)}`}>
                                    {result.grade}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">--</span>
                                )}
                              </td>
                              <td className="px-4 py-3 font-technical">
                                {result.status === 'published' && result.grade ? (
                                  <span className="font-semibold">{gradePoints[result.grade] || 0}</span>
                                ) : (
                                  <span className="text-muted-foreground">--</span>
                                )}
                              </td>
                              <td className="px-4 py-3">{getStatusBadge(result.status)}</td>
                              <td className="px-4 py-3">
                                <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openResultDetail(result); }}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}

          {/* GPA Performance */}
          <Card className="rounded-[2.5rem] border bg-white dark:bg-black p-6 shadow-sm md:p-8">
            <h2 className="mb-6 flex items-center gap-2 text-xl font-bold">
              <Sparkles className="h-5 w-5 text-primary" />
              GPA performance history
            </h2>
            {calculatedGPAs.semesterGPAs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Clock3 className="mx-auto mb-4 h-12 w-12 opacity-50" />
                <p>GPA data will be available once results are published</p>
              </div>
            ) : (
              <div className="space-y-4">
                {calculatedGPAs.semesterGPAs.map((val) => (
                  <div key={val.semester} className="flex items-center justify-between rounded-2xl border bg-slate-50 dark:bg-slate-800 p-4">
                    <span className="text-sm font-bold">{val.semester}</span>
                    <div className="text-right">
                      <span className="block text-[10px] font-technical uppercase font-bold text-muted-foreground">GPA</span>
                      <span className="text-xl font-extrabold font-technical text-primary">{val.gpa}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}

      {/* Result Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-lg bg-white dark:bg-black">
          <DialogHeader>
            <DialogTitle>Result Details</DialogTitle>
            <DialogDescription>
              Detailed view of your course result.
            </DialogDescription>
          </DialogHeader>
          {selectedResult && (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Student Info */}
              <div className="rounded-lg border bg-slate-50 dark:bg-slate-800 p-4">
                <h3 className="font-semibold mb-2">Student Information</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-muted-foreground">Name:</span> <span className="font-medium">{userProfile?.first_name} {userProfile?.last_name}</span></div>
                  <div><span className="text-muted-foreground">Matric:</span> <span className="font-medium">{studentProfile?.matric_number || 'N/A'}</span></div>
                  <div><span className="text-muted-foreground">Program:</span> <span className="font-medium">{enrollment?.program?.title || 'N/A'}</span></div>
                  <div><span className="text-muted-foreground">Level:</span> <span className="font-medium">{studentProfile?.current_level || 'N/A'}</span></div>
                </div>
              </div>

              {/* Course Result */}
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">Course Result</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center pb-2 border-b border-blue-200 dark:border-blue-800">
                    <span className="text-sm text-blue-800 dark:text-blue-200">Course</span>
                    <span className="font-semibold text-blue-900 dark:text-blue-100 text-right text-sm">{selectedResult.course_name}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-blue-200 dark:border-blue-800">
                    <span className="text-sm text-blue-800 dark:text-blue-200">Academic Year</span>
                    <span className="font-semibold text-blue-900 dark:text-blue-100 text-sm">{selectedResult.academic_year}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-blue-200 dark:border-blue-800">
                    <span className="text-sm text-blue-800 dark:text-blue-200">Semester</span>
                    <span className="font-semibold text-blue-900 dark:text-blue-100 text-sm">Semester {selectedResult.semester}</span>
                  </div>
                  {selectedResult.status === 'published' && (
                    <>
                      <div className="flex justify-between items-center pb-2 border-b border-blue-200 dark:border-blue-800">
                        <span className="text-sm text-blue-800 dark:text-blue-200">Score</span>
                        <span className="font-semibold text-blue-900 dark:text-blue-100 text-sm">{selectedResult.score?.toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-blue-200 dark:border-blue-800">
                        <span className="text-sm text-blue-800 dark:text-blue-200">Grade</span>
                        <span className={`font-bold text-lg ${getGradeColor(selectedResult.grade)} px-3 py-1 rounded-full`}>
                          {selectedResult.grade}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-blue-200 dark:border-blue-800">
                        <span className="text-sm text-blue-800 dark:text-blue-200">Grade Point</span>
                        <span className="font-semibold text-blue-900 dark:text-blue-100 text-sm">{gradePoints[selectedResult.grade] || 0}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-blue-200 dark:border-blue-800">
                        <span className="text-sm text-blue-800 dark:text-blue-200">Credit Units</span>
                        <span className="font-semibold text-blue-900 dark:text-blue-100 text-sm">{selectedResult.credit_units || 3}</span>
                      </div>
                      {selectedResult.published_at && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-blue-800 dark:text-blue-200">Published</span>
                          <span className="font-semibold text-blue-900 dark:text-blue-100 text-sm">{new Date(selectedResult.published_at).toLocaleDateString()}</span>
                        </div>
                      )}
                    </>
                  )}
                  {selectedResult.status !== 'published' && (
                    <div className="flex items-center gap-2 text-amber-600 py-2">
                      <Clock3 className="h-4 w-4" />
                      <span className="text-sm">This result is pending and has not been published yet.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Assessment Breakdown */}
              {resultAssessment && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950">
                  <h3 className="font-semibold text-emerald-900 dark:text-emerald-100 mb-3">Assessment Breakdown</h3>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between p-2 rounded bg-white/50 dark:bg-black/20">
                        <span className="text-emerald-800 dark:text-emerald-200">CA 1 (max 15)</span>
                        <span className="font-bold text-emerald-900 dark:text-emerald-100">{parseFloat(resultAssessment.ca_1) || 0}</span>
                      </div>
                      <div className="flex justify-between p-2 rounded bg-white/50 dark:bg-black/20">
                        <span className="text-emerald-800 dark:text-emerald-200">CA 2 (max 15)</span>
                        <span className="font-bold text-emerald-900 dark:text-emerald-100">{parseFloat(resultAssessment.ca_2) || 0}</span>
                      </div>
                      <div className="flex justify-between p-2 rounded bg-white/50 dark:bg-black/20">
                        <span className="text-emerald-800 dark:text-emerald-200">Assignments (max 10)</span>
                        <span className="font-bold text-emerald-900 dark:text-emerald-100">{parseFloat(resultAssessment.assignments) || 0}</span>
                      </div>
                      <div className="flex justify-between p-2 rounded bg-white/50 dark:bg-black/20">
                        <span className="text-emerald-800 dark:text-emerald-200">Exam Score (max 60)</span>
                        <span className="font-bold text-emerald-900 dark:text-emerald-100">{parseFloat(resultAssessment.exam_score) || 0}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-2 mt-2 border-t border-emerald-200 dark:border-emerald-800">
                      <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">Continuous Assessment (CA)</span>
                      <span className="font-bold text-emerald-900 dark:text-emerald-100">{parseFloat(resultAssessment.continuous_assessment) || 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded bg-emerald-100 dark:bg-emerald-900/30">
                      <span className="text-sm font-bold text-emerald-900 dark:text-emerald-100">Total Score</span>
                      <span className="text-lg font-black text-emerald-900 dark:text-emerald-100">{parseFloat(resultAssessment.total_score) || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-emerald-800 dark:text-emerald-200">Assessment Grade</span>
                      <span className={`font-bold px-2 py-0.5 rounded text-xs ${getGradeColor(resultAssessment.grade)}`}>
                        {resultAssessment.grade}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-emerald-800 dark:text-emerald-200">Status</span>
                      <span className="font-semibold text-emerald-900 dark:text-emerald-100 capitalize">{resultAssessment.score_status}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end sticky bottom-0 bg-white dark:bg-black pt-2">
                <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
                  <X className="h-4 w-4 mr-2" /> Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}