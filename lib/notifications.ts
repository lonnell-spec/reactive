'use server'

import { sendTextMagicSMS, sendTextMagicEmail } from './textmagic';
import { GuestStatus } from './types';
import { formatApprovalMessage, formatApproverMessage, formatDenialMessage, formatPreApprovalMessage, formatPreApproverMessage } from './message-utils';
import { getSupabaseServiceClient } from './supabase-client';
import { generateDeepLinkUrl, generatePassViewUrl } from './guest-credentials';

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
      .filter(user => 
        user.app_metadata?.role === role || 
        user.user_metadata?.role === role
      )
      .map(user => user.user_metadata?.phone)
      .filter(phone => phone && phone.trim().length > 0);

      // If no phone numbers found and fallback role is provided, try fallback role
    if (phoneNumbers.length === 0 && fallbackRole) {
      phoneNumbers = users.users
        .filter(user => 
          user.app_metadata?.role === fallbackRole || 
          user.user_metadata?.role === fallbackRole
        )
        .map(user => user.user_metadata?.phone)
        .filter(phone => phone && phone.trim().length > 0);
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
 * Retrieves email addresses for users with a specific role
 * Private function for internal use only
 * 
 * @param role The user role to filter by (e.g., 'pre_approver', 'admin')
 * @param fallbackRole Optional fallback role to try if primary role has no emails
 * @returns Array of email addresses
 */
async function getEmailAddressesByRole(role: string, fallbackRole: string | undefined = undefined): Promise<string[]> {
  let emailAddresses: string[] = [];
  
  const useActualEmailAddresses = process.env.NOTIFICATION_USE_ACTUAL_EMAIL_ADDRESSES === 'true';
  
  if (useActualEmailAddresses) {
    // Get email addresses from authorized users with the specified role
    const supabaseService = await getSupabaseServiceClient();
    const { data: users, error: usersError } = await supabaseService.auth.admin.listUsers();
    
    if (usersError) {
      throw new Error(`Failed to get users: ${usersError.message}`);
    }
    
    // Filter users with the specified role and extract email addresses
    emailAddresses = users.users
      .filter(user => 
        user.app_metadata?.role === role || 
        user.user_metadata?.role === role
      )
      .map(user => user.email)
      .filter((email): email is string => email !== undefined && email !== null && email.trim().length > 0);

    // If no email addresses found and fallback role is provided, try fallback role
    if (emailAddresses.length === 0 && fallbackRole) {
      emailAddresses = users.users
        .filter(user => 
          user.app_metadata?.role === fallbackRole || 
          user.user_metadata?.role === fallbackRole
        )
        .map(user => user.email)
        .filter((email): email is string => email !== undefined && email !== null && email.trim().length > 0);
    }
  } else {
    // Use test email addresses from environment variable
    const testEmails = process.env.NOTIFICATION_TEST_EMAIL_ADDRESSES;
    if (testEmails) {
      emailAddresses = testEmails
        .split(',')
        .map(email => email.trim())
        .filter(email => email.length > 0);
    }
  }
  
  return emailAddresses;
}

/**
 * Sends SMS messages to multiple phone numbers
 * Private function for internal use only
 * 
 * @param phoneNumbers Array of phone numbers to send to
 * @param message The message to send
 * @returns Object with success status and count of successful sends
 */
async function sendSMSToMultipleNumbers(
  phoneNumbers: string[], 
  message: string,
  externalGuestId?: string
): Promise<{ success: boolean; successCount: number; totalCount: number }> {
  let successCount = 0;
  const totalCount = phoneNumbers.length;
  
  for (const phone of phoneNumbers) {
    try {
      const payload = {
        phone: phone,
        message: message,
        externalGuestId: externalGuestId,
      };
      console.log('Sending SMS to', payload);
      const { success, error } = await sendTextMagicSMS(payload);
      
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
 * Sends email messages to multiple email addresses
 * Private function for internal use only
 * 
 * @param emailAddresses Array of email addresses to send to
 * @param message The message to send
 * @param subject The email subject
 * @returns Object with success status and count of successful sends
 */
async function sendEmailToMultipleAddresses(
  emailAddresses: string[], 
  message: string,
  subject?: string
): Promise<{ success: boolean; successCount: number; totalCount: number }> {
  let successCount = 0;
  const totalCount = emailAddresses.length;
  
  for (const email of emailAddresses) {
    try {
      const { success, error } = await sendTextMagicEmail({
        email: email,
        message: message,
        subject: subject,
      });
      
      if (success) {
        successCount++;
      } else {
        console.log(`Failed to send email to ${email}: ${error}`);
      }
    } catch (error) {
      console.log(`Error sending email to ${email}:`, error);
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
    const emailAddresses = await getEmailAddressesByRole('pre_approver', 'admin');
    
    if (phoneNumbers.length === 0 && emailAddresses.length === 0) {
      console.log('No phone numbers or email addresses found for pre-approver notification');
      return false;
    }
    
    // Format the message using pure utility function
    const deepLinkUrl = await generateDeepLinkUrl(guest.external_guest_id);
    const message = await formatPreApproverMessage(guest, deepLinkUrl);

    const textMessage = `
    ${message}
    You may also reply "YES" to approve, "NO" to deny.
    `;

    // Send SMS and Email to all recipients using the extracted functions
    let smsSuccess = false;
    let emailSuccess = false;

    if (phoneNumbers.length > 0) {
      const smsResult = await sendSMSToMultipleNumbers(phoneNumbers, textMessage, guest.external_guest_id);
      smsSuccess = smsResult.success;
    }

    if (emailAddresses.length > 0) {
      const emailResult = await sendEmailToMultipleAddresses(
        emailAddresses, 
        message, 
        'New Guest Registration - Pre-Approval Required'
      );
      emailSuccess = emailResult.success;
    }
    
    // Return true if either SMS or email was sent successfully
    return smsSuccess || emailSuccess;
  } catch (error) {
    console.log('Error in sendPreApproverNotification:', error);
    return false;
  }
}

/**
 * Sends a notification to approvers when a guest registration is pre-approved
 */
export async function sendApproverNotification(guestId: string) {
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
    
    // Get phone numbers and email addresses for admins using the extracted functions
    const phoneNumbers = await getPhoneNumbersByRole('admin');
    const emailAddresses = await getEmailAddressesByRole('admin');
    
    if (phoneNumbers.length === 0 && emailAddresses.length === 0) {
      return false;
    }

    const deepLinkUrl = await generateDeepLinkUrl(guest.external_guest_id);
    // Format the message using pure utility function
    const message = await formatApproverMessage(guest, deepLinkUrl);

    const textMessage = `
    ${message}
    You may also reply "YES" to approve, "NO" to deny.
    `;

    // Send SMS and Email to all recipients using the extracted functions
    let smsSuccess = false;
    let emailSuccess = false;

    if (phoneNumbers.length > 0) {
      const smsResult = await sendSMSToMultipleNumbers(phoneNumbers, textMessage, guest.external_guest_id);
      smsSuccess = smsResult.success;
    }

    if (emailAddresses.length > 0) {
      const emailResult = await sendEmailToMultipleAddresses(
        emailAddresses, 
        message, 
        'Guest Registration - Final Approval Required'
      );
      emailSuccess = emailResult.success;
    }
    
    // Return true if either SMS or email was sent successfully
    return smsSuccess || emailSuccess;
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
    
    // Format the message
    const message = await formatPreApprovalMessage(guest);

    // Send both SMS and Email notifications
    let smsSuccess = false;
    let emailSuccess = false;
    let smsError = '';
    let emailError = '';

    // Send SMS if phone number exists
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

    // Send Email if email address exists
    if (guest.email) {
      const { success, error } = await sendTextMagicEmail({
        email: guest.email,
        message: message,
        subject: 'Guest Registration Pre-Approved',
      });
      emailSuccess = success;
      if (!success) {
        emailError = error || 'Unknown email error';
      }
    }

    // If both failed, throw an error
    if (!smsSuccess && !emailSuccess) {
      const errors = [];
      if (guest.phone && smsError) errors.push(`SMS: ${smsError}`);
      if (guest.email && emailError) errors.push(`Email: ${emailError}`);
      if (!guest.phone && !guest.email) errors.push('No phone or email address available');
      throw new Error(`Failed to send notifications: ${errors.join(', ')}`);
    }
    
    // Build success message
    const successMethods = [];
    if (smsSuccess && guest.phone) successMethods.push(`SMS to ${guest.phone}`);
    if (emailSuccess && guest.email) successMethods.push(`Email to ${guest.email}`);
    
    return {
      success: true,
      message: `Pre-approval notification sent via ${successMethods.join(' and ')}`
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

    // Send both SMS and Email notifications
    let smsSuccess = false;
    let emailSuccess = false;
    let smsError = '';
    let emailError = '';

    // Send SMS if phone number exists
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

    // Send Email if email address exists
    if (guest.email) {
      const { success, error } = await sendTextMagicEmail({
        email: guest.email,
        message: message,
        subject: 'Guest Registration Approved - Your Pass is Ready!',
      });
      emailSuccess = success;
      if (!success) {
        emailError = error || 'Unknown email error';
      }
    }

    // If both failed, throw an error
    if (!smsSuccess && !emailSuccess) {
      const errors = [];
      if (guest.phone && smsError) errors.push(`SMS: ${smsError}`);
      if (guest.email && emailError) errors.push(`Email: ${emailError}`);
      if (!guest.phone && !guest.email) errors.push('No phone or email address available');
      throw new Error(`Failed to send notifications: ${errors.join(', ')}`);
    }
    
    // Build success message
    const successMethods = [];
    if (smsSuccess && guest.phone) successMethods.push(`SMS to ${guest.phone}`);
    if (emailSuccess && guest.email) successMethods.push(`Email to ${guest.email}`);
    
    return {
      success: true,
      message: `Approval notification sent via ${successMethods.join(' and ')}`
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
export async function notifyGuestOfDenial(guestId: string) {
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
    
    const churchContactEmail = process.env.CHURCH_CONTACT_EMAIL;
    if (!churchContactEmail) {
      throw new Error('Church contact email is not set');
    }
    
    // Format the message
    const message = await formatDenialMessage(guest, churchContactEmail);
    
    // Send both SMS and Email notifications
    let smsSuccess = false;
    let emailSuccess = false;
    let smsError = '';
    let emailError = '';

    // Send SMS if phone number exists
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

    // Send Email if email address exists
    if (guest.email) {
      const { success, error } = await sendTextMagicEmail({
        email: guest.email,
        message: message,
        subject: 'Guest Registration Update',
      });
      emailSuccess = success;
      if (!success) {
        emailError = error || 'Unknown email error';
      }
    }

    // If both failed, throw an error
    if (!smsSuccess && !emailSuccess) {
      const errors = [];
      if (guest.phone && smsError) errors.push(`SMS: ${smsError}`);
      if (guest.email && emailError) errors.push(`Email: ${emailError}`);
      if (!guest.phone && !guest.email) errors.push('No phone or email address available');
      throw new Error(`Failed to send notifications: ${errors.join(', ')}`);
    }
    
    // Build success message
    const successMethods = [];
    if (smsSuccess && guest.phone) successMethods.push(`SMS to ${guest.phone}`);
    if (emailSuccess && guest.email) successMethods.push(`Email to ${guest.email}`);
    
    return {
      success: true,
      message: `Denial notification sent via ${successMethods.join(' and ')}`
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to send denial notification'
    };
  }
}
