import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { UserRole } from '@/lib/constants';

export class AdminUserService {
  static async getUsers(role?: string, search?: string) {
    const supabase = await createClient();
    
    let query = supabase
      .from('profiles')
      .select('*, student_profiles(*), teacher_profiles(*), admin_profiles(*)')
      .order('created_at', { ascending: false });

    if (role && role !== 'all') {
      query = query.eq('role', role);
    }

    if (search) {
      query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
    }

    const { data, error } = await query;
    if (error) throw new Error('Failed to fetch users: ' + error.message);
    
    return data;
  }

  static async getUserDetails(id: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('*, student_profiles(*), teacher_profiles(*), admin_profiles(*), aspirant_profiles(*)')
      .eq('id', id)
      .single();

    if (error) throw new Error('Failed to fetch user details: ' + error.message);
    return data;
  }

  static async createUser(payload: any) {
    const adminAuth = createAdminClient();
    const supabase = await createClient();
    
    // 1. Create auth user
    const { data: authData, error: authError } = await adminAuth.auth.admin.createUser({
      email: payload.email,
      password: payload.password,
      email_confirm: true,
      user_metadata: {
        first_name: payload.firstName,
        last_name: payload.lastName,
        role: payload.role,
      }
    });

    if (authError) throw new Error('Failed to create auth user: ' + authError.message);
    const userId = authData.user.id;

    // 2. Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: payload.email,
        first_name: payload.firstName,
        last_name: payload.lastName,
        role: payload.role,
        is_active: true,
      });

    if (profileError) {
      // Rollback
      await adminAuth.auth.admin.deleteUser(userId);
      throw new Error('Failed to create profile: ' + profileError.message);
    }

    // 3. Create role specific profile
    try {
      if (payload.role === 'student') {
        await supabase.from('student_profiles').insert({ profile_id: userId, matric_number: payload.matricNumber });
      } else if (payload.role === 'lecturer' || payload.role === 'teacher') {
        await supabase.from('teacher_profiles').insert({ profile_id: userId, staff_number: payload.staffNumber });
      } else if (payload.role === 'admin') {
        await supabase.from('admin_profiles').insert({ profile_id: userId, staff_id: payload.staffId });
      }
    } catch (e: any) {
      console.error("Failed to create role profile", e);
    }

    return userId;
  }

  static async updateUser(id: string, payload: any) {
    const supabase = await createClient();
    const adminAuth = createAdminClient();

    if (payload.email || payload.password) {
      const updates: any = {};
      if (payload.email) updates.email = payload.email;
      if (payload.password) updates.password = payload.password;
      await adminAuth.auth.admin.updateUserById(id, updates);
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        first_name: payload.firstName,
        last_name: payload.lastName,
        phone: payload.phone,
        role: payload.role,
      })
      .eq('id', id);

    if (profileError) throw new Error('Failed to update profile: ' + profileError.message);
    return true;
  }

  static async toggleUserStatus(id: string, isActive: boolean) {
    const supabase = await createClient();
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: isActive })
      .eq('id', id);
    if (error) throw new Error('Failed to toggle status: ' + error.message);
    return true;
  }

  static async deleteUser(id: string) {
    const adminAuth = createAdminClient();
    const { error } = await adminAuth.auth.admin.deleteUser(id);
    if (error) throw new Error('Failed to delete user: ' + error.message);
    return true;
  }
}
