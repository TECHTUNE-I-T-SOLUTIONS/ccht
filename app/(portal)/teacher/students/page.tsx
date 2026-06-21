'use client'

import { Card } from '@/components/ui/card'
import { Users } from 'lucide-react'

export default function TeacherStudentsPage() {
  return (
    <Card className="rounded-[2rem] p-6">
      <div className="flex items-center gap-3">
        <Users className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-bold">Students</h1>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">Assigned students and progress summaries will show here.</p>
    </Card>
  )
}
