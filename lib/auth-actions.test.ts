/**
 * Unit tests for core business logic functions
 * Tests critical authentication and user management logic
 */

import { 
  validateRegistrationCode, 
  validateUserCreationInputs,
  createUserCreationData
} from './auth-actions';
import { vi } from 'vitest';

// Mock the role-utils module
vi.mock('./role-utils', () => ({
  getRoleRegistrationCode: vi.fn((type: string) => {
    if (type === 'admin') return Promise.resolve('TEST_ADMIN_CODE');
    if (type === 'general') return Promise.resolve('TEST_GENERAL_CODE');
    return Promise.resolve(null);
  })
}));

// Mock the string-utils module
vi.mock('./string-utils', () => ({
  isValidEmailFormat: vi.fn((email: string) => {
    return Promise.resolve(email.includes('@') && email.includes('.'));
  })
}));

describe('Business Logic', () => {
  describe('validateRegistrationCode', () => {
    it('should validate admin registration code correctly', async () => {
      const result = await validateRegistrationCode('TEST_ADMIN_CODE');

      expect(result.isValid).toBe(true);
      expect(result.role).toBe('admin');
      expect(result.message).toContain('Admin registration code validated');
    });

    it('should validate general registration code correctly', async () => {
      const result = await validateRegistrationCode('TEST_GENERAL_CODE');

      expect(result.isValid).toBe(true);
      expect(result.role).toBe(null);
      expect(result.message).toContain('Registration code validated');
    });

    it('should reject invalid registration codes', async () => {
      const result = await validateRegistrationCode('INVALID_CODE');

      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Invalid registration code');
      expect(result.role).toBeUndefined();
    });

    it('should reject empty registration codes', async () => {
      const result = await validateRegistrationCode('');

      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Invalid registration code');
    });

    it('should handle case sensitivity', async () => {
      const result = await validateRegistrationCode('test_admin_code');

      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Invalid registration code');
    });
  });

  describe('validateUserCreationInputs', () => {
    it('should pass validation with valid inputs', async () => {
      const result = await validateUserCreationInputs(
        'test@example.com',
        'password123',
        '1234567890'
      );

      expect(result.isValid).toBe(true);
      expect(result.message).toBe('Validation passed');
    });

    it('should fail validation with invalid email', async () => {
      const result = await validateUserCreationInputs(
        'invalid-email',
        'password123',
        '1234567890'
      );

      expect(result.isValid).toBe(false);
      expect(result.message).toContain('valid email address');
    });

    it('should fail validation with empty email', async () => {
      const result = await validateUserCreationInputs(
        '',
        'password123',
        '1234567890'
      );

      expect(result.isValid).toBe(false);
      expect(result.message).toContain('valid email address');
    });

    it('should fail validation with short password', async () => {
      const result = await validateUserCreationInputs(
        'test@example.com',
        '123',
        '1234567890'
      );

      expect(result.isValid).toBe(false);
      expect(result.message).toContain('at least 6 characters');
    });

    it('should fail validation with empty password', async () => {
      const result = await validateUserCreationInputs(
        'test@example.com',
        '',
        '1234567890'
      );

      expect(result.isValid).toBe(false);
      expect(result.message).toContain('at least 6 characters');
    });

    it('should fail validation with short phone number', async () => {
      const result = await validateUserCreationInputs(
        'test@example.com',
        'password123',
        '123'
      );

      expect(result.isValid).toBe(false);
      expect(result.message).toContain('valid phone number');
    });

    it('should fail validation with empty phone number', async () => {
      const result = await validateUserCreationInputs(
        'test@example.com',
        'password123',
        ''
      );

      expect(result.isValid).toBe(false);
      expect(result.message).toContain('valid phone number');
    });

    it('should handle whitespace-only phone number', async () => {
      const result = await validateUserCreationInputs(
        'test@example.com',
        'password123',
        '   '
      );

      expect(result.isValid).toBe(false);
      expect(result.message).toContain('valid phone number');
    });
  });

  describe('createUserCreationData', () => {
    // Store original env vars
    const originalEmailConfirm = process.env.SUPABASE_EMAIL_CONFIRMATION_CONFIGURED;
    const originalPhoneConfirm = process.env.SUPABASE_PHONE_CONFIRMATION_CONFIGURED;

    afterEach(() => {
      // Restore original env vars
      process.env.SUPABASE_EMAIL_CONFIRMATION_CONFIGURED = originalEmailConfirm;
      process.env.SUPABASE_PHONE_CONFIRMATION_CONFIGURED = originalPhoneConfirm;
    });

    it('should create user data with admin role', async () => {
      const result = await createUserCreationData(
        'admin@example.com',
        'password123',
        '1234567890',
        'admin'
      );

      expect(result).toEqual({
        email: 'admin@example.com',
        password: 'password123',
        phone: '1234567890',
        email_confirm: true, // Flipped logic
        phone_confirm: true, // Flipped logic
        user_metadata: {
          phone: '1234567890',
          roles: ['admin']
        },
        app_metadata: {
          roles: ['admin']
        }
      });
    });

    it('should create user data without role', async () => {
      const result = await createUserCreationData(
        'user@example.com',
        'password123',
        '1234567890',
        null
      );

      expect(result.user_metadata.roles).toEqual([]);
      expect(result.app_metadata.roles).toEqual([]);
    });

    it('should create user data with undefined role', async () => {
      const result = await createUserCreationData(
        'user@example.com',
        'password123',
        '1234567890'
      );

      expect(result.user_metadata.roles).toEqual([]);
      expect(result.app_metadata.roles).toEqual([]);
    });

    it('should handle email confirmation configuration', async () => {
      process.env.SUPABASE_EMAIL_CONFIRMATION_CONFIGURED = 'true';
      
      const result = await createUserCreationData(
        'user@example.com',
        'password123',
        '1234567890'
      );

      expect(result.email_confirm).toBe(false); // Flipped logic
    });

    it('should handle phone confirmation configuration', async () => {
      process.env.SUPABASE_PHONE_CONFIRMATION_CONFIGURED = 'true';
      
      const result = await createUserCreationData(
        'user@example.com',
        'password123',
        '1234567890'
      );

      expect(result.phone_confirm).toBe(false); // Flipped logic
    });

    it('should default to auto-confirm when env vars not set', async () => {
      delete process.env.SUPABASE_EMAIL_CONFIRMATION_CONFIGURED;
      delete process.env.SUPABASE_PHONE_CONFIRMATION_CONFIGURED;
      
      const result = await createUserCreationData(
        'user@example.com',
        'password123',
        '1234567890'
      );

      expect(result.email_confirm).toBe(true);
      expect(result.phone_confirm).toBe(true);
    });
  });
});

