'use server'

import { generateMockId, generateMockMessageId } from './id-utils';

interface TextMagicSendParams {
  phone: string;
  message: string;
  from?: string;
  externalGuestId?: string;
}

interface TextMagicEmailParams {
  email: string;
  message: string;
  subject?: string;
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

/**
 * Validates an email address format
 * Pure function for testability
 * 
 * @param email The email address to validate
 * @returns The validated email address
 */
export async function validateEmailFormat(email: string): Promise<string> {
  if (!email) {
    throw new Error('Email address is required');
  }

  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    throw new Error('Invalid email address format');
  }

  return email.toLowerCase().trim();
}

export async function sendTextMagicSMS({ phone, message, from, externalGuestId }: TextMagicSendParams) {
  try {
    // Check if we're in development mode
    if (process.env.SEND_TEXT_MESSAGES?.toLowerCase() === 'true') {
      // Production mode - continue with actual TextMagic API call
      const username = process.env.TEXTMAGIC_USERNAME;
      const apiKey = process.env.TEXTMAGIC_API_KEY;
      const textMagicUrl = process.env.TEXTMAGIC_URL + '/messages';

      if (!username || !apiKey || !textMagicUrl) {
        throw new Error('TextMagic credentials not configured');
      }

      // Format phone number to E.164 format
      const formattedPhone = await formatPhoneToE164(phone);

      const payload = {
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
          referenceId: externalGuestId || undefined,
        }),
      }
      console.log('Sending SMS to TextMagic:', payload);
      const response = await fetch(textMagicUrl, payload);

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

export async function sendTextMagicEmail({ email, message, subject, from }: TextMagicEmailParams) {
  try {
    // Check if we're in production mode
    if (process.env.SEND_EMAILS?.toLowerCase() === 'true') {
      // Production mode - continue with actual TextMagic API call
      const username = process.env.TEXTMAGIC_USERNAME;
      const apiKey = process.env.TEXTMAGIC_API_KEY;
      const textMagicUrl = process.env.TEXTMAGIC_URL + '/email';

      if (!username || !apiKey || !textMagicUrl) {
        throw new Error('TextMagic credentials not configured');
      }

      // Validate email format
      const validatedEmail = await validateEmailFormat(email);

      const response = await fetch(textMagicUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-TM-Username': username,
          'X-TM-Key': apiKey,
        },
        body: JSON.stringify({
          to: validatedEmail,
          subject: subject || 'Church Guest Registration Notification',
          text: message,
          from: from || process.env.TEXTMAGIC_EMAIL_FROM || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`TextMagic Email API error: ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      return { success: true, data };
    }
    else {
      console.log('Sending TextMagic Email in development mode');
      // In development, just log the email and return success
      console.log('\n========== TEXTMAGIC EMAIL (DEV MODE) ==========');
      console.log(`To: ${email}`);
      console.log(`Subject: ${subject || 'Church Guest Registration Notification'}`);
      if (from) console.log(`From: ${from}`);
      console.log('Message:');
      console.log(message);
      console.log('===============================================\n');

      // Return mock success response using pure utility functions
      return {
        success: true,
        data: {
          id: await generateMockId('dev-email'),
          sessionId: 'dev-email-session',
          bulkId: 'dev-email-bulk',
          messageId: await generateMockMessageId(),
          href: '/api/v2/email/dev'
        }
      };
    }
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
