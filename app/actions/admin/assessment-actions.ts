'use server'

import { AdminAssessmentService } from '@/lib/services/admin/assessment-service';
import { revalidatePath } from 'next/cache';

export async function getAllCoursesAction() {
  try {
    const data = await AdminAssessmentService.getAllCourses();
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getAssessmentsAction(typeFilter?: string) {
  try {
    const data = await AdminAssessmentService.getAssessments(typeFilter);
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getAssessmentDetailsAction(id: string) {
  try {
    const data = await AdminAssessmentService.getAssessmentDetails(id);
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createAssessmentAction(payload: any) {
  try {
    const data = await AdminAssessmentService.createAssessment(payload);
    revalidatePath('/admin/assessments');
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateAssessmentAction(id: string, payload: any) {
  try {
    const data = await AdminAssessmentService.updateAssessment(id, payload);
    revalidatePath('/admin/assessments');
    revalidatePath(`/admin/assessments/${id}`);
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteAssessmentAction(id: string) {
  try {
    await AdminAssessmentService.deleteAssessment(id);
    revalidatePath('/admin/assessments');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
