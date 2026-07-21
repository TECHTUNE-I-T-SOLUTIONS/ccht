'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { GraduationCap, Search, Filter, Download, Eye, TrendingUp, Award, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ExamService } from '@/lib/services/exam.service'

type ExamResult = {
  id: string
  aspirant_id: string
  aspirant_name?: string
  aspirant_email?: string
  exam_type: string
  score: number
  total_questions: number
  percentage: number
  grade: string
  status: string
  submitted_at: string
  answers?: Record<string, string>
}

export default function AdminScreeningResultsPage() {
  const [results, setResults] = useState<ExamResult[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [gradeFilter, setGradeFilter] = useState('all')

  useEffect(() => {
    loadResults()
  }, [])

  const loadResults = async () => {
    try {
      setLoading(true)
      // For now, we'll load all results. In a real implementation, you'd want to paginate this
      const { createAdminClient } = await import('@/lib/supabase/admin')
      const supabase = createAdminClient()
      const { data, error } = await supabase
        .from('entrance_exam_results')
        .select(`
          *,
          profiles!entrance_exam_results_aspirant_id_fkey (
            first_name,
            last_name,
            email
          )
        `)
        .order('submitted_at', { ascending: false })

      if (error) throw error

      const formattedResults = data?.map((result: any) => ({
        ...result,
        aspirant_name: result.profiles ? `${result.profiles.first_name} ${result.profiles.last_name}` : null,
        aspirant_email: result.profiles?.email || null,
      })) || []

      setResults(formattedResults)
    } catch (error) {
      console.error('Failed to load exam results:', error)
    } finally {
      setLoading(false)
    }
  }

  const getGradeColor = (grade: string) => {
    const colors: Record<string, string> = {
      'A': 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
      'B': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      'C': 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
      'D': 'bg-orange-500/10 text-orange-600 border-orange-500/20',
      'E': 'bg-red-500/10 text-red-600 border-red-500/20',
      'F': 'bg-red-500/10 text-red-600 border-red-500/20',
    }
    return colors[grade] || 'bg-gray-500/10 text-gray-600 border-gray-500/20'
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'submitted': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      'reviewed': 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
      'graded': 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    }
    return colors[status] || 'bg-gray-500/10 text-gray-600 border-gray-500/20'
  }

  const filteredResults = results.filter(result => {
    const matchesSearch = 
      `${result.aspirant_name || ''} ${result.aspirant_email || ''} ${result.id}`.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || result.status === statusFilter
    const matchesGrade = gradeFilter === 'all' || result.grade === gradeFilter
    return matchesSearch && matchesStatus && matchesGrade
  })

  const stats = {
    total: results.length,
    average: results.length > 0 ? Math.round(results.reduce((sum, r) => sum + r.percentage, 0) / results.length) : 0,
    passed: results.filter(r => r.percentage >= 50).length,
    failed: results.filter(r => r.percentage < 50).length,
    aGrades: results.filter(r => r.grade === 'A').length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Screening Exam Results</h1>
          <p className="mt-1 text-sm text-muted-foreground">View and manage entrance examination results</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export Results
          </Button>
          <Button className="gap-2" onClick={loadResults}>
            <GraduationCap className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Exams</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <GraduationCap className="h-8 w-8 text-blue-600" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Average Score</p>
              <p className="text-2xl font-bold">{stats.average}%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-emerald-600" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Passed</p>
              <p className="text-2xl font-bold">{stats.passed}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-emerald-600" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Failed</p>
              <p className="text-2xl font-bold">{stats.failed}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">A Grades</p>
              <p className="text-2xl font-bold">{stats.aGrades}</p>
            </div>
            <Award className="h-8 w-8 text-purple-600" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by aspirant name, email, or result ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="reviewed">Reviewed</SelectItem>
              <SelectItem value="graded">Graded</SelectItem>
            </SelectContent>
          </Select>
          <Select value={gradeFilter} onValueChange={setGradeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by grade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Grades</SelectItem>
              <SelectItem value="A">A</SelectItem>
              <SelectItem value="B">B</SelectItem>
              <SelectItem value="C">C</SelectItem>
              <SelectItem value="D">D</SelectItem>
              <SelectItem value="E">E</SelectItem>
              <SelectItem value="F">F</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Results Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Loading exam results...</p>
          </div>
        </div>
      ) : filteredResults.length === 0 ? (
        <Card className="p-12 text-center">
          <GraduationCap className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-semibold">No exam results found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {searchTerm || statusFilter !== 'all' || gradeFilter !== 'all' 
              ? 'Try adjusting your search or filters' 
              : 'No exam results have been submitted yet'}
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Aspirant</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Score</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Grade</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Submitted</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredResults.map((result) => (
                  <tr key={result.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold">{result.aspirant_name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">{result.aspirant_email || 'No email'}</p>
                      </div>
                    </td>
                    <td className=".px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold">{result.percentage}%</span>
                        <span className="text-xs text-muted-foreground">({result.score}/{result.total_questions})</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={getGradeColor(result.grade)}>{result.grade}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={getStatusColor(result.status)}>{result.status}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {new Date(result.submitted_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" className="gap-2">
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
