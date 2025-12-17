/**
 * Integration tests for workflow actions
 * Tests SMS callback routing and state transitions against remote Supabase
 */

import { describe, it, expect, afterEach } from 'vitest';
import { processWorkflowAction } from './workflow-actions';
import { getSupabaseServiceClient } from './supabase-client';
import { GuestStatus } from './types';
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
    it('should pre-approve a PENDING_PRE_APPROVAL guest via processWorkflowAction', async () => {
      const runId = makeRunId();

      // Create a guest in PENDING_PRE_APPROVAL status
      const { guestId, textRefId } = await createGuestForWorkflow({
        runId,
        status: GuestStatus.PENDING_PRE_APPROVAL
      });
      createdGuestIds.push(guestId);

      // Process approve action using text reference ID
      const result = await processWorkflowAction('approve', String(textRefId));

      // Assert the action succeeded
      expect(result.success).toBe(true);
      expect(result.message).toContain('approved');

      // Verify the database was updated to PENDING
      const supabase = await getSupabaseServiceClient();
      const { data: guest, error } = await supabase
        .from('guests')
        .select('status, pre_approved_by')
        .eq('id', guestId)
        .single();

      expect(error).toBeNull();
      expect(guest).toBeDefined();
      expect(guest!.status).toBe(GuestStatus.PENDING);
      expect(guest!.pre_approved_by).toBe('automation-workflow@system');
    }, 60000);

    it('should final-approve a PENDING guest via processWorkflowAction', async () => {
      const runId = makeRunId();

      // Create a guest in PENDING status (already pre-approved)
      const { guestId, textRefId } = await createGuestForWorkflow({
        runId,
        status: GuestStatus.PENDING
      });
      createdGuestIds.push(guestId);

      // Process approve action
      const result = await processWorkflowAction('approve', String(textRefId));

      // Assert the action succeeded
      expect(result.success).toBe(true);

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
    }, 60000);

    it('should walk through full approve workflow: PENDING_PRE_APPROVAL → PENDING → APPROVED', async () => {
      const runId = makeRunId();

      // Create a guest in initial status
      const { guestId, textRefId } = await createGuestForWorkflow({
        runId,
        status: GuestStatus.PENDING_PRE_APPROVAL
      });
      createdGuestIds.push(guestId);
      const supabase = await getSupabaseServiceClient();

      // Step 1: First approve (pre-approval)
      const result1 = await processWorkflowAction('approve', String(textRefId));
      expect(result1.success).toBe(true);

      const { data: guest1 } = await supabase
        .from('guests')
        .select('status')
        .eq('id', guestId)
        .single();
      expect(guest1!.status).toBe(GuestStatus.PENDING);

      // Step 2: Second approve (final approval)
      const result2 = await processWorkflowAction('approve', String(textRefId));
      expect(result2.success).toBe(true);

      const { data: guest2 } = await supabase
        .from('guests')
        .select('status, pass_id, code_word')
        .eq('id', guestId)
        .single();
      expect(guest2!.status).toBe(GuestStatus.APPROVED);
      expect(guest2!.pass_id).toBeDefined();
      expect(guest2!.code_word).toBeDefined();
    }, 60000);
  });

  describe('Deny routing', () => {
    it('should deny pre-approval for PENDING_PRE_APPROVAL guest via processWorkflowAction', async () => {
      const runId = makeRunId();

      // Create a guest in PENDING_PRE_APPROVAL status
      const { guestId, textRefId } = await createGuestForWorkflow({
        runId,
        status: GuestStatus.PENDING_PRE_APPROVAL
      });
      createdGuestIds.push(guestId);

      // Process deny action
      const result = await processWorkflowAction('deny', String(textRefId));

      // Assert the action succeeded
      expect(result.success).toBe(true);
      expect(result.message).toContain('denied');

      // Verify the database was updated to PRE_APPROVAL_DENIED
      const supabase = await getSupabaseServiceClient();
      const { data: guest, error } = await supabase
        .from('guests')
        .select('status, pre_approval_denied_by')
        .eq('id', guestId)
        .single();

      expect(error).toBeNull();
      expect(guest).toBeDefined();
      expect(guest!.status).toBe(GuestStatus.PRE_APPROVAL_DENIED);
      expect(guest!.pre_approval_denied_by).toBe('automation-workflow@system');
    }, 60000);

    it('should deny final approval for PENDING guest via processWorkflowAction', async () => {
      const runId = makeRunId();

      // Create a guest in PENDING status
      const { guestId, textRefId } = await createGuestForWorkflow({
        runId,
        status: GuestStatus.PENDING
      });
      createdGuestIds.push(guestId);

      // Process deny action
      const result = await processWorkflowAction('deny', String(textRefId));

      // Assert the action succeeded
      expect(result.success).toBe(true);

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
    }, 60000);
  });

  describe('Error handling', () => {
    it('should reject invalid action type', async () => {
      const result = await processWorkflowAction('invalid' as any, '123456789');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid action');
    }, 60000);

    it('should reject invalid reference ID format', async () => {
      const result = await processWorkflowAction('approve', 'not-a-number');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid reference ID format');
    }, 60000);

    it('should reject non-existent reference ID', async () => {
      const result = await processWorkflowAction('approve', '999999999');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Guest not found');
    }, 60000);

    it('should reject action on APPROVED guest', async () => {
      const runId = makeRunId();

      // Create a guest in APPROVED status
      const { guestId, textRefId } = await createGuestForWorkflow({
        runId,
        status: GuestStatus.APPROVED
      });
      createdGuestIds.push(guestId);

      // Try to approve again
      const result = await processWorkflowAction('approve', String(textRefId));

      expect(result.success).toBe(false);
      expect(result.error).toContain('not in a valid status');
    }, 60000);
  });
});


