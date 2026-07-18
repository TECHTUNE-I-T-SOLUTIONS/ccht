'use server'

import { AspirantService } from '@/lib/services/aspirant-service';
import { revalidatePath } from 'next/cache';

export async function getAspirantProfileAction(profileId: string) {
  try {
    const data = await AspirantService.getAspirantProfile(profileId);
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateAspirantProfileAction(profileId: string, payload: any) {
  try {
    const data = await AspirantService.updateAspirantProfile(profileId, payload);
    
    // Update profile completion percentage
    const completionCheck = await AspirantService.checkProfileCompletion(profileId);
    const completionPercentage = completionCheck.isComplete ? 100 : (100 - (completionCheck.missingFields.length * 20));
    await AspirantService.updateProfileCompletion(profileId, completionPercentage);
    
    revalidatePath('/aspirant/dashboard');
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function checkProfileCompletionAction(profileId: string) {
  try {
    const data = await AspirantService.checkProfileCompletion(profileId);
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function checkOfferStatusAction(profileId: string) {
  try {
    const data = await AspirantService.checkOfferStatus(profileId);
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function respondToOfferAction(profileId: string, accept: boolean) {
  try {
    const data = await AspirantService.respondToOffer(profileId, accept);
    revalidatePath('/aspirant/dashboard');
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
