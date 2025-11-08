'use server'

import { getSupabaseServiceClient } from './supabase-client';
import { getRoleName, isValidRole, getRoleRegistrationCode } from './role-utils';
import { isValidEmailFormat } from './string-utils';

// Define the response type for our validation
interface ValidationResponse {
  isValid: boolean
  message: string
  role?: string | null
}

/**
 * Validates a registration code and determines role assignment
 * 
 * @param code The registration code to validate
 * @returns ValidationResponse with validation result and role
 */
export async function validateRegistrationCode(
  code: string
): Promise<ValidationResponse> {
  // Check admin registration code first
  const adminCode = await getRoleRegistrationCode('admin');
  const generalCode = await getRoleRegistrationCode('general');

  if (adminCode && code === adminCode) {
    return {
      isValid: true,
      message: 'Admin registration code validated successfully',
      role: 'admin'
    };
  }

  if (generalCode && code === generalCode) {
    return {
      isValid: true,
      message: 'Registration code validated successfully',
      role: null // No role assigned for general registration
    };
  }

  return {
    isValid: false,
    message: 'Invalid registration code'
  };
}

/**
 * Creates a new user account with optional role assignment
 * Pure business logic with injectable dependencies
 * 
 * @param email User's email
 * @param password User's password
 * @param phone User's phone number
 * @param role Optional role to assign (admin gets assigned during registration)
 * @param dependencies Injectable dependencies for testing
 * @returns Object with success status and message
 */
export async function createUserWithRole(
  email: string,
  password: string,
  phone: string,
  role?: string | null,
  dependencies: {
    getSupabaseClient?: typeof getSupabaseServiceClient;
    createUserData?: (email: string, password: string, phone: string, role?: string | null) => Promise<any>;
  } = {}
) {
  const {
    getSupabaseClient = getSupabaseServiceClient,
    createUserData = createUserCreationData
  } = dependencies;

  // Validate inputs using pure function
  const validation = await validateUserCreationInputs(email, password, phone);
  if (!validation.isValid) {
    return {
      success: false,
      message: validation.message
    };
  }

  try {
    const supabaseService = await getSupabaseClient();
    
    // Prepare user creation data using pure function
    const userData = await createUserData(email, password, phone, role);

    // Create the user
    const { data, error } = await supabaseService.auth.admin.createUser(userData);
    
    if (error) {
      throw error;
    }

    return {
      success: true,
      message: 'Account created successfully',
      userId: data.user?.id
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Failed to create account'
    };
  }
}

/**
 * Validates user creation inputs
 * Pure function for testability
 * 
 * @param email User's email
 * @param password User's password
 * @param phone User's phone number
 * @param role User's role
 * @returns Validation result
 */
export async function validateUserCreationInputs(
  email: string,
  password: string,
  phone: string
): Promise<ValidationResponse> {
  // Validate email format
  if (!email || !(await isValidEmailFormat(email))) {
    return {
      isValid: false,
      message: 'Please provide a valid email address'
    };
  }

  // Validate password strength
  if (!password || password.length < 6) {
    return {
      isValid: false,
      message: 'Password must be at least 6 characters long'
    };
  }

  // Validate phone number (basic validation)
  if (!phone || phone.trim().length < 10) {
    return {
      isValid: false,
      message: 'Please provide a valid phone number'
    };
  }

  return {
    isValid: true,
    message: 'Validation passed'
  };
}

/**
 * Creates user creation data object
 * Pure function for testability
 * 
 * @param email User's email
 * @param password User's password
 * @param phone User's phone number
 * @param role Optional role to assign (stored as array)
 * @returns User creation data object
 */
export async function createUserCreationData(
  email: string,
  password: string,
  phone: string,
  role?: string | null
): Promise<any> {
  // Convert single role to array format
  const roles = role ? [role] : [];

  const emailConfirmRequired = process.env.SUPABASE_EMAIL_CONFIRMATION_CONFIGURED?.toLowerCase() === 'true';
  const phoneConfirmRequired = process.env.SUPABASE_PHONE_CONFIRMATION_CONFIGURED?.toLowerCase() === 'true';
  return {
    email,
    password,
    phone,
    email_confirm: !emailConfirmRequired, // these are flipped because api is asking if you want to say true to go ahead and auto confirm.
    phone_confirm: !phoneConfirmRequired, // these are flipped because api is asking if you want to say true to go ahead and auto confirm.
    user_metadata: {
      phone,
      roles // Store roles as array in user_metadata
    },
    app_metadata: {
      roles // Store roles as array in app_metadata
    }
  };
}

