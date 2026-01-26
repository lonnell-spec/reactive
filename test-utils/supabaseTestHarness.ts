/**
 * Test harness utilities for integration tests with remote Supabase
 * Provides unique ID generation and cleanup functions for safe shared-instance testing
 */

import { getSupabaseServiceClient } from '../lib/supabase-client';
import { rollbackGuestSubmission } from '../lib/rollback';
import { GuestStatus } from '../lib/types';
import crypto from 'crypto';

/**
 * Generates a unique run ID for this test execution
 * Format: timestamp-uuid (e.g., "1702123456789-abc123...")
 */
export function makeRunId(): string {
  const timestamp = Date.now();
  const uuid = crypto.randomUUID().slice(0, 8);
  return `${timestamp}-${uuid}`;
}

/**
 * Creates a unique suffix for test data using the run ID
 */
export function makeUniqueSuffix(runId: string): string {
  return `vitest-${runId}`;
}

/**
 * Creates a FormData object with unique guest data for testing
 * All fields are pre-filled with test data and uniquely identified by runId
 * Matches the Next.js Server Action format where text data is in a JSON 'formData' field
 */
export async function createGuestFormData(options: {
  runId: string;
  includeChildren?: boolean;
  additionalFields?: Record<string, string>;
}): Promise<FormData> {
  const { runId, includeChildren = false, additionalFields = {} } = options;
  const suffix = makeUniqueSuffix(runId);
  
  // Use global FormData (should be native in Node 18+)
  const formData = new globalThis.FormData();
  
  // Create JSON data object (this is how Next.js Server Actions send form data)
  const jsonData = {
    firstName: 'TestGuest',
    lastName: suffix,
    email: `guest+${suffix}@vitest.example.com`,
    phone: `5555${String(Date.now()).slice(-6)}`, // Unique 10-digit phone
    visitDate: '2025-12-31',
    gatheringTime: '10:00 AM',
    totalGuests: '2',
    carType: 'Sedan',
    vehicleColor: 'Blue',
    vehicleMake: 'Toyota',
    vehicleModel: 'Camry',
    foodAllergies: 'None',
    specialNeeds: 'None',
    additionalNotes: `Integration test: ${suffix}`,
    hasChildrenForFormationKids: includeChildren,
    childrenInfo: includeChildren ? [
      {
        name: `TestChild-${suffix}`,
        dob: '2015-01-01',
        allergies: 'None'
      }
    ] : [],
    ...additionalFields
  };
  
  // Serialize to JSON and add as 'formData' field (Next.js Server Action format)
  formData.append('formData', JSON.stringify(jsonData));
  
  // Create a small test image file (1x1 pixel PNG)
  const pngBuffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );
  const profilePicture = new File([pngBuffer], `test-${suffix}.png`, { type: 'image/png' });
  formData.append('profilePicture', profilePicture);
  
  // If there are children with photos, add them
  if (includeChildren) {
    const childPhoto = new File([pngBuffer], `child-${suffix}.png`, { type: 'image/png' });
    formData.append('childPhoto_0', childPhoto);
  }
  
  return formData;
}

/**
 * Cleans up all artifacts created for a specific guest
 * - Queries for guest and children records
 * - Collects all storage file paths
 * - Uses rollbackGuestSubmission to delete everything
 */
export async function cleanupGuestArtifacts(guestId: string): Promise<void> {
  try {
    const supabaseService = await getSupabaseServiceClient();
    
    // Query the guest to get profile photo path
    const { data: guest } = await supabaseService
      .from('guests')
      .select('photo_path')
      .eq('id', guestId)
      .single();
    
    // Query children to get their IDs and photo paths
    const { data: children } = await supabaseService
      .from('guest_children')
      .select('id, photo_path')
      .eq('guest_id', guestId);
    
    // Build cleanup object
    const cleanup = {
      guestId: guestId,
      childrenIds: children?.map(c => c.id) || [],
      uploadedFiles: [
        guest?.photo_path,
        ...(children?.map(c => c.photo_path).filter(Boolean) || [])
      ].filter(Boolean) as string[]
    };
    
    // Use the existing rollback function to clean up
    await rollbackGuestSubmission(cleanup, supabaseService);
    
    console.log(`✓ Cleaned up guest ${guestId} and related artifacts`);
  } catch (error) {
    console.error(`Failed to cleanup guest ${guestId}:`, error);
    // Don't throw - cleanup failures shouldn't fail tests
  }
}

/**
 * Directly inserts an approved guest record for testing pass verification
 * Returns the guest ID and pass_id for testing
 */
