'use server'

import { AdminFinanceService } from '@/lib/services/admin/finance-service';
import { revalidatePath } from 'next/cache';

// Fees
export async function getFeesAction() {
  try {
    const data = await AdminFinanceService.getFees();
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createFeeAction(payload: any) {
  try {
    const data = await AdminFinanceService.createFee(payload);
    revalidatePath('/admin/finance/fees');
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteFeeAction(id: string) {
  try {
    await AdminFinanceService.deleteFee(id);
    revalidatePath('/admin/finance/fees');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateFeeAction(id: string, payload: any) {
  try {
    const data = await AdminFinanceService.updateFee(id, payload);
    revalidatePath('/admin/finance/fees');
    return { success: true, data };
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
