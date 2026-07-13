import { createPublicClient } from '@/lib/supabase/public';
import { CreateProgramSchema, UpdateProgramSchema } from '@/lib/validation';
import { z } from 'zod';

export type Program = {
  id: string;
  title: string;
  slug: string;
  description: string;
  overview?: string;
  entry_requirements?: string;
  career_prospects?: string;
  duration_months: number;
  duration_unit: string;
  tuition_fee?: number;
  curriculum?: string;
  level: string;
  max_students?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export class ProgramService {
  static async getAllPrograms(limit?: number): Promise<Program[]> {
    const supabase = createPublicClient();
    
    let query = supabase
      .from('programs')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching programs:', error);
      throw new Error('Failed to fetch programs');
    }

    return data || [];
  }

  static async getProgramBySlug(slug: string): Promise<Program | null> {
    const supabase = createPublicClient();

    const { data, error } = await supabase
      .from('programs')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching program:', error);
      throw new Error('Failed to fetch program');
    }

    return data || null;
  }

  static async getProgramById(id: string): Promise<Program | null> {
    const supabase = createPublicClient();

    const { data, error } = await supabase
      .from('programs')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching program:', error);
      throw new Error('Failed to fetch program');
    }

    return data || null;
  }

  static async createProgram(input: z.infer<typeof CreateProgramSchema>): Promise<Program> {
    const supabase = createPublicClient();

    const { data, error } = await supabase
      .from('programs')
      .insert({
        title: input.title,
        slug: input.slug,
        description: input.description,
        duration_months: input.durationMonths,
        duration_unit: input.durationUnit,
        tuition_fee: input.tuitionFee,
        curriculum: input.curriculum || null,
        level: input.level,
        max_students: input.maxStudents || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating program:', error);
      throw new Error('Failed to create program');
    }

    return data;
  }

  static async updateProgram(id: string, input: z.infer<typeof UpdateProgramSchema>): Promise<Program> {
    const supabase = createPublicClient();

    const updateData: Record<string, any> = {};
    if (input.title) updateData.title = input.title;
    if (input.slug) updateData.slug = input.slug;
    if (input.description) updateData.description = input.description;
    if (input.durationMonths) updateData.duration_months = input.durationMonths;
    if (input.durationUnit) updateData.duration_unit = input.durationUnit;
    if (input.tuitionFee) updateData.tuition_fee = input.tuitionFee;
    if (input.curriculum !== undefined) updateData.curriculum = input.curriculum;
    if (input.level) updateData.level = input.level;
    if (input.maxStudents !== undefined) updateData.max_students = input.maxStudents;
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('programs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating program:', error);
      throw new Error('Failed to update program');
    }

    return data;
  }

  static async deleteProgram(id: string): Promise<void> {
    const supabase = createPublicClient();

    const { error } = await supabase
      .from('programs')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      console.error('Error deleting program:', error);
      throw new Error('Failed to delete program');
    }
  }

  static async searchPrograms(query: string): Promise<Program[]> {
    const supabase = createPublicClient();

    const { data, error } = await supabase
      .from('programs')
      .select('*')
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .eq('is_active', true);

    if (error) {
      console.error('Error searching programs:', error);
      throw new Error('Failed to search programs');
    }

    return data || [];
  }
}
