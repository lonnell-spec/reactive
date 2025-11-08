'use server'

/**
 * Get profile configuration from server-side environment variables
 * 
 * @returns Object with email and phone confirmation requirements
 */
export async function getProfileConfig(): Promise<{
  emailConfirmRequired: boolean
  phoneConfirmRequired: boolean
}> {
  return {
    emailConfirmRequired: process.env.SUPABASE_EMAIL_CONFIRMATION_REQUIRED?.toLowerCase() === 'true',
    phoneConfirmRequired: process.env.SUPABASE_PHONE_CONFIRMATION_REQUIRED?.toLowerCase() === 'true'
  }
}

/**
 * Get authentication configuration from server-side environment variables
 * 
 * @returns Object with authentication feature availability
 */
export async function getAuthConfig(): Promise<{
  emailConfirmationConfigured: boolean
}> {
  return {
    emailConfirmationConfigured: process.env.SUPABASE_EMAIL_CONFIRMATION_CONFIGURED?.toLowerCase() === 'true'
  }
}
