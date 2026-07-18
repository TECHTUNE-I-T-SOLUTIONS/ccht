'use server'

import { AdminAcademicService } from '@/lib/services/admin/academic-service';
import { revalidatePath } from 'next/cache';

// Sessions
export async function getSessionsAction() {
  try {
    const sessions = await AdminAcademicService.getSessions();
    return { success: true, data: sessions };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createSessionAction(payload: any) {
  try {
    const session = await AdminAcademicService.createSession(payload);
    revalidatePath('/admin/academics/sessions');
    return { success: true, data: session };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateSessionAction(id: string, payload: any) {
  try {
    const session = await AdminAcademicService.updateSession(id, payload);
    revalidatePath('/admin/academics/sessions');
    return { success: true, data: session };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteSessionAction(id: string) {
  try {
    await AdminAcademicService.deleteSession(id);
    revalidatePath('/admin/academics/sessions');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Departments
export async function getDepartmentsAction() {
  try {
    const depts = await AdminAcademicService.getDepartments();
    return { success: true, data: depts };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createDepartmentAction(payload: any) {
  try {
    const dept = await AdminAcademicService.createDepartment(payload);
    revalidatePath('/admin/academics/departments');
    return { success: true, data: dept };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateDepartmentAction(id: string, payload: any) {
  try {
    const dept = await AdminAcademicService.updateDepartment(id, payload);
    revalidatePath('/admin/academics/departments');
    return { success: true, data: dept };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteDepartmentAction(id: string) {
  try {
    await AdminAcademicService.deleteDepartment(id);
    revalidatePath('/admin/academics/departments');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
