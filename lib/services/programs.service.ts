import { createClient } from '@/lib/supabase/client'

export type Program = {
  id: string
  title: string
  slug: string
  description: string
  overview: string | null
  entry_requirements: string | null
  career_prospects: string | null
  duration_months: number
  duration_unit: string
  tuition_fee: number | null
  curriculum: string | null
  level: string
  department_id: string | null
  max_students: number | null
  admission_open: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export class ProgramsService {
  static async getActivePrograms(): Promise<Program[]> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('programs')
      .select('*')
      .eq('is_active', true)
      .eq('admission_open', true)
      .order('title', { ascending: true })

    if (error) {
      console.error('Error fetching programs:', error)
      return []
    }

    return data || []
  }

  static async getProgramBySlug(slug: string): Promise<Program | null> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('programs')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()

    if (error) {
      console.error('Error fetching program:', error)
      return null
    }

    return data
  }

  static async getProgramById(id: string): Promise<Program | null> {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('programs')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single()

    if (error) {
      console.error('Error fetching program:', error)
      return null
    }

    return data
  }
}
