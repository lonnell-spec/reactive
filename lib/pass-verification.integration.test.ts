/**
 * Integration tests for pass verification
 * Tests against remote Supabase instance with unique IDs and cleanup
 */

import { describe, it, expect, afterEach } from 'vitest';
import { verifyGuestPass, searchGuestByCodeWord, searchGuestByPhone } from './pass-verification';
import { 
  makeRunId, 
  createApprovedGuest, 
  cleanupGuestArtifacts 
} from '../test-utils/supabaseTestHarness';

describe('Pass Verification - Integration Tests', () => {
  const createdGuestIds: string[] = [];
  
  afterEach(async () => {
    // Clean up all created guests
    for (const guestId of createdGuestIds) {
      await cleanupGuestArtifacts(guestId);
    }
    createdGuestIds.length = 0;
  });

  it('should verify a valid approved pass successfully', async () => {
    const runId = makeRunId();
    
    // Create an approved guest with valid pass
    const { guestId, passId } = await createApprovedGuest({
      runId,
      expiresInFuture: true,
      isUsed: false
    });
    createdGuestIds.push(guestId);
    
    // Verify the pass
    const result = await verifyGuestPass(passId);
    
    // Assert pass is valid
    expect(result.success).toBe(true);
    expect(result.message).toBe('Valid pass');
    expect(result.guest).toBeDefined();
    expect(result.guest?.id).toBe(guestId);
    expect(result.guest?.firstName).toBe('TestGuest');
    expect(result.guest?.lastName).toContain('vitest-');
    expect(result.guest?.isUsed).toBe(false);
  }, 60000);

  it('should reject an expired pass', async () => {
    const runId = makeRunId();
    
    // Create an approved guest with expired pass
    const { guestId, passId } = await createApprovedGuest({
      runId,
      expiresInFuture: false, // Expired
      isUsed: false
    });
    createdGuestIds.push(guestId);
    
    // Try to verify the expired pass
    const result = await verifyGuestPass(passId);
    
    // Assert pass is rejected as expired
    expect(result.success).toBe(false);
    expect(result.message).toContain('expired');
  }, 60000);

  it('should reject an already used pass', async () => {
    const runId = makeRunId();
    
    // Create an approved guest with used pass
    const { guestId, passId } = await createApprovedGuest({
      runId,
      expiresInFuture: true,
      isUsed: true // Already used
    });
    createdGuestIds.push(guestId);
    
    // Try to verify the used pass
    const result = await verifyGuestPass(passId);
    
    // Assert pass is rejected as already used
    expect(result.success).toBe(false);
    expect(result.message).toContain('already been used');
  }, 60000);

  it('should reject an invalid pass ID', async () => {
    const fakePassId = 'pass-does-not-exist-12345';
    
    // Try to verify non-existent pass
    const result = await verifyGuestPass(fakePassId);
    
    // Assert pass is rejected
    expect(result.success).toBe(false);
    expect(result.message).toContain('Invalid pass ID');
  }, 60000);

  it('should search guest by code word successfully', async () => {
    const runId = makeRunId();
    
    // Create an approved guest
    const { guestId, codeWord } = await createApprovedGuest({
      runId,
      expiresInFuture: true,
      isUsed: false
    });
    createdGuestIds.push(guestId);
    
    expect(codeWord).toBeDefined();
    
    // Search by code word
    const result = await searchGuestByCodeWord(codeWord);
    
    // Assert search succeeded
    expect(result.success).toBe(true);
    expect(result.message).toContain('Valid pass found');
    expect(result.guest?.id).toBe(guestId);
  }, 60000);

  it('should search guest by phone number successfully', async () => {
    const runId = makeRunId();
    
    // Create an approved guest
    const { guestId, phone } = await createApprovedGuest({
      runId,
      expiresInFuture: true,
      isUsed: false
    });
    createdGuestIds.push(guestId);
    
    expect(phone).toBeDefined();
    
    // Search by phone
    const result = await searchGuestByPhone(phone);
    
    // Assert search succeeded
    expect(result.success).toBe(true);
    expect(result.message).toContain('Valid pass found');
    expect(result.guest?.id).toBe(guestId);
  }, 60000);
});

