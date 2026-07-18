import { createClient } from '@/lib/supabase/server';

export class AdminProgramService {
  // --- Programs ---
  static async getPrograms() {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('programs')
      .select('*, department:departments(name, code)')
      .order('title', { ascending: true });

    if (error) throw new Error('Failed to fetch programs: ' + error.message);
    return data;
  }

  static async getProgramDetails(id: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('programs')
      .select('*, department:departments(name, code), courses(*)')
      .eq('id', id)
      .single();

    if (error) throw new Error('Failed to fetch program details: ' + error.message);
    return data;
  }

  static async createProgram(payload: any) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('programs')
      .insert({
        title: payload.title,
        slug: payload.slug,
        description: payload.description,
        duration_months: payload.durationMonths,
        duration_unit: payload.durationUnit,
        tuition_fee: payload.tuitionFee,
        level: payload.level,
        department_id: payload.departmentId,
        admission_open: payload.admissionOpen ?? true,
        is_active: payload.isActive ?? true,
      })
      .select()
      .single();

    if (error) throw new Error('Failed to create program: ' + error.message);
    return data;
  }

  static async updateProgram(id: string, payload: any) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('programs')
      .update({
        title: payload.title,
        slug: payload.slug,
        description: payload.description,
        duration_months: payload.durationMonths,
        duration_unit: payload.durationUnit,
        tuition_fee: payload.tuitionFee,
        level: payload.level,
        department_id: payload.departmentId,
        admission_open: payload.admissionOpen,
        is_active: payload.isActive,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error('Failed to update program: ' + error.message);
    return data;
  }

  static async deleteProgram(id: string) {
    const supabase = await createClient();
    const { error } = await supabase
      .from('programs')
      .delete()
      .eq('id', id);

    if (error) throw new Error('Failed to delete program: ' + error.message);
    return true;
  }

  // --- Courses ---
  static async getCoursesByProgram(programId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('program_id', programId)
      .order('semester', { ascending: true })
      .order('level', { ascending: true });

    if (error) throw new Error('Failed to fetch courses: ' + error.message);
    return data;
  }

  static async createCourse(payload: any) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('courses')
      .insert({
        program_id: payload.programId,
        code: payload.code,
        title: payload.title,
        description: payload.description,
        credit_units: payload.creditUnits,
        level: payload.level,
        semester: payload.semester,
        is_active: payload.isActive ?? true,
      })
      .select()
      .single();

    if (error) throw new Error('Failed to create course: ' + error.message);
    return data;
  }

  static async updateCourse(id: string, payload: any) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('courses')
      .update({
        code: payload.code,
        title: payload.title,
        description: payload.description,
        credit_units: payload.creditUnits,
        level: payload.level,
        semester: payload.semester,
        is_active: payload.isActive,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error('Failed to update course: ' + error.message);
    return data;
  }

  static async deleteCourse(id: string) {
    const supabase = await createClient();
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', id);

    if (error) throw new Error('Failed to delete course: ' + error.message);
    return true;
  }
}
