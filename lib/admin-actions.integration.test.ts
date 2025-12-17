/**
 * Integration tests for admin actions
 * Tests state transitions and credential generation against remote Supabase
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { preApproveGuest, approveGuest, denyPreApproval, denyGuest } from './admin-actions';
import { getSupabaseServiceClient } from './supabase-client';
import { GuestStatus } from './types';
import { sendApproverNotification, notifyGuestOfApproval } from './notifications';
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

  describe('Pre-approval flow', () => {
    it('should pre-approve a guest and update status to PENDING', async () => {
      const runId = makeRunId();
      const userEmail = 'test-admin@vitest.com';

      // Create a guest in PENDING_PRE_APPROVAL status
      const { guestId } = await createGuestForWorkflow({
        runId,
        status: GuestStatus.PENDING_PRE_APPROVAL
      });
      createdGuestIds.push(guestId);

      // Spy on the actual sendApproverNotification function to verify it's called
      // This wraps the real function so we can track calls while still executing it
      const sendApproverNotificationSpy = vi.fn(sendApproverNotification);

      // Pre-approve the guest (without overriding notification - let it use the real function)
      const result = await preApproveGuest(guestId, userEmail, {
        approverNotificationFn: sendApproverNotificationSpy,
      });

      // Assert the action succeeded
      expect(result.success).toBe(true);
      expect(result.message).toContain('pre-approved successfully');

      // Verify the database was updated
      const supabase = await getSupabaseServiceClient();
      const { data: guest, error } = await supabase
        .from('guests')
        .select('status, pre_approved_by, pre_approved_at')
        .eq('id', guestId)
        .single();

      expect(error).toBeNull();
      expect(guest).toBeDefined();
      expect(guest!.status).toBe(GuestStatus.PENDING);
      expect(guest!.pre_approved_by).toBe(userEmail);
      expect(guest!.pre_approved_at).toBeDefined();

      // Verify the actual sendApproverNotification function was called
      expect(sendApproverNotificationSpy).toHaveBeenCalledWith(guestId);
      expect(sendApproverNotificationSpy).toHaveBeenCalledTimes(1);
    }, 60000);
  });

  describe('Final approval flow', () => {
    it('should approve a PENDING guest and generate pass credentials', async () => {
      const runId = makeRunId();
      const userEmail = 'test-admin@vitest.com';

      // Create a guest in PENDING status (already pre-approved)
      const { guestId } = await createGuestForWorkflow({
        runId,
        status: GuestStatus.PENDING
      });
      createdGuestIds.push(guestId);

      // Spy on the actual notifyGuestOfApproval function to verify it's called
      // This wraps the real function so we can track calls while still executing it
      const notifyGuestOfApprovalSpy = vi.fn(notifyGuestOfApproval);

      // Approve the guest
      const result = await approveGuest(guestId, userEmail, {
        notificationFn: notifyGuestOfApprovalSpy
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

      // Verify notification was called
      expect(notifyGuestOfApprovalSpy).toHaveBeenCalledWith(guestId);
      expect(notifyGuestOfApprovalSpy).toHaveBeenCalledTimes(1);
    }, 60000);

    it('should complete full workflow: PENDING_PRE_APPROVAL → PENDING → APPROVED', async () => {
      const runId = makeRunId();
      const userEmail = 'test-admin@vitest.com';

      // Create a guest in initial status
      const { guestId } = await createGuestForWorkflow({
        runId,
        status: GuestStatus.PENDING_PRE_APPROVAL
      });
      createdGuestIds.push(guestId);

      // Spy on the actual sendApproverNotification function to verify it's called
      // This wraps the real function so we can track calls while still executing it
      const sendApproverNotificationSpy = vi.fn(sendApproverNotification);

      // Step 1: Pre-approve
      const preApproveResult = await preApproveGuest(guestId, userEmail, {
        approverNotificationFn: sendApproverNotificationSpy,
      });
      expect(preApproveResult.success).toBe(true);

      // Verify status changed to PENDING
      const supabase = await getSupabaseServiceClient();
      const { data: guestAfterPreApprove } = await supabase
        .from('guests')
        .select('status')
        .eq('id', guestId)
        .single();
      expect(guestAfterPreApprove!.status).toBe(GuestStatus.PENDING);

      // Step 2: Final approve
      const notifyGuestOfApprovalSpy = vi.fn(notifyGuestOfApproval);

      const approveResult = await approveGuest(guestId, userEmail, {
        notificationFn: notifyGuestOfApprovalSpy
      });
      
      expect(approveResult.success).toBe(true);

      // Verify status changed to APPROVED with credentials
      const { data: guestAfterApprove } = await supabase
        .from('guests')
        .select('status, pass_id, code_word, qr_code')
        .eq('id', guestId)
        .single();
      expect(guestAfterApprove!.status).toBe(GuestStatus.APPROVED);
      expect(guestAfterApprove!.pass_id).toBeDefined();
      expect(guestAfterApprove!.code_word).toBeDefined();
      expect(guestAfterApprove!.qr_code).toBeDefined();
    }, 60000);
  });

  describe('Denial flows', () => {
    it('should deny pre-approval and update status to PRE_APPROVAL_DENIED', async () => {
      const runId = makeRunId();
      const userEmail = 'test-admin@vitest.com';

      // Create a guest in PENDING_PRE_APPROVAL status
      const { guestId } = await createGuestForWorkflow({
        runId,
        status: GuestStatus.PENDING_PRE_APPROVAL
      });
      createdGuestIds.push(guestId);

      // Deny pre-approval
      const result = await denyPreApproval(guestId, userEmail, 'Test denial', {
      });

      // Assert the action succeeded
      expect(result.success).toBe(true);
      expect(result.message).toContain('denied successfully');

      // Verify the database was updated
      const supabase = await getSupabaseServiceClient();
      const { data: guest, error } = await supabase
        .from('guests')
        .select('status, pre_approval_denied_by, pre_approval_denied_at')
        .eq('id', guestId)
        .single();

      expect(error).toBeNull();
      expect(guest).toBeDefined();
      expect(guest!.status).toBe(GuestStatus.PRE_APPROVAL_DENIED);
      expect(guest!.pre_approval_denied_by).toBe(userEmail);
      expect(guest!.pre_approval_denied_at).toBeDefined();
    }, 60000);

    it('should deny final approval and update status to DENIED', async () => {
      const runId = makeRunId();
      const userEmail = 'test-admin@vitest.com';

      // Create a guest in PENDING status
      const { guestId } = await createGuestForWorkflow({
        runId,
        status: GuestStatus.PENDING
      });
      createdGuestIds.push(guestId);

      // Deny guest
      const result = await denyGuest(guestId, userEmail, 'Test denial', {
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
    }, 60000);
  });
});

