'use server'

import { getSupabaseServiceClient } from './supabase-client'

// Generate a signed URL for private storage access
export async function getProfilePicUrl(profilePath: string): Promise<string> {
  if (!profilePath) return ''
  
  try {
    const supabase = await getSupabaseServiceClient()
    
    // Generate a signed URL that expires in 1 hour
    const { data, error } = await supabase.storage
      .from('guest-photos')
      .createSignedUrl(profilePath, 3600) // 3600 seconds = 1 hour
    
    if (error) {
      return ''
    }
    
    return data.signedUrl
  } catch (error) {
    console.error(`[getProfilePicUrl] Failed to get profile picture URL for path ${profilePath}:`, error);
    return ''
  }
}

// Generate a signed URL for child photo access using stored photo path
export async function getChildPhotoUrl(photoPath: string): Promise<string> {
  if (!photoPath) return ''
  
  try {
    const supabase = await getSupabaseServiceClient()
    
    // Use the stored photo path directly
    const { data, error } = await supabase.storage
      .from('guest-photos')
      .createSignedUrl(photoPath, 3600) // 3600 seconds = 1 hour
    
    if (error) {
      return ''
    }
    
    return data.signedUrl
  } catch (error) {
    console.error(`[getChildPhotoUrl] Failed to get child photo URL for path ${photoPath}:`, error);
    return ''
  }
}
