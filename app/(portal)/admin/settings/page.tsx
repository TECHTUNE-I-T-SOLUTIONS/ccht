'use client'

import { Card } from '@/components/ui/card'
import { Settings } from 'lucide-react'

export default function AdminSettingsPage() {
  return (
    <Card className="rounded-[2rem] p-6">
      <div className="flex items-center gap-3">
        <Settings className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-bold">System settings</h1>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">System preferences and portal configuration can live here.</p>
    </Card>
  )
}
