'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Award, FileText, Sparkles } from 'lucide-react'

const gradePoints: Record<string, number> = { A: 5, B: 4, C: 3, D: 2, E: 1, F: 0 }

export default function ResultsPage() {
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const getResults = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('results')
          .select('*')
          .eq('student_id', user.id)
          .order('academic_year', { ascending: false })
        setResults(data || [])
      }
      setLoading(false)
    }

    getResults()
  }, [])

  const calculatedGPAs = (() => {
    const semesters: Record<string, { totalPoints: number; totalUnits: number }> = {}
    let cgpaPoints = 0
    let cgpaUnits = 0

    results.forEach((r) => {
      const units = 3
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

  if (loading) return <div className="p-8 font-technical">Loading results and grades...</div>

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-border bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.12),transparent_30%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--accent-soft)))] p-6 md:p-8">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-extrabold">Academic transcript and results</h1>
            <p className="text-muted-foreground">View your GPA performance and exam scores</p>
          </div>
          {results.length > 0 && (
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

      {results.length === 0 ? (
        <Card className="rounded-[2.5rem] border p-12 text-center">
          <FileText className="mx-auto mb-4 h-16 w-16 text-muted-foreground opacity-50" />
          <p className="text-lg text-muted-foreground">No results available</p>
          <p className="mt-2 text-sm text-muted-foreground">Results will appear here once exams are graded</p>
        </Card>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="rounded-[2.5rem] border bg-white p-6 shadow-sm md:p-8">
            <h2 className="mb-6 text-xl font-bold">Course scores breakdown</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Course</th>
                    <th className="px-4 py-3 text-left font-semibold">Score</th>
                    <th className="px-4 py-3 text-left font-semibold">Grade</th>
                    <th className="px-4 py-3 text-left font-semibold">Semester</th>
                    <th className="px-4 py-3 text-left font-semibold">Academic Year</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {results.map((result) => (
                    <tr key={result.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-semibold">{result.course_name}</td>
                      <td className="px-4 py-3 font-technical">{result.score}%</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">{result.grade}</span>
                      </td>
                      <td className="px-4 py-3">Semester {result.semester}</td>
                      <td className="px-4 py-3 text-xs font-technical">{result.academic_year}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="rounded-[2.5rem] border bg-white p-6 shadow-sm md:p-8">
            <h2 className="mb-6 flex items-center gap-2 text-xl font-bold">
              <Sparkles className="h-5 w-5 text-primary" />
              GPA performance history
            </h2>
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
          </Card>
        </div>
      )}
    </div>
  )
}
