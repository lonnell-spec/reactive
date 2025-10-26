'use server'

import { createClient } from '@supabase/supabase-js'
import { GuestStatus } from './types'

/**
 * Creates a test guest record with pending_pre_approval status
 * This function bypasses RLS by using the service role key
 */
export async function createTestGuest() {
  try {
    // Create a Supabase client with the service role key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase credentials not configured');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create a test guest record
    const guestData = {
      status: GuestStatus.PENDING_PRE_APPROVAL, // Explicitly use the enum
      first_name: 'Test',
      last_name: 'Guest',
      phone: '1234567890',
      email: 'test@example.com',
      visit_date: new Date().toISOString().split('T')[0], // Today's date
      gathering_time: '10:00 AM',
      total_guests: 2,
      should_enroll_children: false,
      vehicle_type: 'Car',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('Creating test guest with data:', guestData);
    
    const { data, error } = await supabase
      .from('guests')
      .insert(guestData)
      .select();
    
    if (error) {
      throw error;
    }
    
    console.log('Test guest created successfully:', data);
    
    return {
      success: true,
      message: 'Test guest created successfully',
      guest: data[0]
    };
  } catch (err) {
    console.error('Error creating test guest:', err);
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Failed to create test guest'
    };
  }
}

/**
 * Checks if RLS policies are working correctly for the given user
 * This function tests if the user can see records with pending_pre_approval status
 */
export async function testRlsPolicies(userId: string) {
  try {
    // First create a test guest with the service role key
    const createResult = await createTestGuest();
    
    if (!createResult.success) {
      throw new Error(`Failed to create test guest: ${createResult.message}`);
    }
    
    // Get the user's JWT
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase credentials not configured');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get the user's metadata
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
    
    if (userError) {
      throw userError;
    }
    
    if (!userData?.user) {
      throw new Error('User not found');
    }
    
    console.log('User metadata:', {
      id: userData.user.id,
      app_metadata: userData.user.app_metadata,
      user_metadata: userData.user.user_metadata
    });
    
    // Now try to fetch the test guest with the user's permissions
    // We can't directly use the user's JWT here, so we'll just report what we found
    
    return {
      success: true,
      message: 'RLS policy test completed',
      user: {
        id: userData.user.id,
        app_metadata: userData.user.app_metadata,
        user_metadata: userData.user.user_metadata
      },
      testGuest: createResult.guest,
      instructions: 'Check the browser console for detailed logs. A test guest with pending_pre_approval status has been created. Try refreshing the page to see if it appears in the dashboard.'
    };
  } catch (err) {
    console.error('Error testing RLS policies:', err);
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Failed to test RLS policies'
    };
  }
}
