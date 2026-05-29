'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { FileText } from 'lucide-react'

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

  if (loading) return <div className="p-8">Loading results...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Academic Results</h1>
        <p className="text-muted-foreground">View your exam scores and grades</p>
      </div>

      {results.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
          <p className="text-lg text-muted-foreground">No results available</p>
          <p className="text-sm text-muted-foreground mt-2">Results will appear here once exams are graded</p>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted border-b">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Course</th>
                <th className="px-4 py-3 text-left font-semibold">Score</th>
                <th className="px-4 py-3 text-left font-semibold">Grade</th>
                <th className="px-4 py-3 text-left font-semibold">Semester</th>
                <th className="px-4 py-3 text-left font-semibold">Year</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {results.map((result) => (
                <tr key={result.id} className="hover:bg-muted/50">
                  <td className="px-4 py-3">{result.course_name}</td>
                  <td className="px-4 py-3">{result.score}%</td>
                  <td className="px-4 py-3">
                    <span className="font-bold text-primary">{result.grade}</span>
                  </td>
                  <td className="px-4 py-3">{result.semester}</td>
                  <td className="px-4 py-3">{result.academic_year}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
