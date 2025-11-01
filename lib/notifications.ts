'use server'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { sendTextMagicSMS } from './textmagic';
import { GuestStatus } from './types';
import { formatPreApprovalMessage } from './message-utils';

/**
 * Sends a notification to pre-approvers when a new guest registration is submitted
 */
export async function sendPreApprovalNotification(guestId: string) {
  try {
    const supabaseAuthClient = createClientComponentClient();
    // Get the guest information from Supabase
    const { data: guest, error: guestError } = await supabaseAuthClient
      .from('guests')
      .select('*')
      .eq('id', guestId)
      .single();
    
    if (guestError || !guest) {
      throw new Error(`Failed to get guest information: ${guestError?.message || 'Guest not found'}`);
    }
    
    // Get pre-approver phone number from environment variable
    const preApproverPhone = process.env.PRE_APPROVER_PHONE;
    
    if (!preApproverPhone) {
      return false;
    }
    
    // Format the message using pure utility function
    const message = await formatPreApprovalMessage(guest, process.env.APP_URL || '');
    
    // Send the SMS using TextMagic
    const { success, error } = await sendTextMagicSMS({
      phone: preApproverPhone,
      message: message,
    });
    
    if (!success) {
      // Don't throw an error here, as we don't want to fail the whole submission
      // if the SMS notification fails
    } else {
    }
    
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Sends an SMS notification to a guest when their registration has been pre-approved
 * Uses the template from NEW_WORKFLOW_SUMMARY.md Step 3A
 */
export async function notifyGuestOfPreApproval(guestId: string) {
  try {
    // Get the guest details from Supabase
    const supabaseAuthClient = createClientComponentClient();
    
    const { data: guest, error: guestError } = await supabaseAuthClient
      .from('guests')
      .select('*')
      .eq('id', guestId)
      .single();
    
    if (guestError || !guest) {
      throw new Error(`Failed to get guest information: ${guestError?.message || 'Guest not found'}`);
    }
    
    // Format the message
    const message = `
Your visit to Formation Church has been pre-approved!

Please complete your registration by visiting:
${process.env.APP_URL}/guest/confirm?id=${guest.credential_id}

We look forward to seeing you on ${new Date(guest.visit_date).toLocaleDateString()} at ${guest.gathering_time}.
`;
    
    // Send the SMS using TextMagic
    const { success, error } = await sendTextMagicSMS({
      phone: guest.phone,
      message: message,
    });
    
    if (!success) {
      throw new Error(`Failed to send SMS: ${error}`);
    }
    
    // Update the guest status to pre-approved
    const { error: updateError } = await supabaseAuthClient
      .from('guests')
      .update({ status: GuestStatus.PENDING })
      .eq('id', guestId);
    
    if (updateError) {
      throw new Error(`Failed to update guest status: ${updateError.message}`);
    }
    
    return {
      success: true,
      message: `Pre-approval notification sent to ${guest.phone}`
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to send pre-approval notification'
    };
  }
}

/**
 * Sends an SMS notification to a guest when their registration has been approved
 */
export async function notifyGuestOfApproval(guestId: string) {
  try {
    // Get the guest details from Supabase
    const supabaseAuthClient = createClientComponentClient();
    
    const { data: guest, error: guestError } = await supabaseAuthClient
      .from('guests')
      .select('*')
      .eq('id', guestId)
      .single();
    
    if (guestError || !guest) {
      throw new Error(`Failed to get guest information: ${guestError?.message || 'Guest not found'}`);
    }
    
    // Format the message
    const message = `
Great news! Your visit to Formation Church has been approved!

Your guest pass is ready:
${process.env.APP_URL}/guest/pass?id=${guest.credential_id}

We look forward to seeing you on ${new Date(guest.visit_date).toLocaleDateString()} at ${guest.gathering_time}.
Your code word is: ${guest.code_word}
`;
    
    // Send the SMS using TextMagic
    const { success, error } = await sendTextMagicSMS({
      phone: guest.phone,
      message: message,
    });
    
    if (!success) {
      throw new Error(`Failed to send SMS: ${error}`);
    }
    
    return {
      success: true,
      message: `Approval notification sent to ${guest.phone}`
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to send approval notification'
    };
  }
}

/**
 * Sends an SMS notification to a guest when their registration has been denied
 */
export async function notifyGuestOfDenial(guestId: string, reason: string) {
  try {
    // Get the guest details from Supabase
    const supabaseAuthClient = createClientComponentClient();
    
    const { data: guest, error: guestError } = await supabaseAuthClient
      .from('guests')
      .select('*')
      .eq('id', guestId)
      .single();
    
    if (guestError || !guest) {
      throw new Error(`Failed to get guest information: ${guestError?.message || 'Guest not found'}`);
    }
    
    // Format the message
    const message = `
We regret to inform you that your visit to Formation Church on ${new Date(guest.visit_date).toLocaleDateString()} has not been approved.

Reason: ${reason || 'No reason provided'}

If you have any questions, please contact us at ${process.env.CHURCH_CONTACT_EMAIL || 'info@formationchurch.com'}.
`;
    
    // Send the SMS using TextMagic
    const { success, error } = await sendTextMagicSMS({
      phone: guest.phone,
      message: message,
    });
    
    if (!success) {
      throw new Error(`Failed to send SMS: ${error}`);
    }
    
    return {
      success: true,
      message: `Denial notification sent to ${guest.phone}`
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to send denial notification'
    };
  }
}
