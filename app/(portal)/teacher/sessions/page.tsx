'use client'

import { Card } from '@/components/ui/card'
import { Video } from 'lucide-react'

export default function TeacherSessionsPage() {
  return (
    <Card className="rounded-[2rem] p-6">
      <div className="flex items-center gap-3">
        <Video className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-bold">Sessions</h1>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">Online classes and session links can be listed here.</p>
    </Card>
  )
}
