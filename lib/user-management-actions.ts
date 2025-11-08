'use server'

import { getSupabaseServiceClient } from './supabase-client'

export interface UserProfile {
  id: string
  email: string
  phone?: string
  roles: string[]
  created_at: string
}

/**
 * Get all users with their roles
 */
export async function getAllUsers(): Promise<{ success: boolean; users?: UserProfile[]; message?: string }> {
  try {
    const supabaseService = await getSupabaseServiceClient()
    
    const { data: users, error } = await supabaseService.auth.admin.listUsers()
    
    if (error) {
      throw error
    }

    const userProfiles: UserProfile[] = users.users.map(user => {
      // Get roles from app_metadata or user_metadata, handle both array and legacy single role
      const appRoles = user.app_metadata?.roles || []
      const userRoles = user.user_metadata?.roles || []
      const legacyRole = user.app_metadata?.role || user.user_metadata?.role
      
      let roles: string[] = []
      if (Array.isArray(appRoles) && appRoles.length > 0) {
        roles = appRoles
      } else if (Array.isArray(userRoles) && userRoles.length > 0) {
        roles = userRoles
      } else if (legacyRole) {
        roles = [legacyRole] // Convert legacy single role to array
      }

      return {
        id: user.id,
        email: user.email || '',
        phone: user.user_metadata?.phone || '',
        roles: roles,
        created_at: user.created_at
      }
    })

    return {
      success: true,
      users: userProfiles
    }
  } catch (error) {
    console.error('Error fetching users:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch users'
    }
  }
}

/**
 * Update user roles (array-based)
 */
export async function updateUserRoles(
  userId: string, 
  roles: string[]
): Promise<{ success: boolean; message: string }> {
  try {
    const supabaseService = await getSupabaseServiceClient()
    
    // Validate roles
    const validRoles = ['admin', 'pre_approver']
    const invalidRoles = roles.filter(role => !validRoles.includes(role))
    if (invalidRoles.length > 0) {
      return {
        success: false,
        message: `Invalid roles: ${invalidRoles.join(', ')}. Must be "admin" or "pre_approver"`
      }
    }

    // Update user metadata with roles array
    const { error } = await supabaseService.auth.admin.updateUserById(userId, {
      app_metadata: { roles: roles },
      user_metadata: { roles: roles }
    })

    if (error) {
      throw error
    }

    return {
      success: true,
      message: roles.length > 0 ? `User roles updated to: ${roles.join(', ')}` : 'All user roles removed'
    }
  } catch (error) {
    console.error('Error updating user roles:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update user roles'
    }
  }
}

