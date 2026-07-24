'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Users } from 'lucide-react'

export default function TeacherStudentsPage() {
  const [students, setStudents] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const perPage = 6

  useEffect(() => {
    fetch('/api/v1/teacher/students')
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          console.error('Failed to load students:', d.error)
          setStudents([])
        } else {
          setStudents(d.data || [])
        }
      })
      .catch((err) => {
        console.error('Failed to load students:', err)
        setStudents([])
      })
  }, [])

  const filtered = students.filter((student) =>
    `${student.profile?.first_name} ${student.profile?.last_name} ${student.profile?.email} ${student.student_number || ''} ${student.matric_number || ''}`.toLowerCase().includes(search.toLowerCase())
  )
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage))
  const paged = filtered.slice((page - 1) * perPage, page * perPage)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Users className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-bold">Students</h1>
      </div>
      <Input placeholder="Search students..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {paged.map((student) => (
          <Link key={student.profile_id} href={`/teacher/students/${student.profile_id}`}>
            <Card className="p-5">
              <p className="font-semibold">{student.profile?.first_name} {student.profile?.last_name}</p>
              <p className="text-sm text-muted-foreground">{student.profile?.email}</p>
              <p className="mt-2 text-xs text-muted-foreground">{student.student_number || student.matric_number || 'No number'}</p>
            </Card>
          </Link>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <Button variant="outline" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</Button>
        <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
        <Button variant="outline" disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</Button>
      </div>
    </div>
  )
}
