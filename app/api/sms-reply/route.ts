import { NextRequest } from 'next/server'
import { getSupabaseServiceClient } from '@/lib/supabase-client'
import { preApproveGuest, denyPreApproval, approveGuest, denyGuest } from '@/lib/admin-actions'
import { GuestStatus } from '@/lib/types'

/**
 * Webhook endpoint to handle incoming SMS replies from TextMagic
 * Processes YES/NO replies to approve or deny guest registrations
 */
export async function POST(request: NextRequest) {
  try {
    // Extract form data from the TextMagic webhook
    const formData = await request.formData()
    const referenceIdStr = formData.get('referenceId') as string
    const text = formData.get('text') as string

    // Log the incoming webhook for debugging
    console.log('SMS Reply Webhook received:', {
      referenceId: referenceIdStr,
      text,
      timestamp: new Date().toISOString()
    })

    // Validate required fields
    if (!referenceIdStr || !text) {
      console.log('Missing required fields in SMS webhook:', { referenceId: referenceIdStr, text })
      return new Response(null, { status: 200 })
    }

    // Parse referenceId as integer
    const referenceId = parseInt(referenceIdStr)
    if (isNaN(referenceId)) {
      console.log('Invalid referenceId format, expected integer:', referenceIdStr)
      return new Response(null, { status: 200 })
    }

    // Get the guest record using the text_callback_reference_id
    const supabaseService = await getSupabaseServiceClient()
    const { data: guest, error: guestError } = await supabaseService
      .from('guests')
      .select('*')
      .eq('text_callback_reference_id', referenceId)
      .single()

    if (guestError || !guest) {
      console.log('Guest not found for text_callback_reference_id:', referenceId, guestError?.message)
      return new Response(null, { status: 200 })
    }

    // Check if guest is in a valid status for SMS replies
    const validStatuses = [GuestStatus.PENDING_PRE_APPROVAL, GuestStatus.PENDING]
    if (!validStatuses.includes(guest.status)) {
      console.log(`Guest ${referenceId} has status ${guest.status}, not processing SMS reply`)
      return new Response(null, { status: 200 })
    }

    // Normalize the reply text
    const reply = text.trim().toUpperCase()
    console.log(`Processing SMS reply "${reply}" for guest ${referenceId} with status ${guest.status}`)

    // Process the reply based on guest status and reply text
    if (reply === 'YES' || reply === 'Y') {
      // Approve the guest based on current status
      if (guest.status === GuestStatus.PENDING_PRE_APPROVAL) {
        // Pre-approve the guest
        const result = await preApproveGuest(guest.id, 'sms-webhook@system')
        console.log('Pre-approval result:', result)
      } else if (guest.status === GuestStatus.PENDING) {
        // Final approval
        const result = await approveGuest(guest.id, 'sms-webhook@system')
        console.log('Final approval result:', result)
      }
    } else if (reply === 'NO' || reply === 'N') {
      // Deny the guest based on current status
      if (guest.status === GuestStatus.PENDING_PRE_APPROVAL) {
        // Deny pre-approval
        const result = await denyPreApproval(guest.id, 'sms-webhook@system')
        console.log('Pre-approval denial result:', result)
      } else if (guest.status === GuestStatus.PENDING) {
        // Final denial
        const result = await denyGuest(guest.id, 'sms-webhook@system')
        console.log('Final denial result:', result)
      }
    } else {
      // Unrecognized reply
      console.log(`Unrecognized SMS reply "${reply}" for guest ${referenceId}. Expected YES, Y, NO, or N.`)
    }

    // Always return 200 OK to acknowledge the webhook
    return new Response(null, { status: 200 })

  } catch (error) {
    // Log the error but still return 200 OK to acknowledge the webhook
    console.error('Error processing SMS reply webhook:', error)
    return new Response(null, { status: 200 })
  }
}
