'use server'

import { getSupabaseServiceClient } from './supabase-client';

/**
 * Retrieves guest credentials (QR code, code word, etc.) for display
 * Uses the service role to ensure access regardless of authentication status
 * Uses the pass_id field for secure access (only available after approval)
 */
export async function getGuestCredentials(passId: string) {
  try {
    const supabaseServiceClient = await getSupabaseServiceClient();
    
    // Find the guest by pass_id
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
        expires_at,
        status,
        is_used
      `)
      .eq('pass_id', passId)
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

    if (guest.is_used) {
      return {
        success: false,
        message: 'Your guest pass has already been used'
      };
    }
    
    // Check if QR code has expired
    const now = new Date();
    const expiryDate = new Date(guest.expires_at);
    
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
        qrExpiry: guest.expires_at
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
 * Generates a QR code that encodes the code word for guest check-in
 * 
 * @param codeWord The code word to encode in the QR code
 * @returns Promise<string> The QR code as a data URL (base64 encoded PNG)
 */
export async function generateQRCode(codeWord: string): Promise<string> {
  if (!codeWord || typeof codeWord !== 'string') {
    throw new Error('Code word is required and must be a string');
  }
  
  try {
    const QRCode = await import('qrcode');
    
    // Generate QR code as data URL (base64 encoded PNG)
    const qrCodeDataUrl = await QRCode.toDataURL(codeWord, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    return qrCodeDataUrl;
  } catch (error) {
    throw new Error(`Failed to generate QR code: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Word lists for code generation
const SAFE_COLORS = ["Blue", "Red", "Green", "White", "Gold", "Silver"] as const;

const SAFE_NOUNS = ["Cloud", "Star", "Tree", "Rock", "Path", "Ocean"] as const;

/**
 * Generates a random code word for guest check-in
 * Pure function with dependency injection for testability
 * 
 * @param colors Array of adjectives to choose from
 * @param nouns Array of nouns to choose from  
 * @param randomFn Function that returns a random number between 0 and 1
 * @returns A code word in format "AdjectiveNoun"
 */
export async function generateCodeWord(
  colors: readonly string[] = SAFE_COLORS,
  nouns: readonly string[] = SAFE_NOUNS,
  randomFn: () => number = Math.random
): Promise<string> {
  if (colors.length === 0 || nouns.length === 0) {
    throw new Error('Word lists cannot be empty');
  }

  const randomColor = colors[Math.floor(randomFn() * colors.length)];
  const randomNoun = nouns[Math.floor(randomFn() * nouns.length)];
  const randomDigits = Math.floor(randomFn() * 9000 + 1000).toString();

  return `${randomColor}${randomNoun}${randomDigits}`;
}


export async function generatePassId() {
  const supabaseServiceClient = await getSupabaseServiceClient();
  const { data } = await supabaseServiceClient.rpc('gen_random_uuid');
  return data || crypto.randomUUID();
}

/**
 * Generates a unique code word by checking database for collisions
 * Uses retry logic to handle the rare case of collisions
 * 
 * @param supabaseClient Supabase client for database queries
 * @param maxRetries Maximum number of retry attempts (default: 10)
 * @param adjectives Word list for adjectives (for testing)
 * @param nouns Word list for nouns (for testing)
 * @param randomFn Random function (for testing)
 * @returns Promise<string> Unique code word
 */
export async function generateUniqueCodeWord(
  supabaseClient: any,
  maxRetries: number = 10,
  colors: readonly string[] = SAFE_COLORS,
  nouns: readonly string[] = SAFE_NOUNS,
  randomFn: () => number = Math.random
): Promise<string> {
  if (!supabaseClient) {
    throw new Error('Supabase client is required');
  }
  
  if (maxRetries <= 0) {
    throw new Error('Max retries must be positive');
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    // Generate a code word using the existing pure function
    const codeWord = await generateCodeWord(colors, nouns, randomFn);
    
    // Check if this code word already exists
    const { data: existingGuest, error } = await supabaseClient
      .from('guests')
      .select('id')
      .eq('code_word', codeWord)
      .maybeSingle();
    
    if (error) {
      throw new Error(`Database error checking code word uniqueness: ${error.message}`);
    }
    
    // If no existing guest found, this code word is unique
    if (!existingGuest) {
      return codeWord;
    }
    
    // If we've reached max retries, throw an error
    if (attempt === maxRetries) {
      throw new Error(`Failed to generate unique code word after ${maxRetries} attempts`);
    }
    
    // Continue to next attempt
  }
  
  // This should never be reached, but TypeScript requires it
  throw new Error('Unexpected error in code word generation');
}

/**
 * Generates a URL for the pass view page
 * 
 * @param passId The pass ID to generate a URL for
 * @returns Promise<string> The URL for the pass view page
 */
export async function generatePassViewUrl(passId: string) {
  return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}/pass/view/${passId}`;
}

/**
 * Generates a URL for the admin page to deep link to a guest detail
 * 
 * @param external_guest_id The external guest ID to generate a URL for
 * @returns Promise<string> The URL for the admin page deep link to a guest detail
 */
export async function generateDeepLinkUrl(external_guest_id: string) {
  return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}/admin/${external_guest_id}`;
}

/**
 * Generates a URL for the admin page to deep link to a guest verification page
 * 
 * @param passId The pass ID to generate a URL for
 * @returns Promise<string> The URL for the admin page deep link to a guest verification
 */
export async function generatePassVerificationUrl(passId: string) {
  return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}/admin/verification/${passId}`;
}

/**
 * Generates a URL for the automation workflow approval action
 * 
 * @param textCallbackReferenceId The text callback reference ID to generate a URL for
 * @returns Promise<string> The URL for the automation workflow approval action
 */
export async function generateApprovalUrl(textCallbackReferenceId: number) {
  return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}/automation/workflow?action=approve&textrefid=${textCallbackReferenceId.toString()}`;
}

/**
 * Generates a URL for the automation workflow denial action
 * 
 * @param textCallbackReferenceId The text callback reference ID to generate a URL for
 * @returns Promise<string> The URL for the automation workflow denial action
 */
export async function generateDenialUrl(textCallbackReferenceId: number) {
  return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}/automation/workflow?action=deny&textrefid=${textCallbackReferenceId.toString()}`;
}
