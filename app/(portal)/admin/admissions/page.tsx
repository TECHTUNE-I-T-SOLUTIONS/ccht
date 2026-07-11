'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { BadgeCheck, GraduationCap, Users, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

type AspirantCandidate = {
  profile_id: string
  admission_number: string | null
  application_status: string
  current_stage: string
  profile_completion: number
  preferred_program_id: string | null
  created_at: string
  updated_at: string
}

export default function AdminAdmissionsPage() {
  const [candidates, setCandidates] = useState<AspirantCandidate[]>([])
  const [selected, setSelected] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [migrating, setMigrating] = useState(false)

  const loadCandidates = async () => {
    try {
      const response = await fetch('/api/v1/admin/admissions/migrate')
      const payload = await response.json().catch(() => null)
      setCandidates(payload?.data || [])
    } catch (error) {
      console.error(error)
      toast.error('Failed to load candidates')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCandidates()
  }, [])

  const toggleSelected = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  const bulkMigrate = async () => {
    setMigrating(true)
    try {
      const response = await fetch('/api/v1/admin/admissions/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileIds: selected }),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok) throw new Error(payload?.error || 'Migration failed')
      toast.success(`Migrated ${payload.migrated?.length || 0} aspirants`)
      setSelected([])
      loadCandidates()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setMigrating(false)
    }
  }

  const selectedCount = selected.length
  const completionSummary = useMemo(() => {
    const total = candidates.length
    const admitted = candidates.filter((candidate) => candidate.current_stage === 'admitted').length
    return { total, admitted }
  }, [candidates])

  return (
    <div className="space-y-6">
      <Card className="rounded-[2rem] border bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.12),transparent_30%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--accent-soft)))] p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Admissions</p>
            <h1 className="mt-3 text-3xl font-extrabold md:text-5xl">Bulk migration to student portal</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-foreground/70">
              Select approved aspirants and move them into the student table. Their role and admission status update together so the portal handoff stays clean.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-white p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Approved aspirants</p>
              <p className="mt-2 text-2xl font-black">{completionSummary.total}</p>
            </div>
            <div className="rounded-2xl border border-border bg-white p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Already admitted</p>
              <p className="mt-2 text-2xl font-black text-emerald-600">{completionSummary.admitted}</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{selectedCount} selected</p>
        <Button onClick={bulkMigrate} disabled={selectedCount === 0 || migrating} className="rounded-2xl">
          <ArrowRight className="mr-2 h-4 w-4" />
          {migrating ? 'Migrating...' : 'Move to Students'}
        </Button>
      </div>

      <Card className="rounded-[2rem] border bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <GraduationCap className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold">Approved aspirants</h2>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">Select one or more approved aspirants for migration.</p>

        <div className="mt-6 space-y-3">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading candidates...</p>
          ) : candidates.length === 0 ? (
            <p className="text-sm text-muted-foreground">No approved aspirants ready for migration.</p>
          ) : (
            candidates.map((candidate) => (
              <label key={candidate.profile_id} className="flex cursor-pointer items-start gap-4 rounded-2xl border border-border bg-slate-50 p-4">
                <Checkbox checked={selected.includes(candidate.profile_id)} onCheckedChange={() => toggleSelected(candidate.profile_id)} />
                <div className="flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">Aspirant #{candidate.profile_id.slice(0, 8)}</p>
                      <p className="text-xs text-muted-foreground">Stage: {candidate.current_stage} · Completion: {candidate.profile_completion}%</p>
                    </div>
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      {candidate.admission_number || 'No matric yet'}
                    </span>
                  </div>
                </div>
              </label>
            ))
          )}
        </div>
      </Card>
    </div>
  )
}
