'use client'

import { Card } from '@/components/ui/card'
import { ClipboardCheck } from 'lucide-react'

export default function TeacherGradesPage() {
  return (
    <Card className="rounded-[2rem] p-6">
      <div className="flex items-center gap-3">
        <ClipboardCheck className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-bold">Grades</h1>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">Grade entry and results uploads can be managed here.</p>
    </Card>
  )
}
