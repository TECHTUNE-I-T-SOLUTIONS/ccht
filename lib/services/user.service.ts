import { createClient } from '@/lib/supabase/server';
import { UpdateProfileSchema, CreateAdminUserSchema } from '@/lib/validation';
import { z } from 'zod';
import { UserRole } from '@/lib/constants';

export type Profile = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: UserRole;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export class UserService {
  static async getProfileById(userId: string): Promise<Profile | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching profile:', error);
      throw new Error('Failed to fetch profile');
    }

    return data || null;
  }

  static async updateProfile(userId: string, input: z.infer<typeof UpdateProfileSchema>): Promise<Profile> {
    const supabase = await createClient();

    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (input.firstName) updateData.first_name = input.firstName;
    if (input.lastName) updateData.last_name = input.lastName;
    if (input.phone !== undefined) updateData.phone = input.phone;
    if (input.avatarUrl !== undefined) updateData.avatar_url = input.avatarUrl;

    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      throw new Error('Failed to update profile');
    }

    return data;
  }

  static async getAllUsers(role?: UserRole): Promise<Profile[]> {
    const supabase = await createClient();

    let query = supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (role) {
      query = query.eq('role', role);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching users:', error);
      throw new Error('Failed to fetch users');
    }

    return data || [];
  }

  static async getUsersByRole(role: UserRole): Promise<Profile[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', role)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      throw new Error('Failed to fetch users');
    }

    return data || [];
  }

  static async updateUserRole(userId: string, role: UserRole): Promise<Profile> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('profiles')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user role:', error);
      throw new Error('Failed to update user role');
    }

    return data;
  }

  static async updateUserStatus(userId: string, isActive: boolean): Promise<Profile> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('profiles')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user status:', error);
      throw new Error('Failed to update user status');
    }

    return data;
  }

  static async searchUsers(query: string): Promise<Profile[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`email.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%`);

    if (error) {
      console.error('Error searching users:', error);
      throw new Error('Failed to search users');
    }

    return data || [];
  }

  static async getStudentEnrollments(studentId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('enrollments')
      .select(`
        *,
        program:programs(*)
      `)
      .eq('student_id', studentId)
      .eq('status', 'active');

    if (error) {
      console.error('Error fetching enrollments:', error);
      throw new Error('Failed to fetch enrollments');
    }

    return data || [];
  }
}
