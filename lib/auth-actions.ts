'use server'

import { createClient } from '@supabase/supabase-js'

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
  // Get the appropriate registration code from environment variables
  let validCode = '';
  
  switch (selectedRole) {
    case 'pre_approver':
      validCode = process.env.PRE_APPROVER_REGISTRATION_CODE || '';
      break;
    case 'pending_approver':
      validCode = process.env.APPROVER_REGISTRATION_CODE || '';
      break;
    case 'admin':
      validCode = process.env.ADMIN_REGISTRATION_CODE || '';
      break;
    default:
      return {
        isValid: false,
        message: 'Invalid role selected'
      };
  }

  // Validate the code
  if (!validCode) {
    console.error(`Registration code not configured for role: ${selectedRole}`);
    return {
      isValid: false,
      message: 'Registration is not available for this role. Please contact the system administrator.'
    };
  }

  if (code !== validCode) {
    return {
      isValid: false,
      message: `Invalid registration code for ${getRoleName(selectedRole)}`
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
 * 
 * @param email User's email
 * @param password User's password
 * @param role User's role
 * @returns Object with success status and message
 */
export async function createUserWithRole(
  email: string,
  password: string,
  role: string
) {
  try {
    // Create a Supabase client with the service role key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase credentials not configured');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create the user
    // Note: We need to set the role in app_metadata for RLS policies to work
    // The role in user_metadata is for display purposes only
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        role
      },
      app_metadata: {
        role
      }
    });
    
    // Log the created user for debugging
    console.log('Created user with role:', { role, user: data?.user });

    if (error) {
      throw error;
    }

    return {
      success: true,
      message: 'Account created successfully',
      userId: data.user?.id
    };
  } catch (err) {
    console.error('Error creating user:', err);
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Failed to create account'
    };
  }
}

/**
 * Ensures a user has the correct role in their app_metadata
 * This is useful for fixing users who might have the role in the wrong place
 * 
 * @param userId The user ID to update
 * @param role The role to ensure
 * @returns Object with success status and message
 */
export async function ensureUserRole(userId: string, role: string) {
  try {
    // Create a Supabase client with the service role key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase credentials not configured');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the current user
    const { data: userData, error: getUserError } = await supabase.auth.admin.getUserById(userId);
    
    if (getUserError) {
      throw getUserError;
    }
    
    if (!userData?.user) {
      throw new Error('User not found');
    }
    
    console.log('Current user data:', userData.user);
    
    // Update the user's app_metadata
    const { data, error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      app_metadata: { role }
    });
    
    if (updateError) {
      throw updateError;
    }
    
    console.log('Updated user data:', data?.user);
    
    return {
      success: true,
      message: `Role ${role} has been applied to user ${userId}`,
      user: data?.user
    };
  } catch (err) {
    console.error('Error ensuring user role:', err);
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Failed to update user role'
    };
  }
}

// Helper function to get a user-friendly role name
function getRoleName(role: string): string {
  switch (role) {
    case 'pre_approver':
      return 'Pre-Approver';
    case 'pending_approver':
      return 'Approver';
    case 'admin':
      return 'Admin';
    default:
      return role;
  }
}
