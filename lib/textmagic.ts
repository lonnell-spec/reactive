'use server'

import { generateMockId, generateMockMessageId } from './id-utils';

interface TextMagicSendParams {
  phone: string;
  message: string;
  from?: string;
}

/**
 * Formats a phone number to E.164 format
 * Pure function for testability
 * 
 * @param phone The phone number to format
 * @param countryCode The country code to prepend (default: '+1')
 * @returns Formatted phone number in E.164 format
 */
export async function formatPhoneToE164(
  phone: string,
  countryCode: string = '+1'
): Promise<string> {
  if (!phone) {
    throw new Error('Phone number is required');
  }

  // If already has country code, return as-is
  if (phone.startsWith('+')) {
    return phone;
  }

  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '');

  if (digitsOnly.length === 0) {
    throw new Error('Phone number must contain digits');
  }

  return `${countryCode}${digitsOnly}`;
}

export async function sendTextMagicSMS({ phone, message, from }: TextMagicSendParams) {
  try {
    // Check if we're in development mode
    if (process.env.TEXTMAGIC_SEND_LIVE === 'true') {
      // Production mode - continue with actual TextMagic API call
      const username = process.env.TEXTMAGIC_USERNAME;
      const apiKey = process.env.TEXTMAGIC_API_KEY;
      const textMagicUrl = process.env.TEXTMAGIC_URL + '/messages';

      if (!username || !apiKey || !textMagicUrl) {
        throw new Error('TextMagic credentials not configured');
      }

      // Format phone number to E.164 format
      const formattedPhone = await formatPhoneToE164(phone);

      const response = await fetch(textMagicUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-TM-Username': username,
          'X-TM-Key': apiKey,
        },
        body: JSON.stringify({
          phones: formattedPhone,
          text: message,
          from: from || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`TextMagic API error: ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      return { success: true, data };
    }
    else {
      console.log('Sending TextMagic SMS in development mode');
      // In development, just log the message and return success
      console.log('\n========== TEXTMAGIC SMS (DEV MODE) ==========');
      console.log(`To: ${phone}`);
      if (from) console.log(`From: ${from}`);
      console.log('Message:');
      console.log(message);
      console.log('==============================================\n');

      // Return mock success response using pure utility functions
      return {
        success: true,
        data: {
          id: await generateMockId('dev'),
          sessionId: 'dev-session',
          bulkId: 'dev-bulk',
          messageId: await generateMockMessageId(),
          href: '/api/v2/messages/dev'
        }
      };
    }
  } catch (error) {
    console.error('Error sending SMS:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
