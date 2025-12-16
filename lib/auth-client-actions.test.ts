/**
 * Unit tests for authentication client action validation
 * Tests user registration form validation logic
 */

import { validateSignUpInputs } from './auth-client-actions';

describe('Form Validation - Auth Client Actions', () => {
  describe('validateSignUpInputs', () => {
    it('should pass validation with valid inputs', async () => {
      const result = await validateSignUpInputs(
        'test@example.com',
        'Password123!',
        'Password123!',
        '1234567890',
        'ADMIN_CODE'
      );

      expect(result.isValid).toBe(true);
      expect(result.message).toBe('Validation passed');
    });

    it('should fail validation with invalid email', async () => {
      const result = await validateSignUpInputs(
        'invalid-email',
        'Password123!',
        'Password123!',
        '1234567890',
        'ADMIN_CODE'
      );

      expect(result.isValid).toBe(false);
      expect(result.message).toContain('email');
    });

    it('should fail validation with mismatched passwords', async () => {
      const result = await validateSignUpInputs(
        'test@example.com',
        'Password123!',
        'DifferentPassword123!',
        '1234567890',
        'ADMIN_CODE'
      );

      expect(result.isValid).toBe(false);
      expect(result.message).toContain('match');
    });

    it('should fail validation with invalid phone number', async () => {
      const result = await validateSignUpInputs(
        'test@example.com',
        'Password123!',
        'Password123!',
        '123', // Too short
        'ADMIN_CODE'
      );

      expect(result.isValid).toBe(false);
      expect(result.message).toContain('Phone number must be exactly 10 digits');
    });

    it('should fail validation with empty admin code', async () => {
      const result = await validateSignUpInputs(
        'test@example.com',
        'Password123!',
        'Password123!',
        '1234567890',
        ''
      );

      expect(result.isValid).toBe(false);
      expect(result.message).toContain('code');
    });

    it('should handle weak passwords', async () => {
      const result = await validateSignUpInputs(
        'test@example.com',
        '123', // Too weak
        '123',
        '1234567890',
        'ADMIN_CODE'
      );

      expect(result.isValid).toBe(false);
      expect(result.message).toContain('Password must be at least 8 characters');
    });
  });
});

