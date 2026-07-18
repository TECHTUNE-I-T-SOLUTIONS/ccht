'use server'

import { AdminProgramService } from '@/lib/services/admin/program-service';
import { revalidatePath } from 'next/cache';

export async function getProgramsAction() {
  try {
    const programs = await AdminProgramService.getPrograms();
    return { success: true, data: programs };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getProgramDetailsAction(id: string) {
  try {
    const program = await AdminProgramService.getProgramDetails(id);
    return { success: true, data: program };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createProgramAction(payload: any) {
  try {
    const program = await AdminProgramService.createProgram(payload);
    revalidatePath('/admin/programs');
    return { success: true, data: program };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateProgramAction(id: string, payload: any) {
  try {
    const program = await AdminProgramService.updateProgram(id, payload);
    revalidatePath('/admin/programs');
    revalidatePath(`/admin/programs/${id}`);
    return { success: true, data: program };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteProgramAction(id: string) {
  try {
    await AdminProgramService.deleteProgram(id);
    revalidatePath('/admin/programs');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createCourseAction(payload: any) {
  try {
    const course = await AdminProgramService.createCourse(payload);
    revalidatePath(`/admin/programs/${payload.programId}`);
    return { success: true, data: course };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateCourseAction(id: string, programId: string, payload: any) {
  try {
    const course = await AdminProgramService.updateCourse(id, payload);
    revalidatePath(`/admin/programs/${programId}`);
    return { success: true, data: course };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteCourseAction(id: string, programId: string) {
  try {
    await AdminProgramService.deleteCourse(id);
    revalidatePath(`/admin/programs/${programId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
