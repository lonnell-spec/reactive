'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { notifyGuestOfPreApproval, notifyGuestOfApproval, notifyGuestOfDenial, sendApproverNotification } from './notifications'
import { approveAndGeneratePass } from './admin-actions'

/**
 * Handles pre-approval of a guest submission
 * Pure business logic with injectable dependencies
 * 
 * @param guestId Guest ID to pre-approve
 * @param dependencies Injectable dependencies for testing
 */
export async function preApproveGuest(
  guestId: string,
  dependencies: {
    supabaseClient?: any;
    guestPreApprovalNotificationFn?: typeof notifyGuestOfPreApproval;
    approverNotificationFn?: typeof sendApproverNotification;
  } = {}
) {
  const {
    supabaseClient = createClientComponentClient(),
    guestPreApprovalNotificationFn = notifyGuestOfPreApproval,
    approverNotificationFn = sendApproverNotification
  } = dependencies;

  if (!guestId) {
    throw new Error('Guest ID is required');
  }

  try {
    // Use RPC function to pre-approve guest
    const { error: rpcError } = await supabaseClient
      .rpc('pre_approve_guest', { guest_id: guestId });
    
    if (rpcError) {
      throw new Error(`Database error: ${rpcError.message}`);
    }
    
    // Send SMS notification to the guest
    await approverNotificationFn(guestId, 'approve');
    await guestPreApprovalNotificationFn(guestId);
    
    return {
      success: true,
      message: 'Guest pre-approved successfully'
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to pre-approve guest'
    };
  }
}

/**
 * Handles denial of pre-approval for a guest submission
 * Pure business logic with injectable dependencies
 * 
 * @param guestId Guest ID to deny
 * @param denialMessage Message to send to guest
 * @param dependencies Injectable dependencies for testing
 */
export async function denyPreApproval(
  guestId: string,
  denialMessage: string = "Your pre-approval request has been denied.",
  dependencies: {
    supabaseClient?: any;
    notificationFn?: typeof notifyGuestOfDenial;
  } = {}
) {
  const {
    supabaseClient = createClientComponentClient(),
    notificationFn = notifyGuestOfDenial
  } = dependencies;

  if (!guestId) {
    throw new Error('Guest ID is required');
  }

  try {
    // Use RPC function to deny pre-approval
    const { error: rpcError } = await supabaseClient
      .rpc('deny_pre_approve_guest', { guest_id: guestId });
    
    if (rpcError) {
      throw new Error(`Database error: ${rpcError.message}`);
    }
    
    // Send SMS notification to the guest
    await notificationFn(guestId, denialMessage);
    
    return {
      success: true,
      message: 'Pre-approval denied successfully'
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to deny pre-approval'
    };
  }
}

/**
 * Handles final approval of a guest submission
 * Pure business logic with injectable dependencies
 * 
 * @param guestId Guest ID to approve
 * @param dependencies Injectable dependencies for testing
 */
export async function approveGuest(
  guestId: string,
  dependencies: {
    getCurrentUser?: () => any;
    approveAndGeneratePassFn?: typeof approveAndGeneratePass;
    notificationFn?: typeof notifyGuestOfApproval;
  } = {}
) {
  const {
    getCurrentUser = () => ({ email: 'test@example.com' }), // Default for testing
    approveAndGeneratePassFn = approveAndGeneratePass,
    notificationFn = notifyGuestOfApproval
  } = dependencies;

  if (!guestId) {
    throw new Error('Guest ID is required');
  }

  try {
    const user = getCurrentUser();
    
    // Call the server action to generate pass credentials
    const result = await approveAndGeneratePassFn(guestId, user.email);
    
    if (!result.success) {
      throw new Error(`Failed to approve guest: ${result.message}`);
    }
    
    // Send SMS notification to the guest
    await notificationFn(guestId);
    
    return result;
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to approve guest'
    };
  }
}

/**
 * Handles final denial of a guest submission
 * Pure business logic with injectable dependencies
 * 
 * @param guestId Guest ID to deny
 * @param denialMessage Message to send to guest
 * @param dependencies Injectable dependencies for testing
 */
export async function denyGuest(
  guestId: string,
  denialMessage: string = "Your guest registration has been denied.",
  dependencies: {
    supabaseClient?: any;
    notificationFn?: typeof notifyGuestOfDenial;
    getCurrentUser?: () => any;
  } = {}
) {
  const {
    supabaseClient = createClientComponentClient(),
    notificationFn = notifyGuestOfDenial,
    getCurrentUser = () => ({ email: 'test@example.com' }) // Default for testing
  } = dependencies;

  if (!guestId) {
    throw new Error('Guest ID is required');
  }

  try {
    const user = getCurrentUser();
    
    // Update the submission in Supabase
    const { error: updateError } = await supabaseClient
      .from('guests')
      .update({
        status: 'denied',
        denied_by: user.email,
        denied_at: new Date().toISOString()
      })
      .eq('id', guestId);
    
    if (updateError) {
      throw new Error(`Database error: ${updateError.message}`);
    }
    
    // Send SMS notification to the guest
    await notificationFn(guestId, denialMessage);
    
    return {
      success: true,
      message: 'Guest denied successfully'
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to deny guest'
    };
  }
}
