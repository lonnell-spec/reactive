'use server'

import { sendTextMagicSMS, sendTextMagicEmail } from './textmagic';
import { GuestStatus } from './types';
import { formatApprovalMessage, formatApproverMessage, formatApproverDenialMessage, formatDenialMessage, formatPreApprovalMessage, formatPreApproverMessage, formatAdminInfoMessage } from './message-utils';
import { getSupabaseServiceClient } from './supabase-client';
import { generateDeepLinkUrl, generatePassViewUrl, generateApprovalUrl, generateDenialUrl } from './guest-credentials';

/**
 * Retrieves phone numbers for users with a specific role
 * Private function for internal use only
 * 
 * @param role The user role to filter by (e.g., 'pre_approver', 'admin')
 * @returns Array of phone numbers
 */
async function getPhoneNumbersByRole(role: string, fallbackRole: string | undefined = undefined): Promise<string[]> {
  let phoneNumbers: string[] = [];
  
  const useActualPhones = process.env.NOTIFICATION_USE_ACTUAL_PHONE_NUMBERS === 'true';
  
  if (useActualPhones) {
    // Get phone numbers from authorized users with the specified role
    const supabaseService = await getSupabaseServiceClient();
    const { data: users, error: usersError } = await supabaseService.auth.admin.listUsers();
    
    if (usersError) {
      throw new Error(`Failed to get users: ${usersError.message}`);
    }
    
    // Filter users with the specified role and extract phone numbers
    phoneNumbers = users.users
      .filter(user => {
        // Check both array-based roles and legacy single role
        const appRoles = user.app_metadata?.roles || []
        const userRoles = user.user_metadata?.roles || []
        const legacyAppRole = user.app_metadata?.role
        const legacyUserRole = user.user_metadata?.role
        
        return (
          (Array.isArray(appRoles) && appRoles.includes(role)) ||
          (Array.isArray(userRoles) && userRoles.includes(role)) ||
          legacyAppRole === role ||
          legacyUserRole === role
        )
      })
      .map(user => user.user_metadata?.phone)
      .filter((phone): phone is string => phone !== undefined && phone !== null && phone.trim().length > 0);

    // If no phone numbers found and fallback role is provided, try fallback role
    if (phoneNumbers.length === 0 && fallbackRole) {
      phoneNumbers = users.users
        .filter(user => {
          // Check both array-based roles and legacy single role for fallback
          const appRoles = user.app_metadata?.roles || []
          const userRoles = user.user_metadata?.roles || []
          const legacyAppRole = user.app_metadata?.role
          const legacyUserRole = user.user_metadata?.role
          
          return (
            (Array.isArray(appRoles) && appRoles.includes(fallbackRole)) ||
            (Array.isArray(userRoles) && userRoles.includes(fallbackRole)) ||
            legacyAppRole === fallbackRole ||
            legacyUserRole === fallbackRole
          )
        })
        .map(user => user.user_metadata?.phone)
        .filter((phone): phone is string => phone !== undefined && phone !== null && phone.trim().length > 0);
    }
  } else {
    // Use test phone numbers from environment variable
    const testPhones = process.env.NOTIFICATION_TEST_PHONE_NUMBERS;
    if (testPhones) {
      phoneNumbers = testPhones
        .split(',')
        .map(phone => phone.trim())
        .filter(phone => phone.length > 0);
    }
  }
  
  return phoneNumbers;
}


/**
 * Sends SMS messages to multiple phone numbers
 * Private function for internal use only
 * 
 * @param phoneNumbers Array of phone numbers to send to
 * @param message The message to send
 * @param textCallbackReferenceId Optional reference ID for SMS callbacks
 * @returns Object with success status and count of successful sends
 */
async function sendSMSToMultipleNumbers(
  phoneNumbers: string[], 
  message: string,
  textCallbackReferenceId?: number
): Promise<{ success: boolean; successCount: number; totalCount: number }> {
  let successCount = 0;
  const totalCount = phoneNumbers.length;
  
  for (const phone of phoneNumbers) {
    try {
      const { success, error } = await sendTextMagicSMS({
        phone: phone,
        message: message,
        referenceId: textCallbackReferenceId,
      });
      
      if (success) {
        successCount++;
      } else {
        console.log(`Failed to send SMS to ${phone}: ${error}`);
      }
    } catch (error) {
      console.log(`Error sending SMS to ${phone}:`, error);
    }
  }
  
  return {
    success: successCount > 0,
    successCount,
    totalCount
  };
}

/**
 * Sends a notification to pre-approvers when a new guest registration is submitted
 */
