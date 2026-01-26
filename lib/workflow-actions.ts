'use server'

import { getSupabaseServiceClient } from './supabase-client'
import { approveGuest, denyGuest } from './admin-actions'
import { notifyGuestOfApproval, sendAdminApprovalNotification, sendAdminDenialNotification } from './notifications'
import { GuestStatus } from './types'

interface WorkflowResult {
  success: boolean
  message?: string
  error?: string
}

/**
 * Processes approve or deny action for a guest
 * Server action that handles the business logic
 * 
 * @param action The action to perform ('approve' or 'deny')
 * @param textRefId The text callback reference ID
 * @param dependencies Optional dependencies for testing
 * @returns Result of the action
 */
export async function processWorkflowAction(
  action: 'approve' | 'deny',
  textRefId: string,
  dependencies: {
    approvalNotificationFn?: typeof notifyGuestOfApproval;
    adminApprovalNotificationFn?: typeof sendAdminApprovalNotification;
    adminDenialNotificationFn?: typeof sendAdminDenialNotification;
  } = {}
): Promise<WorkflowResult> {
  try {
    // Validate action
    if (action !== 'approve' && action !== 'deny') {
      console.warn(`[processWorkflowAction] Invalid action received: ${action}, textRefId: ${textRefId}`);
      return {
        success: false,
        error: 'Invalid action. Must be "approve" or "deny"'
      }
    }

    // Parse textRefId as integer
    const referenceId = parseInt(textRefId)
    if (isNaN(referenceId)) {
      console.warn(`[processWorkflowAction] Invalid reference ID format: ${textRefId}`);
      return {
        success: false,
        error: 'Invalid reference ID format'
      }
    }

    // Get the guest record using the text_callback_reference_id
    const supabaseService = await getSupabaseServiceClient()
    const { data: guest, error: guestError } = await supabaseService
      .from('guests')
      .select('*')
      .eq('text_callback_reference_id', referenceId)
      .single()

    if (guestError || !guest) {
      console.warn(`[processWorkflowAction] Guest not found for referenceId: ${referenceId}`);
      return {
        success: false,
        error: 'Guest not found'
      }
    }

    // Check if guest is in PENDING status
    if (guest.status !== GuestStatus.PENDING) {
      console.warn(`[processWorkflowAction] Guest ${guest.id} not in PENDING status. Current status: ${guest.status}, action: ${action}`);
      return {
        success: false,
        error: `Guest is not in a valid status for this action. Current status: ${guest.status}`
      }
    }

    const systemUser = 'automation-workflow@system'
    let result

    // Process the action
    if (action === 'approve') {
      // Approve the guest - generates pass and sends notifications
      result = await approveGuest(guest.id, systemUser, {
        notificationFn: dependencies.approvalNotificationFn,
        adminApprovalNotificationFn: dependencies.adminApprovalNotificationFn
      })
    } else if (action === 'deny') {
      // Deny the guest
      result = await denyGuest(guest.id, systemUser, {
        adminDenialNotificationFn: dependencies.adminDenialNotificationFn
      })
    }

    if (!result || !result.success) {
      console.warn(`[processWorkflowAction] Action failed for guest ${guest.id}, action: ${action}, result: ${result?.message}`);
      return {
        success: false,
        error: result?.message || 'Failed to process action'
      }
    }

    return {
      success: true,
      message: result.message || `Guest ${action === 'approve' ? 'approved' : 'denied'} successfully`
    }
  } catch (error) {
    console.error('Error processing workflow action:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process action'
    }
  }
}

