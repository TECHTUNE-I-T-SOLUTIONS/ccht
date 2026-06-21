'use client'

import { Card } from '@/components/ui/card'
import { BookOpen } from 'lucide-react'

export default function TeacherCoursesPage() {
  return (
    <Card className="rounded-[2rem] p-6">
      <div className="flex items-center gap-3">
        <BookOpen className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-bold">My classes</h1>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">Assigned courses and class lists will appear here.</p>
    </Card>
  )
}
