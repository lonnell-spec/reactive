'use server'

import { getSupabaseServiceClient } from './supabase-client';

/**
 * Rollback a guest submission in case of error
 * This function attempts to clean up all created resources when a submission fails
 */
export async function rollbackGuestSubmission(
  cleanup: {
    guestId: string | null;
    childrenIds: string[];
    uploadedFiles: string[];
  },
  supabaseService: Awaited<ReturnType<typeof getSupabaseServiceClient>>
) {
  try {
    // Delete uploaded files first
    if (cleanup.uploadedFiles.length > 0) {
      await supabaseService
        .storage
        .from('guest-photos')
        .remove(cleanup.uploadedFiles);
    }
    
    // Delete children records
    if (cleanup.childrenIds.length > 0) {
      await supabaseService
        .from('guest_children')
        .delete()
        .in('id', cleanup.childrenIds);
    }
    
    // Delete guest record
    if (cleanup.guestId) {
      await supabaseService
        .from('guests')
        .delete()
        .eq('id', cleanup.guestId);
    }

  } catch {
  }
}
