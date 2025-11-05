'use server'

import { getSupabaseServiceClient } from './supabase-client';
import { getRoleName, isValidRole, getRoleRegistrationCode } from './role-utils';
import { isValidEmailFormat } from './string-utils';

// Define the response type for our validation
interface ValidationResponse {
  isValid: boolean
  message: string
  role?: string
}

/**
 * Validates a registration code against the appropriate role
 * 
 * @param code The registration code to validate
 * @param selectedRole The role that the user has selected
 * @returns ValidationResponse with validation result
 */
export async function validateRegistrationCode(
  code: string,
  selectedRole: string
): Promise<ValidationResponse> {
  // Validate role using pure function
  if (!(await isValidRole(selectedRole))) {
    return {
      isValid: false,
      message: 'Invalid role selected'
    };
  }

  // Get registration code using pure function
  const validCode = await getRoleRegistrationCode(selectedRole);

  // Validate the code
  if (!validCode) {
    return {
      isValid: false,
      message: 'Registration is not available for this role. Please contact the system administrator.'
    };
  }

  if (code !== validCode) {
    const roleName = await getRoleName(selectedRole);
    return {
      isValid: false,
      message: `Invalid registration code for ${roleName}`
    };
  }

  return {
    isValid: true,
    message: 'Registration code validated successfully',
    role: selectedRole
  };
}

/**
 * Creates a new user account with the specified role
 * Pure business logic with injectable dependencies
 * 
 * @param email User's email
 * @param password User's password
 * @param phone User's phone number
 * @param role User's role
 * @param dependencies Injectable dependencies for testing
 * @returns Object with success status and message
 */
export async function createUserWithRole(
  email: string,
  password: string,
  phone: string,
  role: string,
  dependencies: {
    getSupabaseClient?: typeof getSupabaseServiceClient;
    createUserData?: (email: string, password: string, phone: string, role: string) => Promise<any>;
  } = {}
) {
  const {
    getSupabaseClient = getSupabaseServiceClient,
    createUserData = createUserCreationData
  } = dependencies;

  // Validate inputs using pure function
  const validation = await validateUserCreationInputs(email, password, phone, role);
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
  phone: string,
  role: string
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

  // Validate role
  if (!(await isValidRole(role))) {
    return {
      isValid: false,
      message: 'Invalid role specified'
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
 * @param role User's role
 * @returns User creation data object
 */
export async function createUserCreationData(
  email: string,
  password: string,
  phone: string,
  role: string
): Promise<any> {
  return {
    email,
    password,
    phone,
    email_confirm: true, // Auto-confirm email
    phone_confirm: false, // Don't require phone verification for now
    user_metadata: {
      role,
      phone
    },
    app_metadata: {
      role
    }
  };
}

