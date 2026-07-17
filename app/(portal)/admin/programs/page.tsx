'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Edit2, Trash2 } from 'lucide-react'

type Program = {
  id: string
  title: string
  level: string
  duration_months: number | null
  duration_unit: string | null
  tuition_fee: number | string | null
  is_active: boolean | null
}

export default function AdminPrograms() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const getPrograms = async () => {
      const { data } = await supabase.from('programs').select('*')
      setPrograms(data || [])
      setLoading(false)
    }

    getPrograms()
  }, [])

  if (loading) return <div className="p-8">Loading programs...</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Manage Programs</h1>
          <p className="text-muted-foreground">Create and manage academic programs</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Add Program
        </Button>
      </div>

      {programs.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-lg text-muted-foreground">No programs yet</p>
          <Button className="mt-4">Create First Program</Button>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted border-b">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Title</th>
                <th className="px-4 py-3 text-left font-semibold">Level</th>
                <th className="px-4 py-3 text-left font-semibold">Duration</th>
                <th className="px-4 py-3 text-left font-semibold">Fee</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {programs.map((program) => (
                <tr key={program.id} className="hover:bg-muted/50">
                  <td className="px-4 py-3 font-medium">{program.title}</td>
                  <td className="px-4 py-3 capitalize">{program.level}</td>
                  <td className="px-4 py-3">{program.duration_months ?? 'N/A'} {program.duration_unit ?? ''}</td>
                  <td className="px-4 py-3">₦{Number(program.tuition_fee ?? 0).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${program.is_active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                      {program.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <Button variant="ghost" size="sm">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
