/**
 * Integration tests for admin actions
 * Tests state transitions and credential generation against remote Supabase
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { approveGuest, denyGuest } from './admin-actions';
import { getSupabaseServiceClient } from './supabase-client';
import { GuestStatus } from './types';
import { notifyGuestOfApproval, sendAdminApprovalNotification, sendAdminDenialNotification } from './notifications';
import {
  makeRunId,
  createGuestForWorkflow,
  cleanupGuestArtifacts
} from '../test-utils/supabaseTestHarness';

describe('Admin Actions - Integration Tests', () => {
  const createdGuestIds: string[] = [];

  afterEach(async () => {
    // Clean up all created guests
    for (const guestId of createdGuestIds) {
      await cleanupGuestArtifacts(guestId);
    }
    createdGuestIds.length = 0;
  });

  describe('Approval flow', () => {
    it('should approve a guest and generate pass credentials', async () => {
      const runId = makeRunId();
      const userEmail = 'test-admin@vitest.com';

      // Create a guest in PENDING status
      const { guestId } = await createGuestForWorkflow({
        runId,
        status: GuestStatus.PENDING
      });
      createdGuestIds.push(guestId);

      // Spy on the notification functions to verify they're called
      const notifyGuestOfApprovalSpy = vi.fn(notifyGuestOfApproval);
      const sendAdminApprovalNotificationSpy = vi.fn(sendAdminApprovalNotification);

      // Approve the guest
      const result = await approveGuest(guestId, userEmail, {
        notificationFn: notifyGuestOfApprovalSpy,
        adminApprovalNotificationFn: sendAdminApprovalNotificationSpy
      });

      // Assert the action succeeded
      expect(result.success).toBe(true);
      expect(result.message).toContain('approved successfully');

      // Verify the database was updated with credentials
      const supabase = await getSupabaseServiceClient();
      const { data: guest, error } = await supabase
        .from('guests')
        .select('status, pass_id, code_word, qr_code, approved_by, approved_at')
        .eq('id', guestId)
        .single();

      expect(error).toBeNull();
      expect(guest).toBeDefined();
      expect(guest!.status).toBe(GuestStatus.APPROVED);
      expect(guest!.pass_id).toBeDefined();
      expect(guest!.code_word).toBeDefined();
      expect(guest!.qr_code).toBeDefined();
      expect(guest!.approved_by).toBe(userEmail);
      expect(guest!.approved_at).toBeDefined();

      // Verify code_word format (ColorNoun####)
      expect(guest!.code_word).toMatch(/^[A-Z][a-z]+[A-Z][a-z]+\d{4}$/);

      // Verify notifications were called
      expect(notifyGuestOfApprovalSpy).toHaveBeenCalledWith(guestId);
      expect(notifyGuestOfApprovalSpy).toHaveBeenCalledTimes(1);
      expect(sendAdminApprovalNotificationSpy).toHaveBeenCalledWith(guestId);
      expect(sendAdminApprovalNotificationSpy).toHaveBeenCalledTimes(1);
    }, 60000);
  });

  describe('Denial flows', () => {
    it('should deny a guest and update status to DENIED without notification when env var is false', async () => {
      const runId = makeRunId();
      const userEmail = 'test-admin@vitest.com';

      // Save original env var
      const originalEnvVar = process.env.NOTIFICATION_NOTIFY_ADMIN_ON_DENIAL;
      
      // Explicitly set env var to false for this test
      process.env.NOTIFICATION_NOTIFY_ADMIN_ON_DENIAL = 'false';

      try {
        // Create a guest in PENDING status
        const { guestId } = await createGuestForWorkflow({
          runId,
          status: GuestStatus.PENDING
        });
        createdGuestIds.push(guestId);

        // Spy on the admin denial notification function to verify it's NOT called
        const sendAdminDenialNotificationSpy = vi.fn(sendAdminDenialNotification);

        // Deny guest
        const result = await denyGuest(guestId, userEmail, {
          adminDenialNotificationFn: sendAdminDenialNotificationSpy
        });

        // Assert the action succeeded
        expect(result.success).toBe(true);
        expect(result.message).toContain('denied successfully');

        // Verify the database was updated
        const supabase = await getSupabaseServiceClient();
        const { data: guest, error } = await supabase
          .from('guests')
          .select('status, denied_by, denied_at')
          .eq('id', guestId)
          .single();

        expect(error).toBeNull();
        expect(guest).toBeDefined();
        expect(guest!.status).toBe(GuestStatus.DENIED);
        expect(guest!.denied_by).toBe(userEmail);
        expect(guest!.denied_at).toBeDefined();

        // Verify the admin denial notification was NOT called (env var is false)
        expect(sendAdminDenialNotificationSpy).not.toHaveBeenCalled();
      } finally {
        // Restore original env var
        if (originalEnvVar === undefined) {
          delete process.env.NOTIFICATION_NOTIFY_ADMIN_ON_DENIAL;
        } else {
          process.env.NOTIFICATION_NOTIFY_ADMIN_ON_DENIAL = originalEnvVar;
        }
      }
    }, 60000);

    it('should deny a guest and send admin notification when env var is true', async () => {
      const runId = makeRunId();
      const userEmail = 'test-admin@vitest.com';
      
      // Save original env var
      const originalEnvVar = process.env.NOTIFICATION_NOTIFY_ADMIN_ON_DENIAL;
      
      // Explicitly set env var to true for this test
      process.env.NOTIFICATION_NOTIFY_ADMIN_ON_DENIAL = 'true';

      try {
        // Create a guest in PENDING status
        const { guestId } = await createGuestForWorkflow({
          runId,
          status: GuestStatus.PENDING
        });
        createdGuestIds.push(guestId);

        // Spy on the admin denial notification function
        const sendAdminDenialNotificationSpy = vi.fn(sendAdminDenialNotification);

        // Deny guest
        const result = await denyGuest(guestId, userEmail, {
          adminDenialNotificationFn: sendAdminDenialNotificationSpy
        });

        // Assert the action succeeded
        expect(result.success).toBe(true);
        expect(result.message).toContain('denied successfully');

        // Verify the database was updated
        const supabase = await getSupabaseServiceClient();
        const { data: guest, error } = await supabase
          .from('guests')
          .select('status, denied_by, denied_at')
          .eq('id', guestId)
          .single();

        expect(error).toBeNull();
        expect(guest).toBeDefined();
        expect(guest!.status).toBe(GuestStatus.DENIED);
        expect(guest!.denied_by).toBe(userEmail);
        expect(guest!.denied_at).toBeDefined();

        // Verify the admin denial notification WAS called
        expect(sendAdminDenialNotificationSpy).toHaveBeenCalledWith(guestId);
        expect(sendAdminDenialNotificationSpy).toHaveBeenCalledTimes(1);
      } finally {
        // Restore original env var
        if (originalEnvVar === undefined) {
          delete process.env.NOTIFICATION_NOTIFY_ADMIN_ON_DENIAL;
        } else {
          process.env.NOTIFICATION_NOTIFY_ADMIN_ON_DENIAL = originalEnvVar;
        }
      }
    }, 60000);
  });
});

