'use client'

import { Card } from '@/components/ui/card'
import { GraduationCap } from 'lucide-react'

export default function AdminAdmissionsPage() {
  return (
    <Card className="rounded-[2rem] p-6">
      <div className="flex items-center gap-3">
        <GraduationCap className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-bold">Admissions</h1>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">Review aspirant applications, screening, and decisions here.</p>
    </Card>
  )
}