export async function createApprovedGuest(options: {
  runId: string;
  expiresInFuture?: boolean;
  isUsed?: boolean;
}): Promise<{ guestId: string; passId: string; externalGuestId: string, codeWord: string, phone: string }> {
  const { runId, expiresInFuture = true, isUsed = false } = options;
  const suffix = makeUniqueSuffix(runId);
  const supabaseService = await getSupabaseServiceClient();
  
  // Calculate expiry date
  const expiresAt = new Date();
  if (expiresInFuture) {
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days in future
  } else {
    expiresAt.setDate(expiresAt.getDate() - 7); // 7 days in past
  }
  
  const passId = crypto.randomUUID(); // pass_id is a UUID in the database
  const externalGuestId = crypto.randomUUID();
  const phone = `5555${String(Date.now()).slice(-6)}`;
  
  // Insert guest directly
  const { data: guest, error } = await supabaseService
    .from('guests')
    .insert({
      external_guest_id: externalGuestId,
      first_name: 'TestGuest',
      last_name: suffix,
      email: `guest+${suffix}@vitest.example.com`,
      phone: phone,
      visit_date: '2025-12-31',
      gathering_time: '10:00 AM',
      total_guests: '2',
      status: GuestStatus.APPROVED,
      pass_id: passId,
      code_word: `CODE-${suffix}`, // This is unique for searching
      qr_code: 'test-qr-code-data',
      expires_at: expiresAt.toISOString(),
      is_used: isUsed,
      approved_by: 'test@vitest.com',
      approved_at: new Date().toISOString(),
      additional_notes: `Integration test: ${suffix}`
    })
    .select('id, code_word') // Also return code_word for test verification
    .single();
  
  if (error || !guest) {
    throw new Error(`Failed to create approved guest: ${error?.message}`);
  }
  
  return {
    guestId: guest.id,
    passId,
    codeWord: guest.code_word, // Return the code_word so tests can use it for searching
    phone: phone, // Return phone for phone search tests
    externalGuestId
  };
}

/**
 * Generates a unique 9-digit integer for text_callback_reference_id
 * Checks database for collisions
 */
async function generateUniqueTextRefId(): Promise<number> {
  const supabaseService = await getSupabaseServiceClient();
  const maxRetries = 10;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    // Generate random 9-digit integer (100000000 to 999999999)
    const textRefId = Math.floor(Math.random() * 900000000) + 100000000;
    
    // Check if it exists
    const { data } = await supabaseService
      .from('guests')
      .select('id')
      .eq('text_callback_reference_id', textRefId)
      .maybeSingle();
    
    if (!data) {
      return textRefId;
    }
  }
  
  throw new Error('Failed to generate unique text_callback_reference_id after 10 attempts');
}

/**
 * Creates a minimal guest record for workflow/admin action testing
 * Returns the guest ID and text_callback_reference_id for testing
 */
export async function createGuestForWorkflow(options: {
  runId: string;
  status?: GuestStatus;
  textRefId?: number;
}): Promise<{ guestId: string; textRefId: number }> {
  const { runId, status = GuestStatus.PENDING, textRefId } = options;
  const suffix = makeUniqueSuffix(runId);
  const supabaseService = await getSupabaseServiceClient();
  
  // Generate or use provided text_callback_reference_id
  const uniqueTextRefId = textRefId ?? await generateUniqueTextRefId();
  
  // Insert minimal guest record
  const { data: guest, error } = await supabaseService
    .from('guests')
    .insert({
      external_guest_id: crypto.randomUUID(),
      first_name: 'TestGuest',
      last_name: suffix,
      phone: `5555${String(Date.now()).slice(-6)}`,
      email: `guest+${suffix}@vitest.example.com`,
      visit_date: '2025-12-31',
      gathering_time: '10:00 AM',
      total_guests: 2,
      status: status,
      text_callback_reference_id: uniqueTextRefId,
      additional_notes: `Integration test: ${suffix}`
    })
    .select('id')
    .single();
  
  if (error || !guest) {
    throw new Error(`Failed to create guest for workflow: ${error?.message}`);
  }
  
  return {
    guestId: guest.id,
    textRefId: uniqueTextRefId
  };
}

/**
 * Searches for orphaned test records by unique suffix pattern
 * Useful for cleanup after test failures
 */
export async function findOrphanedTestRecords(): Promise<{ guestIds: string[] }> {
  try {
    const supabaseService = await getSupabaseServiceClient();
    
    // Look for guests with "vitest-" in their additional_notes or last_name
    const { data: guests } = await supabaseService
      .from('guests')
      .select('id, last_name, additional_notes, created_at')
      .or('last_name.ilike.%vitest-%,additional_notes.ilike.%vitest-%')
      .order('created_at', { ascending: false })
      .limit(100);
    
    const guestIds = guests?.map(g => g.id) || [];
    
    if (guestIds.length > 0) {
      console.log(`Found ${guestIds.length} potential orphaned test records`);
    }
    
    return { guestIds };
  } catch (error) {
    console.error('Failed to find orphaned records:', error);
    return { guestIds: [] };
  }
}

