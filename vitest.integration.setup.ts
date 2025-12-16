import { beforeAll, vi } from 'vitest';
import { config } from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
// Vitest doesn't auto-load .env files like Next.js does
config({ path: path.resolve(process.cwd(), '.env.local') });

// Node 18+ has native FormData and File support - no polyfill needed

// Mock Next.js modules that aren't available in test environment
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn()
}));

beforeAll(() => {
  // Validate required environment variables for integration tests
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables for integration tests: ${missingVars.join(', ')}\n` +
      'Please set these in your .env.local file or environment.'
    );
  }

  // Force safe notification defaults to prevent accidental external communication
  process.env.SEND_TEXT_MESSAGES = 'false';
  process.env.SEND_EMAILS = 'false';
  process.env.NOTIFICATION_USE_ACTUAL_PHONE_NUMBERS = 'false';
  process.env.NOTIFICATION_USE_ACTUAL_EMAIL_ADDRESSES = 'false';
  
  // Provide test phone numbers to satisfy code paths
  if (!process.env.NOTIFICATION_TEST_PHONE_NUMBERS) {
    process.env.NOTIFICATION_TEST_PHONE_NUMBERS = '+15555550100,+15555550101';
  }
  
  console.log('✓ Integration test environment validated');
  console.log('✓ Notifications disabled for safety');
  console.log(`✓ Testing against: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
});

