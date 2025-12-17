import { vi, beforeAll, afterAll } from 'vitest';

// Mock Next.js modules that aren't available in test environment
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn()
}));

// Node 18+ has native FormData and File support - no polyfill needed

// Mock environment variables for tests (only if not already set)
if (!process.env.SUPABASE_URL) {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
}
if (!process.env.SUPABASE_ANON_KEY) {
  process.env.SUPABASE_ANON_KEY = 'test-anon-key';
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
}
if (!process.env.ADMIN_REGISTRATION_CODE) {
  process.env.ADMIN_REGISTRATION_CODE = 'TEST_ADMIN_CODE';
}
if (!process.env.REGISTRATION_CODE) {
  process.env.REGISTRATION_CODE = 'TEST_GENERAL_CODE';
}

// Console error/warn suppression for cleaner test output
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' && 
      (args[0].includes('Warning:') || args[0].includes('validateDOMNesting'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
  
  console.warn = (...args: any[]) => {
    if (typeof args[0] === 'string' && args[0].includes('componentWillReceiveProps')) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