export async function sendPreApproverNotification(guestId: string) {
  try {
    const supabaseService = await getSupabaseServiceClient();
    // Get the guest information from Supabase
    const { data: guest, error: guestError } = await supabaseService
      .from('guests')
      .select('*')
      .eq('id', guestId)
      .single();
    
    if (guestError || !guest) {
      throw new Error(`Failed to get guest information: ${guestError?.message || 'Guest not found'}`);
    }
    
    // Get phone numbers and email addresses for pre-approvers using the extracted functions
    const phoneNumbers = await getPhoneNumbersByRole('pre_approver', 'admin');
    
    if (phoneNumbers.length === 0) {
      console.warn(`[sendPreApproverNotification] No phone numbers found for pre-approver notification, guestId: ${guestId}`);
      return false;
    }
    
    // Format the message using pure utility function
    const deepLinkUrl = await generateDeepLinkUrl(guest.external_guest_id);
    const approvalUrl = await generateApprovalUrl(guest.text_callback_reference_id);
    const denialUrl = await generateDenialUrl(guest.text_callback_reference_id);
    const message = await formatPreApproverMessage(guest, deepLinkUrl, approvalUrl, denialUrl);

    // Send SMS and Email to all recipients using the extracted functions
    let smsSuccess = false;
    let emailSuccess = false;

    if (phoneNumbers.length > 0) {
      const smsResult = await sendSMSToMultipleNumbers(phoneNumbers, message, guest.text_callback_reference_id);
      smsSuccess = smsResult.success;
    }
    
    // Return true if SMS was sent successfully
    return smsSuccess;
  } catch (error) {
    console.error(`[sendPreApproverNotification] Failed to send pre-approver notification for guest ${guestId}:`, error);
    return false;
  }
}


/**
 * Sends an informational notification to admins when a guest is approved
 * This is for informational purposes only - no action links included
 */
export async function sendAdminInfoNotification(guestId: string) {
  try {
    const supabaseService = await getSupabaseServiceClient();
    // Get the guest information from Supabase
    const { data: guest, error: guestError } = await supabaseService
      .from('guests')
      .select('*')
      .eq('id', guestId)
      .single();
    
    if (guestError || !guest) {
      throw new Error(`Failed to get guest information: ${guestError?.message || 'Guest not found'}`);
    }
    
    // Get phone numbers for admins using the extracted functions
    const phoneNumbers = await getPhoneNumbersByRole('admin');
    
    if (phoneNumbers.length === 0) {
      console.warn(`[sendAdminInfoNotification] No phone numbers found for admin role, guestId: ${guestId}`);
      return false;
    }

    const deepLinkUrl = await generateDeepLinkUrl(guest.external_guest_id);
    // Format the message using pure utility function (no action links)
    const message = await formatAdminInfoMessage(guest, deepLinkUrl);

    // Send SMS to all recipients using the extracted functions
    let smsSuccess = false;

    if (phoneNumbers.length > 0) {
      const smsResult = await sendSMSToMultipleNumbers(phoneNumbers, message, guest.text_callback_reference_id);
      smsSuccess = smsResult.success;
    }
    
    // Return true if SMS was sent successfully
    return smsSuccess;
  } catch (error) {
    console.error(`[sendAdminInfoNotification] Failed to send admin info notification for guest ${guestId}:`, error);
    return false;
  }
}

/**
 * Sends an SMS notification to a guest when their registration has been approved
 */
export async function notifyGuestOfApproval(guestId: string) {
  try {
    if (process.env.NOTIFICATION_NOTIFY_GUESTS?.toLowerCase() === 'false') {
      return {
        success: true,
        message: 'Guest notification disabled'
      };
    }

    // Get the guest details from Supabase
    const supabaseService = await getSupabaseServiceClient();
    
    const { data: guest, error: guestError } = await supabaseService
      .from('guests')
      .select('*')
      .eq('id', guestId)
      .single();
    
    if (guestError || !guest) {
      throw new Error(`Failed to get guest information: ${guestError?.message || 'Guest not found'}`);
    }

    const passViewUrl = await generatePassViewUrl(guest.pass_id);
    
    // Format the message
    const message = await formatApprovalMessage(guest, passViewUrl);

    // Send SMS notification
    let smsSuccess = false;
    let smsError = '';

    const useActualPhones = process.env.NOTIFICATION_USE_ACTUAL_PHONE_NUMBERS?.toLowerCase() === 'true';

    // Send SMS
    if (useActualPhones) {
      // Send to actual guest phone
      if (guest.phone) {
        const { success, error } = await sendTextMagicSMS({
          phone: guest.phone,
          message: message,
        });
        smsSuccess = success;
        if (!success) {
          smsError = error || 'Unknown SMS error';
        }
      }
    } else {
      // Send to test phone numbers
      const testPhones = process.env.NOTIFICATION_TEST_PHONE_NUMBERS;
      if (testPhones) {
        const phoneNumbers = testPhones
          .split(',')
          .map(phone => phone.trim())
          .filter(phone => phone.length > 0);
        
        const smsResult = await sendSMSToMultipleNumbers(phoneNumbers, message);
        smsSuccess = smsResult.success;
        if (!smsResult.success) {
          smsError = `Failed to send to test numbers`;
        }
      }
    }

    // If SMS failed, throw an error
    if (!smsSuccess) {
      const errors = [];
      if (smsError) errors.push(`SMS: ${smsError}`);
      if (!guest.phone && useActualPhones) errors.push('No phone number available');
      throw new Error(`Failed to send notifications: ${errors.join(', ')}`);
    }
    
    // Build success message
    const successMethods = [];
    if (smsSuccess) {
      if (useActualPhones && guest.phone) {
        successMethods.push(`SMS to ${guest.phone}`);
      } else {
        successMethods.push(`SMS to test numbers`);
      }
    }
    
    return {
      success: true,
      message: `Approval notification sent via ${successMethods.join(' and ')}`
    };
  } catch (error) {
    console.error(`[notifyGuestOfApproval] Failed to send approval notification for guest ${guestId}:`, error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to send approval notification'
    };
  }
}
