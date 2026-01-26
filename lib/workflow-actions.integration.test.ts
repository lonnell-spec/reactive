/**
 * Integration tests for workflow actions
 * Tests SMS callback routing and state transitions against remote Supabase
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { processWorkflowAction } from './workflow-actions';
import { getSupabaseServiceClient } from './supabase-client';
import { GuestStatus } from './types';
import { notifyGuestOfApproval, sendAdminApprovalNotification, sendAdminDenialNotification } from './notifications';
import {
  makeRunId,
  createGuestForWorkflow,
  cleanupGuestArtifacts
} from '../test-utils/supabaseTestHarness';

describe('Workflow Actions - Integration Tests', () => {
  const createdGuestIds: string[] = [];

  afterEach(async () => {
    // Clean up all created guests
    for (const guestId of createdGuestIds) {
      await cleanupGuestArtifacts(guestId);
    }
    createdGuestIds.length = 0;
  });

  describe('Approve routing', () => {
    it('should approve a PENDING guest and generate credentials via processWorkflowAction', async () => {
      const runId = makeRunId();

      // Create a guest in PENDING status
      const { guestId, textRefId } = await createGuestForWorkflow({
        runId,
        status: GuestStatus.PENDING
      });
      createdGuestIds.push(guestId);

      // Create notification spies
      const notifyGuestOfApprovalSpy = vi.fn(notifyGuestOfApproval);
      const sendAdminApprovalNotificationSpy = vi.fn(sendAdminApprovalNotification);

      // Process approve action using text reference ID
      const result = await processWorkflowAction('approve', String(textRefId), {
        approvalNotificationFn: notifyGuestOfApprovalSpy,
        adminApprovalNotificationFn: sendAdminApprovalNotificationSpy
      });

      // Assert the action succeeded
      expect(result.success).toBe(true);
      expect(result.message).toContain('approved');

      // Verify the database was updated to APPROVED with credentials
      const supabase = await getSupabaseServiceClient();
      const { data: guest, error } = await supabase
        .from('guests')
        .select('status, pass_id, code_word, qr_code, approved_by')
        .eq('id', guestId)
        .single();

      expect(error).toBeNull();
      expect(guest).toBeDefined();
      expect(guest!.status).toBe(GuestStatus.APPROVED);
      expect(guest!.pass_id).toBeDefined();
      expect(guest!.code_word).toBeDefined();
      expect(guest!.qr_code).toBeDefined();
      expect(guest!.approved_by).toBe('automation-workflow@system');

      // Verify notifications were called
      expect(notifyGuestOfApprovalSpy).toHaveBeenCalledWith(guestId);
      expect(sendAdminApprovalNotificationSpy).toHaveBeenCalledWith(guestId);
    }, 60000);
  });

  describe('Deny routing', () => {
    it('should deny a PENDING guest via processWorkflowAction without notification when env var is false', async () => {
      const runId = makeRunId();

      // Save original env var
      const originalEnvVar = process.env.NOTIFICATION_NOTIFY_ADMIN_ON_DENIAL;
      
      // Explicitly set env var to false for this test
      process.env.NOTIFICATION_NOTIFY_ADMIN_ON_DENIAL = 'false';

      try {
        // Create a guest in PENDING status
        const { guestId, textRefId } = await createGuestForWorkflow({
          runId,
          status: GuestStatus.PENDING
        });
        createdGuestIds.push(guestId);

        // Create notification spies
        const notifyGuestOfApprovalSpy = vi.fn(notifyGuestOfApproval);
        const sendAdminDenialNotificationSpy = vi.fn(sendAdminDenialNotification);

        // Process deny action
        const result = await processWorkflowAction('deny', String(textRefId), {
          approvalNotificationFn: notifyGuestOfApprovalSpy,
          adminDenialNotificationFn: sendAdminDenialNotificationSpy
        });

        // Assert the action succeeded
        expect(result.success).toBe(true);
        expect(result.message).toContain('denied');

        // Verify the database was updated to DENIED
        const supabase = await getSupabaseServiceClient();
        const { data: guest, error } = await supabase
          .from('guests')
          .select('status, denied_by')
          .eq('id', guestId)
          .single();

        expect(error).toBeNull();
        expect(guest).toBeDefined();
        expect(guest!.status).toBe(GuestStatus.DENIED);
        expect(guest!.denied_by).toBe('automation-workflow@system');

        // Verify admin denial notification was NOT called (env var is false)
        expect(sendAdminDenialNotificationSpy).not.toHaveBeenCalled();
        expect(notifyGuestOfApprovalSpy).not.toHaveBeenCalled();
      } finally {
        // Restore original env var
        if (originalEnvVar === undefined) {
          delete process.env.NOTIFICATION_NOTIFY_ADMIN_ON_DENIAL;
        } else {
          process.env.NOTIFICATION_NOTIFY_ADMIN_ON_DENIAL = originalEnvVar;
        }
      }
    }, 60000);

    it('should deny a PENDING guest and send admin notification when env var is true', async () => {
      const runId = makeRunId();

      // Save original env var
      const originalEnvVar = process.env.NOTIFICATION_NOTIFY_ADMIN_ON_DENIAL;
      
      // Explicitly set env var to true for this test
      process.env.NOTIFICATION_NOTIFY_ADMIN_ON_DENIAL = 'true';

      try {
        // Create a guest in PENDING status
        const { guestId, textRefId } = await createGuestForWorkflow({
          runId,
          status: GuestStatus.PENDING
        });
        createdGuestIds.push(guestId);

        // Create notification spies
        const notifyGuestOfApprovalSpy = vi.fn(notifyGuestOfApproval);
        const sendAdminDenialNotificationSpy = vi.fn(sendAdminDenialNotification);

        // Process deny action
        const result = await processWorkflowAction('deny', String(textRefId), {
          approvalNotificationFn: notifyGuestOfApprovalSpy,
          adminDenialNotificationFn: sendAdminDenialNotificationSpy
        });

        // Assert the action succeeded
        expect(result.success).toBe(true);
        expect(result.message).toContain('denied');

        // Verify the database was updated to DENIED
        const supabase = await getSupabaseServiceClient();
        const { data: guest, error } = await supabase
          .from('guests')
          .select('status, denied_by')
          .eq('id', guestId)
          .single();

        expect(error).toBeNull();
        expect(guest).toBeDefined();
        expect(guest!.status).toBe(GuestStatus.DENIED);
        expect(guest!.denied_by).toBe('automation-workflow@system');

        // Verify admin denial notification WAS called
        expect(sendAdminDenialNotificationSpy).toHaveBeenCalledWith(guestId);
        expect(sendAdminDenialNotificationSpy).toHaveBeenCalledTimes(1);
        expect(notifyGuestOfApprovalSpy).not.toHaveBeenCalled();
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

  describe('Error handling', () => {
    it('should reject invalid action type', async () => {
      // Create notification spies
      const notifyGuestOfApprovalSpy = vi.fn(notifyGuestOfApproval);
      const sendAdminApprovalNotificationSpy = vi.fn(sendAdminApprovalNotification);

      const result = await processWorkflowAction('invalid' as any, '123456789', {
        approvalNotificationFn: notifyGuestOfApprovalSpy,
        adminApprovalNotificationFn: sendAdminApprovalNotificationSpy
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid action');

      // Verify no notifications were called on error
      expect(notifyGuestOfApprovalSpy).not.toHaveBeenCalled();
      expect(sendAdminApprovalNotificationSpy).not.toHaveBeenCalled();
    }, 60000);

    it('should reject invalid reference ID format', async () => {
      // Create notification spies
      const notifyGuestOfApprovalSpy = vi.fn(notifyGuestOfApproval);
      const sendAdminApprovalNotificationSpy = vi.fn(sendAdminApprovalNotification);

      const result = await processWorkflowAction('approve', 'not-a-number', {
        approvalNotificationFn: notifyGuestOfApprovalSpy,
        adminApprovalNotificationFn: sendAdminApprovalNotificationSpy
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid reference ID format');

      // Verify no notifications were called on error
      expect(notifyGuestOfApprovalSpy).not.toHaveBeenCalled();
      expect(sendAdminApprovalNotificationSpy).not.toHaveBeenCalled();
    }, 60000);

    it('should reject non-existent reference ID', async () => {
      // Create notification spies
      const notifyGuestOfApprovalSpy = vi.fn(notifyGuestOfApproval);
      const sendAdminApprovalNotificationSpy = vi.fn(sendAdminApprovalNotification);

      const result = await processWorkflowAction('approve', '999999999', {
        approvalNotificationFn: notifyGuestOfApprovalSpy,
        adminApprovalNotificationFn: sendAdminApprovalNotificationSpy
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Guest not found');

      // Verify no notifications were called on error
      expect(notifyGuestOfApprovalSpy).not.toHaveBeenCalled();
      expect(sendAdminApprovalNotificationSpy).not.toHaveBeenCalled();
    }, 60000);

    it('should reject action on APPROVED guest', async () => {
      const runId = makeRunId();

      // Create a guest in APPROVED status
      const { guestId, textRefId } = await createGuestForWorkflow({
        runId,
        status: GuestStatus.APPROVED
      });
      createdGuestIds.push(guestId);

      // Create notification spies
      const notifyGuestOfApprovalSpy = vi.fn(notifyGuestOfApproval);
      const sendAdminApprovalNotificationSpy = vi.fn(sendAdminApprovalNotification);

      // Try to approve again
      const result = await processWorkflowAction('approve', String(textRefId), {
        approvalNotificationFn: notifyGuestOfApprovalSpy,
        adminApprovalNotificationFn: sendAdminApprovalNotificationSpy
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('not in a valid status');

      // Verify no notifications were called on error
      expect(notifyGuestOfApprovalSpy).not.toHaveBeenCalled();
      expect(sendAdminApprovalNotificationSpy).not.toHaveBeenCalled();
    }, 60000);
  });
});

