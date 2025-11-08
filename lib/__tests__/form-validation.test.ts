/**
 * Unit tests for form validation functions
 * Tests the most critical validation logic that handles user input
 */

import { validateSignUpInputs } from '../auth-client-actions';
import { parseFormBoolean, getFormString } from '../form-utils';

describe('Form Validation', () => {
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

  describe('parseFormBoolean', () => {
    it('should parse boolean true correctly', async () => {
      const result = await parseFormBoolean(true);
      expect(result).toBe(true);
    });

    it('should parse boolean false correctly', async () => {
      const result = await parseFormBoolean(false);
      expect(result).toBe(false);
    });

    it('should parse string "true" correctly', async () => {
      const result = await parseFormBoolean('true');
      expect(result).toBe(true);
    });

    it('should parse string "false" correctly', async () => {
      const result = await parseFormBoolean('false');
      expect(result).toBe(false);
    });

    it('should parse string "TRUE" correctly (case insensitive)', async () => {
      const result = await parseFormBoolean('TRUE');
      expect(result).toBe(true);
    });

    it('should return false for invalid inputs', async () => {
      expect(await parseFormBoolean('invalid')).toBe(false);
      expect(await parseFormBoolean(123)).toBe(false);
      expect(await parseFormBoolean(null)).toBe(false);
      expect(await parseFormBoolean(undefined)).toBe(false);
    });
  });

  describe('getFormString', () => {
    it('should return string value as-is', async () => {
      const result = await getFormString('test string');
      expect(result).toBe('test string');
    });

    it('should return default fallback for non-string values', async () => {
      expect(await getFormString(123)).toBe('');
      expect(await getFormString(null)).toBe('');
      expect(await getFormString(undefined)).toBe('');
      expect(await getFormString({})).toBe('');
    });

    it('should return custom fallback when provided', async () => {
      const result = await getFormString(123, 'default');
      expect(result).toBe('default');
    });

    it('should handle empty strings', async () => {
      const result = await getFormString('');
      expect(result).toBe('');
    });

    it('should handle whitespace strings', async () => {
      const result = await getFormString('   ');
      expect(result).toBe('   ');
    });
  });
});
