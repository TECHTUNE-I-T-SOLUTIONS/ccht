'use client'

import { Card } from '@/components/ui/card'
import { CreditCard } from 'lucide-react'

export default function StudentFeesPage() {
  return (
    <Card className="rounded-[2rem] p-6">
      <div className="flex items-center gap-3">
        <CreditCard className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-bold">Fees</h1>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">Fee schedules, payment history, and receipts can be connected here.</p>
    </Card>
  )
}
