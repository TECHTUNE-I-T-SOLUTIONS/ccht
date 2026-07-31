'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Users } from 'lucide-react'
import Link from 'next/link'

export default function AdminProfilesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/management/admins">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Admin Profiles</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage administrator profiles and details</p>
        </div>
      </div>

      <Card className="p-12 text-center">
        <Users className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Admin Profiles Management</h2>
        <p className="text-muted-foreground mb-6">This page is under development. Features will be available soon.</p>
        <Button variant="outline">Coming Soon</Button>
      </Card>
    </div>
  )
}
