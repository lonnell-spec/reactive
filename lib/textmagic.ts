'use server'

interface TextMagicSendParams {
  phone: string;
  message: string;
  from?: string;
}

export async function sendTextMagicSMS({ phone, message, from }: TextMagicSendParams) {
  try {
    const username = process.env.TEXTMAGIC_USERNAME;
    const apiKey = process.env.TEXTMAGIC_API_KEY;
    
    if (!username || !apiKey) {
      throw new Error('TextMagic credentials not configured');
    }

    // Format phone number to E.164 format if needed
    // This is a simple example - you may need more sophisticated formatting
    const formattedPhone = phone.startsWith('+') ? phone : `+1${phone.replace(/\D/g, '')}`;
    
    const url = 'https://rest.textmagic.com/api/v2/messages';
    
    const response = await fetch(url, {
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
  } catch (error) {
    console.error('Error sending SMS:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
