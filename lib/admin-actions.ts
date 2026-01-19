'use server'

import { getSupabaseServiceClient } from './supabase-client'
import { generateQRCode, generateUniqueCodeWord, generatePassId, generatePassViewUrl, generatePassVerificationUrl } from './guest-credentials'
import { notifyGuestOfApproval, sendAdminApprovalNotification, sendAdminDenialNotification } from './notifications'
import { GuestStatus } from './types'
/**
 * Server action to approve a guest and generate secret credentials
 * This runs on the server with service role permissions
 * 
 * @param guestId Guest ID to approve
 * @param userEmail Email of the admin approving the guest
 * @param dependencies Injectable dependencies for testing
 */
export async function approveAndGeneratePass(
  guestId: string, 
  userEmail: string,
  dependencies: {
    getSupabaseClient?: typeof getSupabaseServiceClient;
    generateUniqueCodeWordFn?: typeof generateUniqueCodeWord;
    generateQRCodeFn?: typeof generateQRCode;
    generatePassIdFn?: typeof generatePassId;
    generatePassVerificationUrlFn?: typeof generatePassVerificationUrl;
  } = {}
) {
  if (!guestId) {
    throw new Error('Guest ID is required');
  }

  if (!userEmail) {
    throw new Error('User email is required');
  }

  const {
    getSupabaseClient = getSupabaseServiceClient,
    generateUniqueCodeWordFn = generateUniqueCodeWord,
    generateQRCodeFn = generateQRCode,
    generatePassIdFn = generatePassId,
    generatePassVerificationUrlFn = generatePassVerificationUrl
  } = dependencies;

  try {
    const supabaseService = await getSupabaseClient();
    
    // Generate unique code word with collision handling
    const uniqueCodeWord = await generateUniqueCodeWordFn(supabaseService);
    
    // Generate pass_id (UUID for the approved pass)
    const passId = await generatePassIdFn();
    
    // Generate pass view URL
    const passVerificationUrl = await generatePassVerificationUrlFn(passId);

    // Generate QR code that encodes the code word
    const qrCodeValue = await generateQRCodeFn(passVerificationUrl);
    
    // Update the submission in Supabase with secret credentials
    const { error: updateError } = await supabaseService
      .from('guests')
      .update({
        status: GuestStatus.APPROVED,
        pass_id: passId,
        qr_code: qrCodeValue,
        code_word: uniqueCodeWord,
        approved_by: userEmail,
        approved_at: new Date().toISOString()
      })
      .eq('id', guestId);
    
    if (updateError) {
      throw new Error(`Database error: ${updateError.message}`);
    }
    
    return {
      success: true,
      message: 'Guest approved successfully'
    };
  } catch (error) {
    console.error(`[approveAndGeneratePass] Failed to approve guest ${guestId}:`, error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to approve guest'
    };
  }
}

/**
 * Server action to approve a guest submission and generate credentials
 * This runs on the server with service role permissions
 * 
 * @param guestId Guest ID to approve
 * @param userEmail Email of the user approving the guest
 * @param dependencies Injectable dependencies for testing
 */
export async function approveGuest(
  guestId: string,
  userEmail: string,
  dependencies: {
    getSupabaseClient?: typeof getSupabaseServiceClient;
    approveAndGeneratePassFn?: typeof approveAndGeneratePass;
    notificationFn?: typeof notifyGuestOfApproval;
    adminApprovalNotificationFn?: typeof sendAdminApprovalNotification;
  } = {}
) {
  const {
    getSupabaseClient = getSupabaseServiceClient,
    approveAndGeneratePassFn = approveAndGeneratePass,
    notificationFn = notifyGuestOfApproval,
    adminApprovalNotificationFn = sendAdminApprovalNotification
  } = dependencies;

  if (!guestId) {
    throw new Error('Guest ID is required');
  }

  if (!userEmail) {
    throw new Error('User email is required');
  }

  try {
    // Call the server action to generate pass credentials
    const result = await approveAndGeneratePassFn(guestId, userEmail);
    
    if (!result.success) {
      throw new Error(`Failed to approve guest: ${result.message}`);
    }
    
    // Send SMS notification to the guest
    await notificationFn(guestId);
    
    // Send informational notification to admins (no action links)
    await adminApprovalNotificationFn(guestId);
    
    return result;
  } catch (error) {
    console.error(`[approveGuest] Failed to approve guest ${guestId}:`, error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to approve guest'
    };
  }
}

/**
 * Server action to deny a guest submission
 * This runs on the server with service role permissions
 * 
 * @param guestId Guest ID to deny
 * @param userEmail Email of the user denying the guest
 * @param dependencies Injectable dependencies for testing
 */
export async function denyGuest(
  guestId: string,
  userEmail: string,
  dependencies: {
    getSupabaseClient?: typeof getSupabaseServiceClient;
    adminDenialNotificationFn?: typeof sendAdminDenialNotification;
  } = {}
) {
  const {
    getSupabaseClient = getSupabaseServiceClient,
    adminDenialNotificationFn = sendAdminDenialNotification
  } = dependencies;

  if (!guestId) {
    throw new Error('Guest ID is required');
  }

  if (!userEmail) {
    throw new Error('User email is required');
  }

  try {
    const supabaseService = await getSupabaseClient();
    
    // Update the guest status to denied using service role client
    const { error: updateError } = await supabaseService
      .from('guests')
      .update({
        status: GuestStatus.DENIED,
        denied_by: userEmail,
        denied_at: new Date().toISOString()
      })
      .eq('id', guestId);
    
    if (updateError) {
      throw new Error(`Database error: ${updateError.message}`);
    }
    
    // Send informational notification to admins if enabled
    if (process.env.NOTIFICATION_NOTIFY_ADMIN_ON_DENIAL?.toLowerCase() === 'true') {
      await adminDenialNotificationFn(guestId);
    }
    
    return {
      success: true,
      message: 'Guest denied successfully'
    };
  } catch (error) {
    console.error(`[denyGuest] Failed to deny guest ${guestId}:`, error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to deny guest'
    };
  }
}