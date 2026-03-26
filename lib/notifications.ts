'use server'

import { sendTextMagicSMS, sendTextMagicEmail } from './textmagic';
import { GuestStatus } from './types';
import { formatApprovalMessage, formatPreApproverMessage, formatAdminApprovalMessage, formatAdminDenialMessage } from './message-utils';
import { getSupabaseServiceClient } from './supabase-client';
import { generateDeepLinkUrl, generatePassViewUrl, generateApprovalUrl, generateDenialUrl } from './guest-credentials';

/**
 * Retrieves phone numbers for users with a specific role
 */
async function getPhoneNumbersByRole(role: string, fallbackRole: string | undefined = undefined): Promise<string[]> {
  let phoneNumbers: string[] = [];
  
  const useActualPhones = process.env.NOTIFICATION_USE_ACTUAL_PHONE_NUMBERS === 'true';
  
  if (useActualPhones) {
    const supabaseService = await getSupabaseServiceClient();
    const { data: users, error: usersError } = await supabaseService.auth.admin.listUsers();
    
    if (usersError) {
      throw new Error(`Failed to get users: ${usersError.message}`);
    }
    
    phoneNumbers = users.users
      .filter(user => {
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

    if (phoneNumbers.length === 0 && fallbackRole) {
      phoneNumbers = users.users
        .filter(user => {
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
    const { data: guest, error: guestError } = await supabaseService
      .from('guests')
      .select('*')
      .eq('id', guestId)
      .single();
    
    if (guestError || !guest) {
      throw new Error(`Failed to get guest information: ${guestError?.message || 'Guest not found'}`);
    }
    
    const phoneNumbers = await getPhoneNumbersByRole('pre_approver', 'admin');
    
    if (phoneNumbers.length === 0) {
      console.warn(`[sendPreApproverNotification] No phone numbers found for pre-approver notification, guestId: ${guestId}`);
      return false;
    }
    
    const deepLinkUrl = await generateDeepLinkUrl(guest.external_guest_id);
    const approvalUrl = await generateApprovalUrl(guest.text_callback_reference_id);
    const denialUrl = await generateDenialUrl(guest.text_callback_reference_id);
    const message = await formatPreApproverMessage(guest, deepLinkUrl, approvalUrl, denialUrl);

    let smsSuccess = false;

    if (phoneNumbers.length > 0) {
      const smsResult = await sendSMSToMultipleNumbers(phoneNumbers, message, guest.text_callback_reference_id);
      smsSuccess = smsResult.success;
    }
    
    return smsSuccess;
  } catch (error) {
    console.error(`[sendPreApproverNotification] Failed to send pre-approver notification for guest ${guestId}:`, error);
    return false;
  }
}


/**
 * Sends an informational notification to admins when a guest is approved.
 * Includes full guest details, Formation Kids info, children ages, and photo link.
 */
export async function sendAdminApprovalNotification(guestId: string) {
  try {
    const supabaseService = await getSupabaseServiceClient();

    const { data: guest, error: guestError } = await supabaseService
      .from('guests')
      .select('*')
      .eq('id', guestId)
      .single();
    
    if (guestError || !guest) {
      throw new Error(`Failed to get guest information: ${guestError?.message || 'Guest not found'}`);
    }
    
    const phoneNumbers = await getPhoneNumbersByRole('admin');
    
    if (phoneNumbers.length === 0) {
      console.warn(`[sendAdminApprovalNotification] No phone numbers found for admin role, guestId: ${guestId}`);
      return false;
    }

    const deepLinkUrl = await generateDeepLinkUrl(guest.external_guest_id);

    let children: { name: string; dob?: string | null }[] = [];
    if (guest.should_enroll_children === true) {
      const { data: childRows, error: childError } = await supabaseService
        .from('guest_children')
        .select('name, dob')
        .eq('guest_id', guestId);
      if (!childError && childRows) {
        children = childRows;
      }
    }

    let photoUrl: string | undefined;
    if (guest.photo_path) {
      const { data: signedData } = await supabaseService.storage
        .from('guest-photos')
        .createSignedUrl(guest.photo_path, 3600);
      if (signedData?.signedUrl) {
        photoUrl = signedData.signedUrl;
      }
    }

    const message = await formatAdminApprovalMessage(guest, deepLinkUrl, {
      children,
      photoUrl,
    });

    const smsResult = await sendSMSToMultipleNumbers(phoneNumbers, message, guest.text_callback_reference_id);
    return smsResult.success;

  } catch (error) {
    console.error(`[sendAdminApprovalNotification] Failed to send admin approval notification for guest ${guestId}:`, error);
    return false;
  }
}

/**
 * Sends an informational notification to admins when a guest is denied
 */
export async function sendAdminDenialNotification(guestId: string) {
  try {
    const supabaseService = await getSupabaseServiceClient();
    const { data: guest, error: guestError } = await supabaseService
      .from('guests')
      .select('*')
      .eq('id', guestId)
      .single();
    
    if (guestError || !guest) {
      throw new Error(`Failed to get guest information: ${guestError?.message || 'Guest not found'}`);
    }
    
    const phoneNumbers = await getPhoneNumbersByRole('admin');
    
    if (phoneNumbers.length === 0) {
      console.warn(`[sendAdminDenialNotification] No phone numbers found for admin role, guestId: ${guestId}`);
      return false;
    }

    const deepLinkUrl = await generateDeepLinkUrl(guest.external_guest_id);
    const message = await formatAdminDenialMessage(guest, deepLinkUrl);

    let smsSuccess = false;

    if (phoneNumbers.length > 0) {
      const smsResult = await sendSMSToMultipleNumbers(phoneNumbers, message, guest.text_callback_reference_id);
      smsSuccess = smsResult.success;
    }
    
    return smsSuccess;
  } catch (error) {
    console.error(`[sendAdminDenialNotification] Failed to send admin denial notification for guest ${guestId}:`, error);
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
    const message = await formatApprovalMessage(guest, passViewUrl);

    let smsSuccess = false;
    let smsError = '';

    const useActualPhones = process.env.NOTIFICATION_USE_ACTUAL_PHONE_NUMBERS?.toLowerCase() === 'true';

    if (useActualPhones) {
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

    if (!smsSuccess) {
      const errors = [];
      if (smsError) errors.push(`SMS: ${smsError}`);
      if (!guest.phone && useActualPhones) errors.push('No phone number available');
      throw new Error(`Failed to send notifications: ${errors.join(', ')}`);
    }
    
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

/**
 * Sends the Sunday 6 AM hospitality host digest.
 * Lists all approved guests for the current Sunday grouped by gathering time.
 */
export async function sendHospitalityHostDigest(): Promise<boolean> {
  try {
    const supabaseService = await getSupabaseServiceClient();

    // Get today's date in ET (America/New_York)
    const now = new Date();
    const etDate = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/New_York',
      year: 'numeric', month: '2-digit', day: '2-digit'
    }).format(now);

    // Fetch all approved guests for today
    const { data: guests, error } = await supabaseService
      .from('guests')
      .select('first_name, last_name, gathering_time, total_guests, vehicle_type, vehicle_color, vehicle_make, vehicle_model')
      .eq('visit_date', etDate)
      .eq('status', 'approved')
      .order('gathering_time', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch guests: ${error.message}`);
    }

    // Format the digest message
    const { formatHospitalityHostDigest } = await import('./message-utils');
    const message = await formatHospitalityHostDigest(guests || [], etDate);

    // Hospitality host list
    const hospitalityHosts = [
      '7062888390', // Ernest
      '8654069855', // Ashley
      '8179642462', // Jatona
      '6099370946', // Lonnell
      '6782628386', // Demetria
      '4706593616', // Jermaine
    ];

    // Send to each host individually
    let successCount = 0;
    for (const phone of hospitalityHosts) {
      const { success } = await sendTextMagicSMS({ phone, message });
      if (success) successCount++;
    }

    console.log(`[sendHospitalityHostDigest] Sent to ${successCount}/${hospitalityHosts.length} hosts for ${etDate}`);
    return successCount > 0;

  } catch (error) {
    console.error('[sendHospitalityHostDigest] Failed:', error);
    return false;
  }
}
