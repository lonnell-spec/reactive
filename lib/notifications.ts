'use server'

import { sendTextMagicSMS, sendTextMagicEmail } from './textmagic';
import { GuestStatus } from './types';
import { formatApprovalMessage, formatPreApproverMessage, formatAdminApprovalMessage, formatAdminDenialMessage, formatHospitalityHostDigest } from './message-utils';
import { getSupabaseServiceClient } from './supabase-client';
import { generateDeepLinkUrl, generatePassViewUrl, generateApprovalUrl, generateDenialUrl } from './guest-credentials';

async function getPhoneNumbersByRole(role: string, fallbackRole: string | undefined = undefined): Promise<string[]> {
  let phoneNumbers: string[] = [];
  const useActualPhones = process.env.NOTIFICATION_USE_ACTUAL_PHONE_NUMBERS === 'true';
  if (useActualPhones) {
    const supabaseService = await getSupabaseServiceClient();
    const { data: users, error: usersError } = await supabaseService.auth.admin.listUsers();
    if (usersError) throw new Error(`Failed to get users: ${usersError.message}`);
    phoneNumbers = users.users
      .filter(user => {
        const appRoles = user.app_metadata?.roles || []
        const userRoles = user.user_metadata?.roles || []
        const legacyAppRole = user.app_metadata?.role
        const legacyUserRole = user.user_metadata?.role
        return (
          (Array.isArray(appRoles) && appRoles.includes(role)) ||
          (Array.isArray(userRoles) && userRoles.includes(role)) ||
          legacyAppRole === role || legacyUserRole === role
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
            legacyAppRole === fallbackRole || legacyUserRole === fallbackRole
          )
        })
        .map(user => user.user_metadata?.phone)
        .filter((phone): phone is string => phone !== undefined && phone !== null && phone.trim().length > 0);
    }
  } else {
    const testPhones = process.env.NOTIFICATION_TEST_PHONE_NUMBERS;
    if (testPhones) {
      phoneNumbers = testPhones.split(',').map(phone => phone.trim()).filter(phone => phone.length > 0);
    }
  }
  return phoneNumbers;
}

async function sendSMSToMultipleNumbers(
  phoneNumbers: string[],
  message: string,
  textCallbackReferenceId?: number
): Promise<{ success: boolean; successCount: number; totalCount: number }> {
  let successCount = 0;
  const totalCount = phoneNumbers.length;
  for (const phone of phoneNumbers) {
    try {
      const { success, error } = await sendTextMagicSMS({ phone, message, referenceId: textCallbackReferenceId });
      if (success) { successCount++; } else { console.log(`Failed to send SMS to ${phone}: ${error}`); }
    } catch (error) { console.log(`Error sending SMS to ${phone}:`, error); }
  }
  return { success: successCount > 0, successCount, totalCount };
}

export async function sendPreApproverNotification(guestId: string) {
  try {
    const supabaseService = await getSupabaseServiceClient();
    const { data: guest, error: guestError } = await supabaseService.from('guests').select('*').eq('id', guestId).single();
    if (guestError || !guest) throw new Error(`Failed to get guest information: ${guestError?.message || 'Guest not found'}`);
    const phoneNumbers = await getPhoneNumbersByRole('pre_approver', 'admin');
    if (phoneNumbers.length === 0) { console.warn(`[sendPreApproverNotification] No phone numbers found, guestId: ${guestId}`); return false; }
    const deepLinkUrl = await generateDeepLinkUrl(guest.external_guest_id);
    const approvalUrl = await generateApprovalUrl(guest.text_callback_reference_id);
    const denialUrl = await generateDenialUrl(guest.text_callback_reference_id);
    const message = await formatPreApproverMessage(guest, deepLinkUrl, approvalUrl, denialUrl);
    const smsResult = await sendSMSToMultipleNumbers(phoneNumbers, message, guest.text_callback_reference_id);
    return smsResult.success;
  } catch (error) {
    console.error(`[sendPreApproverNotification] Failed for guest ${guestId}:`, error);
    return false;
  }
}

export async function sendAdminApprovalNotification(guestId: string) {
  try {
    const supabaseService = await getSupabaseServiceClient();
    const { data: guest, error: guestError } = await supabaseService.from('guests').select('*').eq('id', guestId).single();
    if (guestError || !guest) throw new Error(`Failed to get guest information: ${guestError?.message || 'Guest not found'}`);
    const phoneNumbers = await getPhoneNumbersByRole('admin');
    if (phoneNumbers.length === 0) { console.warn(`[sendAdminApprovalNotification] No admin phones found, guestId: ${guestId}`); return false; }
    const deepLinkUrl = await generateDeepLinkUrl(guest.external_guest_id);
    let children: { name: string; dob?: string | null }[] = [];
    if (guest.should_enroll_children === true) {
      const { data: childRows } = await supabaseService.from('guest_children').select('name, dob').eq('guest_id', guestId);
      if (childRows) children = childRows;
    }
    let photoUrl: string | undefined;
    if (guest.photo_path) {
      const { data: signedData } = await supabaseService.storage.from('guest-photos').createSignedUrl(guest.photo_path, 3600);
      if (signedData?.signedUrl) photoUrl = signedData.signedUrl;
    }
    const message = await formatAdminApprovalMessage(guest, deepLinkUrl, { children, photoUrl });
    const smsResult = await sendSMSToMultipleNumbers(phoneNumbers, message, guest.text_callback_reference_id);
    return smsResult.success;
  } catch (error) {
    console.error(`[sendAdminApprovalNotification] Failed for guest ${guestId}:`, error);
    return false;
  }
}

