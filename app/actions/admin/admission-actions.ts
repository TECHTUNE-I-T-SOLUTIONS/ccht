'use server'

import { AdminAdmissionService } from '@/lib/services/admin/admission-service';
import { revalidatePath } from 'next/cache';

export async function getApplicationsAction(status?: string, programId?: string) {
  try {
    const applications = await AdminAdmissionService.getApplications(status, programId);
    return { success: true, data: applications };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getApplicationDetailsAction(id: string) {
  try {
    const application = await AdminAdmissionService.getApplicationDetails(id);
    return { success: true, data: application };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateApplicationStatusAction(id: string, status: string, adminNote?: string) {
  try {
    const result = await AdminAdmissionService.updateApplicationStatus(id, status, adminNote);
    revalidatePath('/admin/admissions');
    revalidatePath(`/admin/admissions/${id}`);
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateScreeningScoreAction(id: string, score: number) {
  try {
    const result = await AdminAdmissionService.updateScreeningScore(id, score);
    revalidatePath(`/admin/admissions/${id}`);
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateDocumentVerificationStatusAction(docId: string, status: string, note?: string) {
  try {
    const result = await AdminAdmissionService.updateDocumentVerificationStatus(docId, status, note);
    revalidatePath('/admin/admissions');
    revalidatePath(`/admin/admissions/${result.application_id}`);
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function migrateToStudentAction(profileId: string) {
  try {
    const result = await AdminAdmissionService.migrateToStudent(profileId, 'admin');
    revalidatePath('/admin/admissions');
    revalidatePath(`/admin/admissions/${profileId}`);
    revalidatePath('/aspirant/dashboard');
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function bulkMigrateToStudentsAction(profileIds: string[]) {
  try {
    const results = await AdminAdmissionService.bulkMigrateToStudents(profileIds, 'admin');
    revalidatePath('/admin/admissions');
    revalidatePath('/aspirant/dashboard');
    return { success: true, data: results };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
