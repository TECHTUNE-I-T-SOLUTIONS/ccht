import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/client'

export interface AcademicSession {
  id: string
  name: string
  starts_on: string | null
  ends_on: string | null
  is_current: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateAcademicSessionInput {
  name: string
  starts_on?: string | null
  ends_on?: string | null
  is_current?: boolean
  is_active?: boolean
}

export interface UpdateAcademicSessionInput {
  name?: string
  starts_on?: string | null
  ends_on?: string | null
  is_current?: boolean
  is_active?: boolean
}

export class AcademicSessionService {
  /**
   * Get all academic sessions (admin only)
   */
  static async getAllSessions(): Promise<AcademicSession[]> {
    const admin = createAdminClient()
    
    const { data, error } = await admin
      .from('academic_sessions')
      .select('*')
      .order('name', { ascending: false })

    if (error) {
      console.error('[AcademicSessionService] Failed to fetch sessions:', error)
      throw new Error('Failed to fetch academic sessions')
    }

    return data || []
  }

  /**
   * Get active academic sessions (public)
   */
  static async getActiveSessions(): Promise<AcademicSession[]> {
    const client = createClient()
    
    const { data, error } = await client
      .from('academic_sessions')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: false })

    if (error) {
      console.error('[AcademicSessionService] Failed to fetch active sessions:', error)
      throw new Error('Failed to fetch active academic sessions')
    }

    return data || []
  }

  /**
   * Get current academic session
   */
  static async getCurrentSession(): Promise<AcademicSession | null> {
    const client = createClient()
    
    const { data, error } = await client
      .from('academic_sessions')
      .select('*')
      .eq('is_current', true)
      .eq('is_active', true)
      .single()

    if (error) {
      console.error('[AcademicSessionService] Failed to fetch current session:', error)
      return null
    }

    return data
  }

  /**
   * Get session by ID
   */
  static async getSessionById(id: string): Promise<AcademicSession | null> {
    const admin = createAdminClient()
    
    const { data, error } = await admin
      .from('academic_sessions')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('[AcademicSessionService] Failed to fetch session:', error)
      return null
    }

    return data
  }

  /**
   * Get session by name
   */
  static async getSessionByName(name: string): Promise<AcademicSession | null> {
    const client = createClient()
    
    const { data, error } = await client
      .from('academic_sessions')
      .select('*')
      .eq('name', name)
      .single()

    if (error) {
      console.error('[AcademicSessionService] Failed to fetch session by name:', error)
      return null
    }

    return data
  }

  /**
   * Create a new academic session (admin only)
   */
  static async createSession(input: CreateAcademicSessionInput): Promise<AcademicSession> {
    const admin = createAdminClient()
    
    const { data, error } = await admin
      .from('academic_sessions')
      .insert({
        name: input.name,
        starts_on: input.starts_on || null,
        ends_on: input.ends_on || null,
        is_current: input.is_current || false,
        is_active: input.is_active ?? true,
      })
      .select()
      .single()

    if (error) {
      console.error('[AcademicSessionService] Failed to create session:', error)
      if (error.code === '23505') {
        throw new Error('An academic session with this name already exists')
      }
      throw new Error('Failed to create academic session')
    }

    return data
  }

  /**
   * Update an academic session (admin only)
   */
  static async updateSession(id: string, input: UpdateAcademicSessionInput): Promise<AcademicSession> {
    const admin = createAdminClient()
    
    const updateData: UpdateAcademicSessionInput = {}
    
    if (input.name !== undefined) updateData.name = input.name
    if (input.starts_on !== undefined) updateData.starts_on = input.starts_on
    if (input.ends_on !== undefined) updateData.ends_on = input.ends_on
    if (input.is_current !== undefined) updateData.is_current = input.is_current
    if (input.is_active !== undefined) updateData.is_active = input.is_active

    const { data, error } = await admin
      .from('academic_sessions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[AcademicSessionService] Failed to update session:', error)
      if (error.code === '23505') {
        throw new Error('An academic session with this name already exists')
      }
      throw new Error('Failed to update academic session')
    }

    return data
  }

  /**
   * Delete an academic session (admin only)
   */
  static async deleteSession(id: string): Promise<void> {
    const admin = createAdminClient()
    
    const { error } = await admin
      .from('academic_sessions')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[AcademicSessionService] Failed to delete session:', error)
      throw new Error('Failed to delete academic session')
    }
  }

  /**
   * Set a session as current (admin only)
   */
  static async setCurrentSession(id: string): Promise<AcademicSession> {
    const admin = createAdminClient()
    
    // First, unset all current sessions
    await admin
      .from('academic_sessions')
      .update({ is_current: false })
      .neq('id', '00000000-0000-0000-0000-000000000000') // Update all

    // Then set the selected session as current
    const { data, error } = await admin
      .from('academic_sessions')
      .update({ is_current: true })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[AcademicSessionService] Failed to set current session:', error)
      throw new Error('Failed to set current academic session')
    }

    return data
  }

  /**
   * Toggle session active status (admin only)
   */
  static async toggleSessionStatus(id: string, isActive: boolean): Promise<AcademicSession> {
    const admin = createAdminClient()
    
    const { data, error } = await admin
      .from('academic_sessions')
      .update({ is_active: isActive })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[AcademicSessionService] Failed to toggle session status:', error)
      throw new Error('Failed to toggle academic session status')
    }

    return data
  }
}