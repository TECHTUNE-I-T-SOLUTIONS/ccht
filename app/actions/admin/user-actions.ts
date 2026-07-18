'use server'

import { AdminUserService } from '@/lib/services/admin/user-service';
import { revalidatePath } from 'next/cache';

export async function getUsersAction(role?: string, search?: string) {
  try {
    const users = await AdminUserService.getUsers(role, search);
    return { success: true, data: users };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getUserDetailsAction(id: string) {
  try {
    const user = await AdminUserService.getUserDetails(id);
    return { success: true, data: user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createUserAction(payload: any) {
  try {
    const userId = await AdminUserService.createUser(payload);
    revalidatePath('/admin/users');
    return { success: true, data: userId };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateUserAction(id: string, payload: any) {
  try {
    await AdminUserService.updateUser(id, payload);
    revalidatePath('/admin/users');
    revalidatePath(`/admin/users/${id}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function toggleUserStatusAction(id: string, isActive: boolean) {
  try {
    await AdminUserService.toggleUserStatus(id, isActive);
    revalidatePath('/admin/users');
    revalidatePath(`/admin/users/${id}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteUserAction(id: string) {
  try {
    await AdminUserService.deleteUser(id);
    revalidatePath('/admin/users');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
