'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { validateRegistrationCode, createUserWithRole } from './auth-actions'
import { 
  loginFormSchema, 
  registrationFormSchema, 
  forgotPasswordFormSchema,
  type LoginFormData,
  type RegistrationFormData,
  type ForgotPasswordFormData
} from './admin-auth-types'

/**
 * Handles user sign in with Zod validation
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

  // Validate inputs using Zod
  const validation = loginFormSchema.safeParse({ email, password });
  if (!validation.success) {
    return {
      success: false,
      message: validation.error.issues[0]?.message || 'Invalid input'
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
 * Validates sign up form inputs using Zod
 * Pure function for testability
 * 
 * @param email User's email
 * @param password User's password
 * @param confirmPassword Confirmation password
 * @param phone User's phone number
 * @param adminCode Registration code
 * @returns Validation result
 */
export async function validateSignUpInputs(
  email: string,
  password: string,
  confirmPassword: string,
  phone: string,
  adminCode: string
): Promise<{ isValid: boolean; message: string }> {
  // Validate using Zod schema
  const validation = registrationFormSchema.safeParse({
    email,
    password,
    confirmPassword,
    phone,
    adminCode
  });
  
  if (!validation.success) {
    return {
      isValid: false,
      message: validation.error.issues[0]?.message || 'Invalid input'
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
 * @param phone User's phone number
 * @param adminCode Registration code
 * @param userRole User's role
 * @param dependencies Injectable dependencies for testing
 */
export async function registerUser(
  email: string,
  password: string,
  confirmPassword: string,
  phone: string,
  adminCode: string,
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
  const validation = await validateSignUpInputs(email, password, confirmPassword, phone, adminCode);
  if (!validation.isValid) {
    return {
      success: false,
      message: validation.message
    };
  }

  try {
    // Verify the registration code
    const validationResult = await validateCodeFn(adminCode);
    
    if (!validationResult.isValid) {
      return {
        success: false,
        message: validationResult.message
      };
    }

    // Create user account with role from validation
    const createResult = await createUserFn(email, password, phone, validationResult.role);
    
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
 * Handles password reset request with Zod validation
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

  // Validate input using Zod
  const validation = forgotPasswordFormSchema.safeParse({ email });
  if (!validation.success) {
    return {
      success: false,
      message: validation.error.issues[0]?.message || 'Invalid email'
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
