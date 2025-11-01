'use server'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

/**
 * Checks the status of a guest submission
 * Used by guests to check if their registration has been approved
 */
export async function checkGuestStatus(submissionId: string, phone: string) {
  try {
    const supabaseAuthClient = createClientComponentClient();
    const { data: guest, error: guestError } = await supabaseAuthClient
      .from('guests')
      .select('*')
      .eq('id', submissionId)
      .eq('phone', phone)
      .single();

    if (guestError) {
      throw guestError;
    }

    if (!guest) {
      return {
        success: false,
        message: 'No guest found with the provided information.'
      };
    }

    return {
      success: true,
      status: guest.status,
      guest
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to check guest status.'
    };
  }
}
