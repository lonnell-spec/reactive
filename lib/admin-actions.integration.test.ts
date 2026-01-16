/**
 * Integration tests for admin actions
 * Tests state transitions and credential generation against remote Supabase
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { approveGuest, denyGuest } from './admin-actions';
import { getSupabaseServiceClient } from './supabase-client';
import { GuestStatus } from './types';
import { notifyGuestOfApproval, sendAdminInfoNotification } from './notifications';
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
      const sendAdminInfoNotificationSpy = vi.fn(sendAdminInfoNotification);

      // Approve the guest
      const result = await approveGuest(guestId, userEmail, {
        notificationFn: notifyGuestOfApprovalSpy,
        adminInfoNotificationFn: sendAdminInfoNotificationSpy
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
      expect(sendAdminInfoNotificationSpy).toHaveBeenCalledWith(guestId);
      expect(sendAdminInfoNotificationSpy).toHaveBeenCalledTimes(1);
    }, 60000);
  });

  describe('Denial flows', () => {
    it('should deny a guest and update status to DENIED', async () => {
      const runId = makeRunId();
      const userEmail = 'test-admin@vitest.com';

      // Create a guest in PENDING status
      const { guestId } = await createGuestForWorkflow({
        runId,
        status: GuestStatus.PENDING
      });
      createdGuestIds.push(guestId);

      // Spy on the admin info notification function to verify it's called
      const sendAdminInfoNotificationSpy = vi.fn(sendAdminInfoNotification);

      // Deny guest
      const result = await denyGuest(guestId, userEmail, {
        adminInfoNotificationFn: sendAdminInfoNotificationSpy
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

      // Verify the admin info notification was NOT called (env var not set)
      expect(sendAdminInfoNotificationSpy).not.toHaveBeenCalled();
    }, 60000);
  });
});

