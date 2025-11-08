'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

/**
 * Update current user's own profile (email and phone) - Client Side
 */
export async function updateMyProfile(
  newEmail: string,
  phone: string
): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = createClientComponentClient()
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!newEmail || !emailRegex.test(newEmail.trim())) {
      return {
        success: false,
        message: 'Please provide a valid email address'
      }
    }

    // Validate phone
    if (!phone || phone.trim().length < 10) {
      return {
        success: false,
        message: 'Please provide a valid phone number'
      }
    }

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return {
        success: false,
        message: 'User not authenticated'
      }
    }


    // Update user profile
    const { error } = await supabase.auth.updateUser({
      email: newEmail,
      phone: phone
    })

    if (error) {
      console.error('Supabase auth error:', error)
      return {
        success: false,
        message: error.message || 'Failed to update profile'
      }
    }

    return {
      success: true,
      message: 'Profile updated successfully. Please check your email to confirm the new address.'
    }
  } catch (error) {
    console.error('Error updating user profile:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update profile'
    }
  }
}
