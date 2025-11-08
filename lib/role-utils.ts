'use server'

/**
 * Gets user-friendly role name
 * Pure function for testability
 * 
 * @param role The role identifier
 * @returns User-friendly role name
 */
export async function getRoleName(role: string): Promise<string> {
  const roleNames: Record<string, string> = {
    'pre_approver': 'Pre-Approver',
    'admin': 'Admin'
  };
  
  return roleNames[role] || role;
}

/**
 * Validates if a role is supported
 * Pure function for testability
 * 
 * @param role The role to validate
 * @returns True if role is valid
 */
export async function isValidRole(role: string): Promise<boolean> {
  const validRoles = ['pre_approver', 'admin'];
  return validRoles.includes(role);
}

/**
 * Gets environment variable for registration codes
 * Pure function for testability (with dependency injection)
 * 
 * @param codeType The type of code to get ('admin' for admin role, 'general' for no role)
 * @param envGetter Function to get environment variables (for testing)
 * @returns Registration code from environment
 */
export async function getRoleRegistrationCode(
  codeType: string,
  envGetter: (key: string) => string | undefined = (key) => process.env[key]
): Promise<string> {
  if (codeType === 'admin') {
    return envGetter('ADMIN_REGISTRATION_CODE') || '';
  }
  
  if (codeType === 'general') {
    return envGetter('REGISTRATION_CODE') || '';
  }
  
  throw new Error(`No environment key defined for code type: ${codeType}. Supported types: 'admin', 'general'.`);
}
