'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Award, FileText, Sparkles, Clock3, AlertCircle, CheckCircle2, Filter, Search, Download } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { generateStudentResults } from '@/lib/templates/student-results'

const gradePoints: Record<string, number> = { A: 5, B: 4, C: 3, D: 2, E: 1, F: 0 }

type Result = {
  id: string
  course_name: string
  course_code?: string
  score: number | null
  grade: string | null
  semester: number
  academic_year: string
  credit_units: number
  status: 'published' | 'pending' | 'not_released'
  published_at?: string
}

type StudentProfile = {
  matric_number: string
  current_level: string
}

type Enrollment = {
  program_id: string
  program?: {
    title: string
    department?: {
      name: string
    }
  }
}

export default function ResultsPage() {
  const [results, setResults] = useState<Result[]>([])
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null)
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null)
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'pending'>('all')
  const [filterSession, setFilterSession] = useState('all')
  const [filterSemester, setFilterSemester] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [resultsRes, studentProfileRes, enrollmentRes] = await Promise.all([
        supabase.from('results').select('*').eq('student_id', user.id).order('academic_year', { ascending: false }),
        supabase.from('student_profiles').select('matric_number, current_level').eq('profile_id', user.id).single(),
        supabase.from('enrollments').select('*, program:programs(title, department:departments(name))').eq('student_id', user.id).eq('status', 'active').single()
      ])

      if (resultsRes.data) setResults(resultsRes.data)
      if (studentProfileRes.data) setStudentProfile(studentProfileRes.data)
      if (enrollmentRes.data) setEnrollment(enrollmentRes.data)
    } catch (error) {
      console.error('Failed to load data:', error)
      toast.error('Failed to load results')
    } finally {
      setLoading(false)
    }
  }

  const sessions = Array.from(new Set(results.map(r => r.academic_year))).sort().reverse()
  const semesters = [1, 2]

  const filteredResults = results.filter(result => {
    // Status filter
    if (filterStatus !== 'all' && result.status !== filterStatus) return false
    
    // Session filter
    if (filterSession !== 'all' && result.academic_year !== filterSession) return false
    
    // Semester filter
    if (filterSemester !== 'all' && result.semester !== parseInt(filterSemester)) return false
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return result.course_name.toLowerCase().includes(query) ||
             (result.course_code && result.course_code.toLowerCase().includes(query))
    }
    
    return true
  })

  // Group results by session and semester
  const groupedResults = filteredResults.reduce((acc, result) => {
    const key = `${result.academic_year} - Semester ${result.semester}`
    if (!acc[key]) acc[key] = []
    acc[key].push(result)
    return acc
  }, {} as Record<string, Result[]>)

  const calculatedGPAs = (() => {
    const semesters: Record<string, { totalPoints: number; totalUnits: number }> = {}
    let cgpaPoints = 0
    let cgpaUnits = 0

    results.forEach((r) => {
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

  const downloadResults = (sessionKey?: string) => {
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
    
    const totalCredits = resultsToDownload.reduce((sum, r) => sum + (r.credit_units || 3), 0)
    const totalGradePoints = resultsToDownload.reduce((sum, r) => {
      if (!r.grade) return sum
      const units = r.credit_units || 3
      return sum + (gradePoints[r.grade] || 0) * units
    }, 0)
    const gpa = totalCredits > 0 ? totalGradePoints / totalCredits : 0

    const doc = generateStudentResults({
      firstName: '', // Will be filled from profiles
      lastName: '', // Will be filled from profiles
      matricNumber: studentProfile.matric_number || '',
      program: enrollment.program?.title || '',
      department: enrollment.program?.department?.name || '',
      session,
      semester,
      level: studentProfile.current_level || '100',
      results: resultsToDownload.map(r => ({
        courseCode: r.course_code || 'N/A',
        courseTitle: r.course_name,
        credit: r.credit_units || 3,
        score: r.score || 0,
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600">
            <CheckCircle2 className="h-3 w-3" />
            Published
          </span>
        )
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-600">
            <Clock3 className="h-3 w-3" />
            Pending
          </span>
        )
      case 'not_released':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-500/10 px-3 py-1 text-xs font-semibold text-gray-600">
            <AlertCircle className="h-3 w-3" />
            Not Released
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-500/10 px-3 py-1 text-xs font-semibold text-gray-600">
            Unknown
          </span>
        )
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

  if (loading) return <div className="p-8 font-technical">Loading results and grades...</div>

  const publishedResults = results.filter(r => r.status === 'published')

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-border bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.12),transparent_30%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--accent-soft)))] p-6 md:p-8">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-extrabold">Academic transcript and results</h1>
            <p className="text-muted-foreground">View your GPA performance and exam scores</p>
          </div>
          {publishedResults.length > 0 && (
            <div className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-white p-4 text-primary shadow-sm">
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
              <p className="text-2xl font-bold">{results.filter(r => r.status === 'published').length}</p>
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
              <p className="text-2xl font-bold">{results.filter(r => r.status === 'pending').length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-gray-500/10 p-3 text-gray-600">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Not Released</p>
              <p className="text-2xl font-bold">{results.filter(r => r.status === 'not_released').length}</p>
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
              <div className="flex gap-2">
                <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
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
                    {sessions.map(session => (
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
              {Object.entries(groupedResults).map(([sessionKey, sessionResults]) => (
                <Card key={sessionKey} className="rounded-[2.5rem] border bg-white p-6 shadow-sm md:p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">{sessionKey}</h2>
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
                      <thead className="border-b bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold">Course</th>
                          <th className="px-4 py-3 text-left font-semibold">Credit</th>
                          <th className="px-4 py-3 text-left font-semibold">Score</th>
                          <th className="px-4 py-3 text-left font-semibold">Grade</th>
                          <th className="px-4 py-3 text-left font-semibold">GP</th>
                          <th className="px-4 py-3 text-left font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {sessionResults.map((result) => (
                          <tr key={result.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3">
                              <div>
                                <p className="font-semibold">{result.course_name}</p>
                                {result.course_code && (
                                  <p className="text-xs text-muted-foreground">{result.course_code}</p>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">{result.credit_units || 3}</td>
                            <td className="px-4 py-3 font-technical">
                              {result.status === 'published' ? (
                                <span className="font-semibold">{result.score}%</span>
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
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* GPA Performance */}
          <Card className="rounded-[2.5rem] border bg-white p-6 shadow-sm md:p-8">
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
                  <div key={val.semester} className="flex items-center justify-between rounded-2xl border bg-slate-50 p-4">
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
    </div>
  )
}
