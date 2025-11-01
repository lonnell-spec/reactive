'use server'

import { getSupabaseServiceClient } from './supabase-client';

/**
 * Retrieves guest credentials (QR code, code word, etc.) for display
 * Uses the service role to ensure access regardless of authentication status
 * Uses the credential_id field for secure access
 */
export async function getGuestCredentials(credentialId: string) {
  try {
    const supabaseServiceClient = await getSupabaseServiceClient();
    
    // Find the guest by credential_id
    const { data: guest, error: fetchError } = await supabaseServiceClient
      .from('guests')
      .select(`
        id,
        first_name,
        last_name,
        email,
        phone,
        visit_date,
        gathering_time,
        total_guests,
        qr_code,
        code_word,
        qr_expiry,
        status
      `)
      .eq('credential_id', credentialId)
      .single();
    
    if (fetchError) {
      throw new Error('Failed to retrieve guest information');
    }
    
    if (!guest) {
      return {
        success: false,
        message: 'Guest credentials not found or invalid'
      };
    }
    
    // Check if QR code has expired
    const now = new Date();
    const expiryDate = new Date(guest.qr_expiry);
    
    if (now > expiryDate) {
      return {
        success: false,
        message: 'Your guest pass has expired'
      };
    }
    
    return {
      success: true,
      data: {
        id: guest.id,
        firstName: guest.first_name,
        lastName: guest.last_name,
        email: guest.email,
        phone: guest.phone,
        visitDate: guest.visit_date,
        gatheringTime: guest.gathering_time,
        totalGuests: guest.total_guests,
        qrCode: guest.qr_code,
        codeWord: guest.code_word,
        qrExpiry: guest.qr_expiry
      }
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to retrieve guest credentials'
    };
  }
}

/**
 * Generates a QR code for guest check-in
 */
export async function generateQRCode(credentialId: string): Promise<string> {
  try {
    // Use the QR Code API to generate a QR code
    const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
      `${process.env.APP_URL}/guest/verify?id=${credentialId}`
    )}&format=svg`;
    
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error('Failed to generate QR code');
    }
    
    // Get the SVG content
    const svgContent = await response.text();
    return svgContent;
  } catch (error) {
    throw new Error('Failed to generate QR code for guest');
  }
}

// Word lists for code generation
const ADJECTIVES = [
  'Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Orange', 'Pink', 'Brown', 'Gray', 'Black',
  'White', 'Silver', 'Gold', 'Bright', 'Dark', 'Light', 'Shiny', 'Dull', 'Vivid', 'Pale'
] as const;

const NOUNS = [
  'Lion', 'Tiger', 'Bear', 'Eagle', 'Dolphin', 'Whale', 'Elephant', 'Giraffe', 'Zebra', 'Monkey',
  'Horse', 'Dog', 'Cat', 'Bird', 'Fish', 'Turtle', 'Rabbit', 'Fox', 'Wolf', 'Deer'
] as const;

/**
 * Generates a random code word for guest check-in
 * Pure function with dependency injection for testability
 * 
 * @param adjectives Array of adjectives to choose from
 * @param nouns Array of nouns to choose from  
 * @param randomFn Function that returns a random number between 0 and 1
 * @returns A code word in format "AdjectiveNoun"
 */
export async function generateCodeWord(
  adjectives: readonly string[] = ADJECTIVES,
  nouns: readonly string[] = NOUNS,
  randomFn: () => number = Math.random
): Promise<string> {
  if (adjectives.length === 0 || nouns.length === 0) {
    throw new Error('Word lists cannot be empty');
  }

  const randomAdjective = adjectives[Math.floor(randomFn() * adjectives.length)];
  const randomNoun = nouns[Math.floor(randomFn() * nouns.length)];

  return `${randomAdjective}${randomNoun}`;
}


export async function generateCredentialId() {
  const supabaseServiceClient = await getSupabaseServiceClient();
  const { data } = await supabaseServiceClient.rpc('gen_random_uuid');
  return data || crypto.randomUUID();
}