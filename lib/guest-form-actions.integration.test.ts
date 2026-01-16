/**
 * Integration tests for guest form submission
 * Tests against remote Supabase instance with unique IDs and cleanup
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { submitGuestForm } from './guest-form-actions';
import { getSupabaseServiceClient } from './supabase-client';
import { GuestStatus } from './types';
import { 
  makeRunId, 
  createGuestFormData, 
  cleanupGuestArtifacts 
} from '../test-utils/supabaseTestHarness';
import { sendPreApproverNotification } from './notifications';

describe('Guest Form Submission - Integration Tests', () => {
  const createdGuestIds: string[] = [];
  
  afterEach(async () => {
    // Clean up all created guests
    for (const guestId of createdGuestIds) {
      await cleanupGuestArtifacts(guestId);
    }
    createdGuestIds.length = 0;
  });

  it('should submit guest form successfully with all data persisted', async () => {
    const runId = makeRunId();
    const formData = await createGuestFormData({ runId });
    
    // Mock the notification function to prevent actual sends
    const notifyGuestOfPreApprovalSpy = vi.fn(sendPreApproverNotification);
    
    // Submit the form
    const result = await submitGuestForm(formData, {
      sendNotificationFn: notifyGuestOfPreApprovalSpy
    });
    
    // Log result for debugging if it fails
    if (!result.success) {
      console.error('Submission failed:', result.message);
    }
    
    // Assert submission succeeded
    expect(result.success).toBe(true);
    expect(result.submissionId).toBeDefined();
    expect(result.message).toContain('pending approval');
    
    // Verify the guest was created in the database
    const supabaseService = await getSupabaseServiceClient();
    const { data: guest, error } = await supabaseService
      .from('guests')
      .select('*')
      .eq('external_guest_id', result.submissionId)
      .single();
    
    expect(error).toBeNull();
    expect(guest).toBeDefined();
    expect(guest.status).toBe(GuestStatus.PENDING);
    expect(guest.first_name).toBe('TestGuest');
    expect(guest.last_name).toContain('vitest-');
    expect(guest.email).toContain('@vitest.example.com');
    expect(guest.expires_at).toBeDefined();
    expect(guest.text_callback_reference_id).toBeDefined();
    expect(guest.photo_path).toBeDefined();
    
    // Verify the profile photo was uploaded to storage
    const { data: storageFiles } = await supabaseService
      .storage
      .from('guest-photos')
      .list('guest/' + guest.id + '/profile');
    
    expect(storageFiles).toBeDefined();
    expect(storageFiles?.length).toBeGreaterThan(0);
    
    // Verify notification was called
    expect(notifyGuestOfPreApprovalSpy).toHaveBeenCalledWith(guest.id);
    
    // Track for cleanup
    createdGuestIds.push(guest.id);
  }, 60000);

  it('should rollback all changes when submission fails after guest insert', async () => {
    const runId = makeRunId();
    const formData = await createGuestFormData({ runId });
    
    // Track the guest ID that gets created before failure
    let capturedGuestId: string | null = null;
    
    // Inject a function that captures the guest ID then throws
    const failingUpload = vi.fn().mockImplementation(async (supabase: any, parsedData: any, guest: any) => {
      capturedGuestId = guest.id;
      throw new Error('Simulated upload failure');
    });
    
    // Submit with the failing upload
    const result = await submitGuestForm(formData, {
      uploadProfilePictureFn: failingUpload
    });
    
    // Assert submission failed
    expect(result.success).toBe(false);
    expect(result.message).toContain('Simulated upload failure');
    
    // Verify the guest was NOT left in the database (rollback worked)
    if (capturedGuestId) {
      const supabaseService = await getSupabaseServiceClient();
      const { data: guest, error } = await supabaseService
        .from('guests')
        .select('id')
        .eq('id', capturedGuestId)
        .maybeSingle();
      
      // Guest should not exist (either null or error)
      expect(guest).toBeNull();
    }
  }, 60000);

  it('should handle guest submission with children', async () => {
    const runId = makeRunId();
    const formData = await createGuestFormData({ 
      runId, 
      includeChildren: true 
    });
    
    // Mock notification
    const sendPreApproverNotificationSpy = vi.fn(sendPreApproverNotification);

    
    // Submit the form
    const result = await submitGuestForm(formData, {
      sendNotificationFn: sendPreApproverNotificationSpy
    });
    
    expect(result.success).toBe(true);
    
    // Verify the child was created
    const supabaseService = await getSupabaseServiceClient();
    const { data: guest } = await supabaseService
      .from('guests')
      .select('id')
      .eq('external_guest_id', result.submissionId)
      .single();
    
    if (guest) {
      const { data: children } = await supabaseService
        .from('guest_children')
        .select('*')
        .eq('guest_id', guest.id);
      
      expect(children).toBeDefined();
      expect(children?.length).toBeGreaterThan(0);
      expect(children?.[0].name).toContain('TestChild-vitest-');
      
      // Track for cleanup
      createdGuestIds.push(guest.id);
    }
  }, 60000);
});

