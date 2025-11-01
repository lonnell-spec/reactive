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
 * Gets environment variable for role registration code
 * Pure function for testability (with dependency injection)
 * 
 * @param role The role to get code for
 * @param envGetter Function to get environment variables (for testing)
 * @returns Registration code from environment
 */
export async function getRoleRegistrationCode(
  role: string,
  envGetter: (key: string) => string | undefined = (key) => process.env[key]
): Promise<string> {
  const envKeys: Record<string, string> = {
    'pre_approver': 'PRE_APPROVER_REGISTRATION_CODE',
    'admin': 'ADMIN_REGISTRATION_CODE'
  };
  
  const envKey = envKeys[role];
  if (!envKey) {
    throw new Error(`No environment key defined for role: ${role}`);
  }
  
  return envGetter(envKey) || '';
}
