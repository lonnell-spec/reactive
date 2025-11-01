'use server'

/**
 * User roles interface
 */
export interface UserRoles {
  isPreApprover: boolean;
  isAdmin: boolean;
}

/**
 * Determines user roles based on user metadata
 * Pure function for testability
 * 
 * @param user User object with metadata
 * @returns UserRoles object
 */
export async function determineUserRoles(user: any): Promise<UserRoles> {
  if (!user) {
    return { isPreApprover: false, isAdmin: false };
  }

  try {
    // First check app_metadata, then user_metadata
    const userRole = user.app_metadata?.role || user.user_metadata?.role || '';
    
    // Check if user has admin role (can see everything)
    const isAdmin = userRole === 'admin';
    
    // Check for pre-approver role
    const isPreApprover = isAdmin || userRole === 'pre_approver';
    
    return { isPreApprover, isAdmin };
  } catch (err) {
    // Default to no permissions on any error
    return { isPreApprover: false, isAdmin: false };
  }
}

/**
 * Checks if user has admin role
 * Pure function for testability
 * 
 * @param user User object with metadata
 * @returns True if user is admin
 */
export async function isUserAdmin(user: any): Promise<boolean> {
  const roles = await determineUserRoles(user);
  return roles.isAdmin;
}

/**
 * Checks if user has pre-approver role
 * Pure function for testability
 * 
 * @param user User object with metadata
 * @returns True if user can pre-approve
 */
export async function isUserPreApprover(user: any): Promise<boolean> {
  const roles = await determineUserRoles(user);
  return roles.isPreApprover;
}

/**
 * Gets user role string from metadata
 * Pure function for testability
 * 
 * @param user User object with metadata
 * @returns Role string or empty string if not found
 */
export async function getUserRoleString(user: any): Promise<string> {
  if (!user) return '';
  return user.app_metadata?.role || user.user_metadata?.role || '';
}