export async function sendAdminDenialNotification(guestId: string) {
  try {
    const supabaseService = await getSupabaseServiceClient();
    const { data: guest, error: guestError } = await supabaseService.from('guests').select('*').eq('id', guestId).single();
    if (guestError || !guest) throw new Error(`Failed to get guest information: ${guestError?.message || 'Guest not found'}`);
    const phoneNumbers = await getPhoneNumbersByRole('admin');
    if (phoneNumbers.length === 0) { console.warn(`[sendAdminDenialNotification] No admin phones found, guestId: ${guestId}`); return false; }
    const deepLinkUrl = await generateDeepLinkUrl(guest.external_guest_id);
    const message = await formatAdminDenialMessage(guest, deepLinkUrl);
    const smsResult = await sendSMSToMultipleNumbers(phoneNumbers, message, guest.text_callback_reference_id);
    return smsResult.success;
  } catch (error) {
    console.error(`[sendAdminDenialNotification] Failed for guest ${guestId}:`, error);
    return false;
  }
}

export async function notifyGuestOfApproval(guestId: string) {
  try {
    if (process.env.NOTIFICATION_NOTIFY_GUESTS?.toLowerCase() === 'false') {
      return { success: true, message: 'Guest notification disabled' };
    }
    const supabaseService = await getSupabaseServiceClient();
    const { data: guest, error: guestError } = await supabaseService.from('guests').select('*').eq('id', guestId).single();
    if (guestError || !guest) throw new Error(`Failed to get guest information: ${guestError?.message || 'Guest not found'}`);
    const passViewUrl = await generatePassViewUrl(guest.pass_id);
    const message = await formatApprovalMessage(guest, passViewUrl);
    let smsSuccess = false;
    let smsError = '';
    const useActualPhones = process.env.NOTIFICATION_USE_ACTUAL_PHONE_NUMBERS?.toLowerCase() === 'true';
    if (useActualPhones) {
      if (guest.phone) {
        const { success, error } = await sendTextMagicSMS({ phone: guest.phone, message });
        smsSuccess = success;
        if (!success) smsError = error || 'Unknown SMS error';
      }
    } else {
      const testPhones = process.env.NOTIFICATION_TEST_PHONE_NUMBERS;
      if (testPhones) {
        const phoneNumbers = testPhones.split(',').map((p: string) => p.trim()).filter((p: string) => p.length > 0);
        const smsResult = await sendSMSToMultipleNumbers(phoneNumbers, message);
        smsSuccess = smsResult.success;
        if (!smsResult.success) smsError = `Failed to send to test numbers`;
      }
    }
    if (!smsSuccess) {
      const errors = [];
      if (smsError) errors.push(`SMS: ${smsError}`);
      if (!guest.phone && useActualPhones) errors.push('No phone number available');
      throw new Error(`Failed to send notifications: ${errors.join(', ')}`);
    }
    return { success: true, message: `Approval notification sent via SMS` };
  } catch (error) {
    console.error(`[notifyGuestOfApproval] Failed for guest ${guestId}:`, error);
    return { success: false, message: error instanceof Error ? error.message : 'Failed to send approval notification' };
  }
}

/**
 * Sends the Sunday 6 AM hospitality host digest.
 * Includes Formation Kids enrollment, child count, and a short photo link per guest.
 * Photo links use /view/[guestId]/photo to stay under SMS character limits.
 * THROWS on error — caller is responsible for catching.
 */
export async function sendHospitalityHostDigest(): Promise<boolean> {
  const supabaseService = await getSupabaseServiceClient();
  const now = new Date();
  const etDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(now);

  const { data: guests, error } = await supabaseService
    .from('guests')
    .select('id, external_guest_id, first_name, last_name, gathering_time, total_guests, vehicle_type, vehicle_color, vehicle_make, vehicle_model, should_enroll_children, photo_path')
    .eq('visit_date', etDate)
    .eq('status', 'approved')
    .order('gathering_time', { ascending: true });

  if (error) throw new Error(`Failed to fetch guests: ${error.message}`);

  const hospitalityHosts = [
    '7062888390', // Ernest
    '8654069855', // Ashley
    '8179642462', // Jatona
    '6099370946', // Lonnell
    '6782628386', // Demetria
    '4706593616', // Jermaine
  ];

  if (!guests || guests.length === 0) {
    const message = await formatHospitalityHostDigest([], etDate);
    for (const phone of hospitalityHosts) await sendTextMagicSMS({ phone, message });
    return true;
  }

  // Enrich each guest with child count and short photo URL
  const enrichedGuests = await Promise.all(guests.map(async (guest) => {
    let child_count = 0;
    let photo_url: string | undefined;

    if (guest.should_enroll_children === true) {
      const { data: children } = await supabaseService.from('guest_children').select('id').eq('guest_id', guest.id);
      child_count = children?.length || 0;
    }

    // Use short internal redirect instead of full signed URL to stay under SMS limit
    if (guest.photo_path && guest.external_guest_id) {
      photo_url = `https://www.pamspecialguest2819.com/view/${guest.external_guest_id}/photo`;
    }

    return { ...guest, child_count, photo_url };
  }));

  const message = await formatHospitalityHostDigest(enrichedGuests, etDate);

  let successCount = 0;
  for (const phone of hospitalityHosts) {
    const { success } = await sendTextMagicSMS({ phone, message });
    if (success) successCount++;
  }

  console.log(`[sendHospitalityHostDigest] Sent to ${successCount}/${hospitalityHosts.length} hosts for ${etDate}`);
  if (successCount === 0) throw new Error(`TextMagic failed for all ${hospitalityHosts.length} numbers`);
  return true;
}
