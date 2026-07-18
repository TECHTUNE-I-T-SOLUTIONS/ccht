'use server'

import { AdminContentService } from '@/lib/services/admin/content-service';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function getBlogPostsAction() {
  try {
    const data = await AdminContentService.getBlogPosts();
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createBlogPostAction(payload: any) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const data = await AdminContentService.createBlogPost(payload, user.id);
    revalidatePath('/admin/content');
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteBlogPostAction(id: string) {
  try {
    await AdminContentService.deleteBlogPost(id);
    revalidatePath('/admin/content');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getEventsAction() {
  try {
    const data = await AdminContentService.getEvents();
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createEventAction(payload: any) {
  try {
    const data = await AdminContentService.createEvent(payload);
    revalidatePath('/admin/content');
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteEventAction(id: string) {
  try {
    await AdminContentService.deleteEvent(id);
    revalidatePath('/admin/content');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getContactMessagesAction() {
  try {
    const data = await AdminContentService.getContactMessages();
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function markMessageReadAction(id: string, isRead: boolean) {
  try {
    await AdminContentService.markMessageRead(id, isRead);
    revalidatePath('/admin/messages');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
