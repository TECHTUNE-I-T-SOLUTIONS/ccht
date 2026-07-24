import { createClient } from '@/lib/supabase/client'
import { createAdminClient } from '@/lib/supabase/admin'

export interface Department {
  id: string
  name: string
  code: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export class DepartmentService {
  static async getAllDepartments(): Promise<Department[]> {
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('name', { ascending: true })

      if (error) {
        console.error('[DepartmentService] Failed to fetch departments:', error)
        throw new Error(`Failed to fetch departments: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error('[DepartmentService] Error in getAllDepartments:', error)
      throw error
    }
  }

  static async getActiveDepartments(): Promise<Department[]> {
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (error) {
        console.error('[DepartmentService] Failed to fetch active departments:', error)
        throw new Error(`Failed to fetch active departments: ${error.message}`)
      }

      console.log('[DepartmentService] Fetched departments:', data?.length || 0)
      return data || []
    } catch (error) {
      console.error('[DepartmentService] Error in getActiveDepartments:', error)
      throw error
    }
  }

  static async getDepartmentById(id: string): Promise<Department | null> {
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('[DepartmentService] Failed to fetch department:', error)
        throw new Error(`Failed to fetch department: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error('[DepartmentService] Error in getDepartmentById:', error)
      throw error
    }
  }

  static async createDepartment(name: string, code?: string): Promise<Department> {
    try {
      const admin = createAdminClient()
      
      const { data, error } = await admin
        .from('departments')
        .insert({
          name,
          code: code || null,
          is_active: true,
        })
        .select()
        .single()

      if (error) {
        console.error('[DepartmentService] Failed to create department:', error)
        throw new Error(`Failed to create department: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error('[DepartmentService] Error in createDepartment:', error)
      throw error
    }
  }
}
