'use server'

import { AdminFinanceService } from '@/lib/services/admin/finance-service';
import { revalidatePath } from 'next/cache';

// Fee Schedules
export async function getFeeSchedulesAction() {
  try {
    const data = await AdminFinanceService.getFeeSchedules();
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createFeeScheduleAction(payload: any) {
  try {
    const data = await AdminFinanceService.createFeeSchedule(payload);
    revalidatePath('/admin/finance/fees');
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteFeeScheduleAction(id: string) {
  try {
    await AdminFinanceService.deleteFeeSchedule(id);
    revalidatePath('/admin/finance/fees');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Payments
export async function getPaymentsAction(statusFilter?: string) {
  try {
    const data = await AdminFinanceService.getPayments(statusFilter);
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updatePaymentStatusAction(id: string, status: string, source: string = 'student_fee') {
  try {
    const data = await AdminFinanceService.updatePaymentStatus(id, status, source);
    revalidatePath('/admin/finance/payments');
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
