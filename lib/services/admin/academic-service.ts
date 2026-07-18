import { createClient } from '@/lib/supabase/server';

export class AdminAcademicService {
  static async getSessions() {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('academic_sessions')
      .select('*')
      .order('starts_on', { ascending: false });

    if (error) throw new Error('Failed to fetch sessions: ' + error.message);
    return data;
  }

  static async createSession(payload: any) {
    const supabase = await createClient();
    
    // If setting to current, unset others
    if (payload.is_current) {
      await supabase.from('academic_sessions').update({ is_current: false }).neq('id', '00000000-0000-0000-0000-000000000000');
    }

    const { data, error } = await supabase
      .from('academic_sessions')
      .insert({
        name: payload.name,
        starts_on: payload.starts_on,
        ends_on: payload.ends_on,
        is_current: payload.is_current || false,
        is_active: payload.is_active !== undefined ? payload.is_active : true,
      })
      .select()
      .single();

    if (error) throw new Error('Failed to create session: ' + error.message);
    return data;
  }

  static async updateSession(id: string, payload: any) {
    const supabase = await createClient();
    
    if (payload.is_current) {
      await supabase.from('academic_sessions').update({ is_current: false }).neq('id', id);
    }

    const { data, error } = await supabase
      .from('academic_sessions')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error('Failed to update session: ' + error.message);
    return data;
  }

  static async deleteSession(id: string) {
    const supabase = await createClient();
    const { error } = await supabase
      .from('academic_sessions')
      .delete()
      .eq('id', id);
    if (error) throw new Error('Failed to delete session: ' + error.message);
    return true;
  }

  static async getDepartments() {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw new Error('Failed to fetch departments: ' + error.message);
    return data;
  }

  static async createDepartment(payload: any) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('departments')
      .insert({
        name: payload.name,
        code: payload.code,
        description: payload.description,
        is_active: payload.is_active !== undefined ? payload.is_active : true,
      })
      .select()
      .single();

    if (error) throw new Error('Failed to create department: ' + error.message);
    return data;
  }

  static async updateDepartment(id: string, payload: any) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('departments')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error('Failed to update department: ' + error.message);
    return data;
  }

  static async deleteDepartment(id: string) {
    const supabase = await createClient();
    const { error } = await supabase
      .from('departments')
      .delete()
      .eq('id', id);
    if (error) throw new Error('Failed to delete department: ' + error.message);
    return true;
  }
}
