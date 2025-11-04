'use server'

import { getSupabaseServiceClient } from './supabase-client'

export interface PassVerificationResult {
  success: boolean
  message: string
  guest?: {
    id: string
    firstName: string
    lastName: string
    phone: string
    profilePicture: string | null
    visitDate: string
    gatheringTime: string
    expiresAt: string
    isUsed: boolean
  }
}

/**
 * Verifies a guest pass and returns guest information if valid
 * Checks: pass_id exists, expires_at is in future, is_used is false
 * 
 * @param passId The pass ID to verify
 * @returns PassVerificationResult with guest data if valid
 */
export async function verifyGuestPass(passId: string): Promise<PassVerificationResult> {
  if (!passId) {
    return {
      success: false,
      message: 'Pass ID is required'
    }
  }

  try {
    const supabaseService = await getSupabaseServiceClient()
    
    // Query guest by pass_id
    const { data: guest, error } = await supabaseService
      .from('guests')
      .select(`
        id,
        first_name,
        last_name,
        phone,
        photo_path,
        visit_date,
        gathering_time,
        expires_at,
        is_used,
        status
      `)
      .eq('pass_id', passId)
      .single()

    if (error || !guest) {
      return {
        success: false,
        message: 'Invalid pass ID'
      }
    }

    // Check if guest is approved
    if (guest.status !== 'approved') {
      return {
        success: false,
        message: 'Pass is not approved'
      }
    }

    // Check if pass has expired
    const now = new Date()
    const expiryDate = new Date(guest.expires_at)
    
    if (now > expiryDate) {
      return {
        success: false,
        message: 'Pass has expired'
      }
    }

    // Check if pass has already been used
    if (guest.is_used) {
      return {
        success: false,
        message: 'Pass has already been used'
      }
    }

    return {
      success: true,
      message: 'Valid pass',
      guest: {
        id: guest.id,
        firstName: guest.first_name,
        lastName: guest.last_name,
        phone: guest.phone,
        profilePicture: guest.photo_path,
        visitDate: guest.visit_date,
        gatheringTime: guest.gathering_time,
        expiresAt: guest.expires_at,
        isUsed: guest.is_used
      }
    }
  } catch (error) {
    return {
      success: false,
      message: 'Failed to verify pass'
    }
  }
}

/**
 * Searches for a guest by their code word
 * 
 * @param codeWord The code word to search for
 * @returns PassVerificationResult with guest data if found
 */
export async function searchGuestByCodeWord(codeWord: string): Promise<PassVerificationResult> {
  if (!codeWord) {
    return {
      success: false,
      message: 'Code word is required'
    }
  }

  try {
    const supabaseService = await getSupabaseServiceClient()
    
    // Query guest by code_word
    const { data: guest, error } = await supabaseService
      .from('guests')
      .select(`
        id,
        first_name,
        last_name,
        phone,
        photo_path,
        visit_date,
        gathering_time,
        expires_at,
        is_used,
        status
      `)
      .ilike('code_word', codeWord)
      .single()

    if (error || !guest) {
      return {
        success: false,
        message: 'No guest found with that code word'
      }
    }

    // Check if guest is approved
    if (guest.status !== 'approved') {
      return {
        success: false,
        message: 'Guest is not approved'
      }
    }

    // Check if pass has expired
    const now = new Date()
    const expiryDate = new Date(guest.expires_at)
    
    if (now > expiryDate) {
      return {
        success: false,
        message: 'Pass has expired'
      }
    }

    // Check if pass has already been used
    if (guest.is_used) {
      return {
        success: false,
        message: 'Pass has already been used'
      }
    }

    return {
      success: true,
      message: 'Valid pass found',
      guest: {
        id: guest.id,
        firstName: guest.first_name,
        lastName: guest.last_name,
        phone: guest.phone,
        profilePicture: guest.photo_path,
        visitDate: guest.visit_date,
        gatheringTime: guest.gathering_time,
        expiresAt: guest.expires_at,
        isUsed: guest.is_used
      }
    }
  } catch (error) {
    return {
      success: false,
      message: 'Failed to search by code word'
    }
  }
}

/**
 * Searches for a guest by their phone number
 * 
 * @param phone The phone number to search for
 * @returns PassVerificationResult with guest data if found
 */
export async function searchGuestByPhone(phone: string): Promise<PassVerificationResult> {
  if (!phone) {
    return {
      success: false,
      message: 'Phone number is required'
    }
  }

  try {
    const supabaseService = await getSupabaseServiceClient()
    
    // Clean phone number (remove spaces, dashes, parentheses)
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '')
    
    // Query guest by phone (try both cleaned and original format)
    const { data: guests, error } = await supabaseService
      .from('guests')
      .select(`
        id,
        first_name,
        last_name,
        phone,
        photo_path,
        visit_date,
        gathering_time,
        expires_at,
        is_used,
        status
      `)
      .or(`phone.eq.${phone},phone.eq.${cleanPhone}`)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    if (!guests || guests.length === 0) {
      return {
        success: false,
        message: 'No approved guest found with that phone number'
      }
    }

    // Get the most recent guest if multiple found
    const guest = guests[0]

    // Check if pass has expired
    const now = new Date()
    const expiryDate = new Date(guest.expires_at)
    
    if (now > expiryDate) {
      return {
        success: false,
        message: 'Pass has expired'
      }
    }

    // Check if pass has already been used
    if (guest.is_used) {
      return {
        success: false,
        message: 'Pass has already been used'
      }
    }

    return {
      success: true,
      message: 'Valid pass found',
      guest: {
        id: guest.id,
        firstName: guest.first_name,
        lastName: guest.last_name,
        phone: guest.phone,
        profilePicture: guest.photo_path,
        visitDate: guest.visit_date,
        gatheringTime: guest.gathering_time,
        expiresAt: guest.expires_at,
        isUsed: guest.is_used
      }
    }
  } catch (error) {
    return {
      success: false,
      message: 'Failed to search by phone number'
    }
  }
}

/**
 * Marks a guest pass as used (attended)
 * 
 * @param guestId The guest ID to mark as used
 * @param userEmail Email of the admin marking attendance
 * @returns Success/failure result
 */
export async function markPassAsUsed(
  guestId: string, 
  userEmail: string
): Promise<{ success: boolean; message: string }> {
  if (!guestId) {
    return {
      success: false,
      message: 'Guest ID is required'
    }
  }

  if (!userEmail) {
    return {
      success: false,
      message: 'User email is required'
    }
  }

  try {
    const supabaseService = await getSupabaseServiceClient()
    
    // Update the guest record to mark as used
    const { error } = await supabaseService
      .from('guests')
      .update({
        is_used: true,
        used_at: new Date().toISOString()
      })
      .eq('id', guestId)

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    return {
      success: true,
      message: 'Pass marked as used successfully'
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to mark pass as used'
    }
  }
}
