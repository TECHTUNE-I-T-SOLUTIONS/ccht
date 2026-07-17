'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { BadgeCheck, Clock3, Hourglass, ShieldCheck, AlertTriangle, HelpCircle } from 'lucide-react'

type AspirantProfile = {
  current_stage: string
  application_status: string
  application_fee_paid: boolean
  admission_fee_paid: boolean
  exam_completed: boolean
  documents_uploaded: boolean
}

export default function AspirantStatusPage() {
  const [profile, setProfile] = useState<AspirantProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch('/api/v1/aspirant/payments/status')
        const payload = await response.json()
        setProfile(payload?.data?.profile || null)
      } catch (error) {
        console.error('Failed to load profile:', error)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    )
  }

  const getStatusItems = () => {
    if (!profile) {
      return [
        { label: 'Submitted', icon: BadgeCheck, value: 'No' },
        { label: 'Documents complete', icon: Clock3, value: 'Pending' },
        { label: 'Entrance exam', icon: Hourglass, value: 'Pending' },
        { label: 'Final decision', icon: ShieldCheck, value: 'Pending' },
      ]
    }

    const items = [
      { 
        label: 'Application fee', 
        icon: BadgeCheck, 
       value: profile.application_fee_paid ? 'Paid' : 'Pending' 
      },
      { 
        label: 'Documents', 
        icon: BadgeCheck, 
        value: profile.documents_uploaded ? 'Complete' : 'In progress' 
      },
      { 
        label: 'Entrance exam', 
        icon: profile.exam_completed ? BadgeCheck : Hourglass, 
        value: profile.exam_completed ? 'Completed' : 'Pending' 
      },
    ]

    if (profile.current_stage === 'admission_fee' || profile.current_stage === 'migration') {
      items.push({
        label: 'Admission review',
        icon: profile.application_status === 'admitted' ? BadgeCheck : Clock3,
        value: profile.application_status === 'admitted' ? 'Admitted' : 'Under review',
      })
    }

    if (profile.admission_fee_paid) {
      items.push({
        label: 'Admission fee',
        icon: BadgeCheck,
        value: 'Paid',
      })
    }

    return items
  }

  const statusItems = getStatusItems()

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-border bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.12),transparent_30%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--accent-soft)))] p-6 md:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Status</p>
        <h1 className="mt-3 text-3xl font-extrabold">Admission progress</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-foreground/70">
          Track where you are in the admissions process: profile, documents, exam, offer, and student migration.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statusItems.map((item) => {
          const Icon = item.icon
          return (
            <Card key={item.label} className="rounded-3xl border bg-white p-6 shadow-sm dark:bg-blue-800/20">
              <Icon className="h-5 w-5 text-primary" />
              <p className="mt-4 text-sm text-muted-foreground">{item.label}</p>
              <p className="mt-1 text-2xl font-bold">{item.value}</p>
            </Card>
          )
        })}
      </div>
      {profile?.current_stage === 'admission_fee' && profile.application_status !== 'admitted' && (
        <Card className="rounded-[2rem] border border-blue-500/20 bg-blue-500/5 p-6 shadow-sm dark:bg-blue-500/10">
          <div className="flex items-start gap-3">
            <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
            <div className="text-sm text-muted-foreground">
              <p className="font-semibold text-foreground">Admission under review</p>
              <p className="mt-1">Your application is being reviewed by the admissions committee. You will be notified once a decision has been made.</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
