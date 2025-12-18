'use server'

import { getSupabaseServiceClient } from './supabase-client'
import { preApproveGuest, denyPreApproval, approveGuest, denyGuest } from './admin-actions'
import { sendApproverNotification, notifyGuestOfApproval, sendApproverNotificationOfDenial } from './notifications'
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
    approverNotificationFn?: typeof sendApproverNotification;
    approvalNotificationFn?: typeof notifyGuestOfApproval;
    denialApproverNotificationFn?: typeof sendApproverNotificationOfDenial;
  } = {}
): Promise<WorkflowResult> {
  try {
    // Validate action
    if (action !== 'approve' && action !== 'deny') {
      return {
        success: false,
        error: 'Invalid action. Must be "approve" or "deny"'
      }
    }

    // Parse textRefId as integer
    const referenceId = parseInt(textRefId)
    if (isNaN(referenceId)) {
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
      return {
        success: false,
        error: 'Guest not found'
      }
    }

    // Check if guest is in a valid status
    const validStatuses = [GuestStatus.PENDING_PRE_APPROVAL, GuestStatus.PENDING]
    if (!validStatuses.includes(guest.status)) {
      return {
        success: false,
        error: `Guest is not in a valid status for this action. Current status: ${guest.status}`
      }
    }

    const systemUser = 'automation-workflow@system'
    let result

    // Process the action based on guest status
    if (action === 'approve') {
      if (guest.status === GuestStatus.PENDING_PRE_APPROVAL) {
        // Pre-approve the guest
        result = await preApproveGuest(guest.id, systemUser, {
          approverNotificationFn: dependencies.approverNotificationFn
        })
      } else if (guest.status === GuestStatus.PENDING) {
        // Final approval
        result = await approveGuest(guest.id, systemUser, {
          notificationFn: dependencies.approvalNotificationFn
        })
      }
    } else if (action === 'deny') {
      if (guest.status === GuestStatus.PENDING_PRE_APPROVAL) {
        // Deny pre-approval
        result = await denyPreApproval(guest.id, systemUser, undefined, {
          denialApproverNotificationFn: dependencies.denialApproverNotificationFn
        })
      } else if (guest.status === GuestStatus.PENDING) {
        // Final denial
        result = await denyGuest(guest.id, systemUser)
      }
    }

    if (!result || !result.success) {
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

