'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { validateRegistrationCode, createUserWithRole } from './auth-actions'

/**
 * Handles user sign in
 * Pure business logic with injectable dependencies
 * 
 * @param email User's email
 * @param password User's password
 * @param dependencies Injectable dependencies for testing
 */
export async function signInUser(
  email: string,
  password: string,
  dependencies: {
    supabaseClient?: any;
  } = {}
) {
  const {
    supabaseClient = createClientComponentClient()
  } = dependencies;

  // Validate inputs
  if (!email || !password) {
    return {
      success: false,
      message: 'Email and password are required'
    };
  }

  try {
    const { data, error: signInError } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });
    
    if (signInError) {
      return {
        success: false,
        message: signInError.message
      };
    }
    
    if (!data?.session) {
      return {
        success: false,
        message: 'Authentication failed'
      };
    }

    return {
      success: true,
      message: 'Sign in successful',
      session: data.session,
      user: data.user
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Login failed'
    };
  }
}

/**
 * Validates sign up form inputs
 * Pure function for testability
 * 
 * @param email User's email
 * @param password User's password
 * @param confirmPassword Confirmation password
 * @param adminCode Registration code
 * @returns Validation result
 */
export async function validateSignUpInputs(
  email: string,
  password: string,
  confirmPassword: string,
  adminCode: string
): Promise<{ isValid: boolean; message: string }> {
  // Check required fields
  if (!email || !password || !confirmPassword || !adminCode) {
    return {
      isValid: false,
      message: 'All fields are required'
    };
  }
  
  // Check password match
  if (password !== confirmPassword) {
    return {
      isValid: false,
      message: 'Passwords do not match'
    };
  }
  
  // Check password length
  if (password.length < 6) {
    return {
      isValid: false,
      message: 'Password must be at least 6 characters'
    };
  }

  return {
    isValid: true,
    message: 'Validation passed'
  };
}

/**
 * Handles user registration
 * Pure business logic with injectable dependencies
 * 
 * @param email User's email
 * @param password User's password
 * @param confirmPassword Confirmation password
 * @param adminCode Registration code
 * @param userRole User's role
 * @param dependencies Injectable dependencies for testing
 */
export async function registerUser(
  email: string,
  password: string,
  confirmPassword: string,
  adminCode: string,
  userRole: string,
  dependencies: {
    validateCodeFn?: typeof validateRegistrationCode;
    createUserFn?: typeof createUserWithRole;
  } = {}
) {
  const {
    validateCodeFn = validateRegistrationCode,
    createUserFn = createUserWithRole
  } = dependencies;

  // Validate form inputs
  const validation = await validateSignUpInputs(email, password, confirmPassword, adminCode);
  if (!validation.isValid) {
    return {
      success: false,
      message: validation.message
    };
  }

  try {
    // Verify the registration code for the selected role
    const validationResult = await validateCodeFn(adminCode, userRole);
    
    if (!validationResult.isValid) {
      return {
        success: false,
        message: validationResult.message
      };
    }

    // Create user account
    const createResult = await createUserFn(email, password, userRole);
    
    if (!createResult.success) {
      return {
        success: false,
        message: createResult.message
      };
    }
    
    return {
      success: true,
      message: 'Account created successfully! Please sign in.',
      userId: createResult.userId
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Registration failed'
    };
  }
}

/**
 * Handles password reset request
 * Pure business logic with injectable dependencies
 * 
 * @param email User's email
 * @param dependencies Injectable dependencies for testing
 */
export async function requestPasswordReset(
  email: string,
  dependencies: {
    supabaseClient?: any;
  } = {}
) {
  const {
    supabaseClient = createClientComponentClient()
  } = dependencies;

  if (!email) {
    return {
      success: false,
      message: 'Email is required'
    };
  }

  try {
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });
    
    if (error) {
      return {
        success: false,
        message: error.message
      };
    }

    return {
      success: true,
      message: 'Password reset email sent! Check your inbox.'
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Failed to send reset email'
    };
  }
}
