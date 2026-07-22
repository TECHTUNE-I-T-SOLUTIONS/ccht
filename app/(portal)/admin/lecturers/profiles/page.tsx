'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Search, Filter, UserCheck, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function LecturerProfilesPage() {
  const [lecturers, setLecturers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const supabase = createClient()

  useEffect(() => {
    loadLecturers()
  }, [])

  const loadLecturers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, teacher_profiles(*)')
        .eq('role', 'lecturer')
        .order('created_at', { ascending: false })

      if (error) throw error
      setLecturers(data || [])
    } catch (error) {
      console.error('Failed to load lecturers:', error)
      toast.error('Failed to load lecturers')
    } finally {
      setLoading(false)
    }
  }

  const filteredLecturers = lecturers.filter(lecturer => {
    const search = `${lecturer.first_name} ${lecturer.last_name} ${lecturer.email}`.toLowerCase()
    return search.includes(searchTerm.toLowerCase())
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Lecturer Profiles</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage lecturer profiles and information</p>
        </div>
        <Link href="/admin/management/lecturers/add">
          <Button className="gap-2">
            <UserCheck className="h-4 w-4" />
            Add Lecturer
          </Button>
        </Link>
      </div>

      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search lecturers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </Card>

      <Card className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredLecturers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No lecturers found</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredLecturers.map((lecturer) => (
              <Link key={lecturer.id} href={`/admin/lecturers/${lecturer.id}`}>
                <Card className="p-4 hover:bg-accent/50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                      {lecturer.first_name.charAt(0)}{lecturer.last_name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold">{lecturer.first_name} {lecturer.last_name}</p>
                      <p className="text-sm text-muted-foreground">{lecturer.email}</p>
                      {lecturer.teacher_profiles && (
                        <Badge className="mt-1" variant={lecturer.teacher_profiles.employment_status === 'active' ? 'default' : 'secondary'}>
                          {lecturer.teacher_profiles.employment_status}
                        </Badge>
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}