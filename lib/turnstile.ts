'use server'

/**
 * Cloudflare Turnstile server-side validation
 * https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 */

export interface TurnstileValidationResponse {
  success: boolean
  challenge_ts?: string  // ISO timestamp of challenge completion
  hostname?: string      // Hostname where challenge was served
  'error-codes'?: string[]
  action?: string
  cdata?: string
}

export interface TurnstileValidationResult {
  success: boolean
  error?: string
  errorCodes?: string[]
  data?: TurnstileValidationResponse
}

/**
 * Validates a Turnstile token with Cloudflare's siteverify API
 * 
 * @param token The token from the client-side widget (cf-turnstile-response)
 * @param remoteIp Optional visitor IP address for additional validation
 * @returns Validation result with success status and any errors
 */
export async function validateTurnstileToken(
  token: string,
  remoteIp?: string
): Promise<TurnstileValidationResult> {
  const secretKey = process.env.CLOUDFLARE_SECRET_KEY

  // Validate secret key is configured
  if (!secretKey || secretKey === 'your-secret-key-here') {
    console.error('Turnstile: CLOUDFLARE_SECRET_KEY not configured')
    return {
      success: false,
      error: 'Turnstile validation not configured on server'
    }
  }

  // Validate token is provided
  if (!token || typeof token !== 'string') {
    return {
      success: false,
      error: 'Missing or invalid verification token'
    }
  }

  // Check token length (max 2048 characters per Cloudflare docs)
  if (token.length > 2048) {
    return {
      success: false,
      error: 'Verification token too long'
    }
  }

  try {
    // Prepare request body
    const formData = new FormData()
    formData.append('secret', secretKey)
    formData.append('response', token)
    
    if (remoteIp) {
      formData.append('remoteip', remoteIp)
    }

    // Call Cloudflare's siteverify API
    const response = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        body: formData
      }
    )

    if (!response.ok) {
      console.error(`Turnstile API error: ${response.status} ${response.statusText}`)
      return {
        success: false,
        error: 'Verification service unavailable'
      }
    }

    const result: TurnstileValidationResponse = await response.json()

    // Check if validation was successful
    if (!result.success) {
      const errorCodes = result['error-codes'] || []
      console.warn('Turnstile validation failed:', errorCodes)
      
      // Map error codes to user-friendly messages
      let errorMessage = 'Verification failed. Please try again.'
      
      if (errorCodes.includes('timeout-or-duplicate')) {
        errorMessage = 'Verification expired or already used. Please refresh and try again.'
      } else if (errorCodes.includes('invalid-input-response')) {
        errorMessage = 'Invalid verification token. Please refresh and try again.'
      } else if (errorCodes.includes('internal-error')) {
        errorMessage = 'Verification service error. Please try again later.'
      }

      return {
        success: false,
        error: errorMessage,
        errorCodes,
        data: result
      }
    }

    // Validation successful
    return {
      success: true,
      data: result
    }

  } catch (error) {
    console.error('Turnstile validation error:', error)
    return {
      success: false,
      error: 'Unable to verify. Please try again.'
    }
  }
}
