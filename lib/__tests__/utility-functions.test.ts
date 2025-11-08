/**
 * Unit tests for utility functions
 * Tests pure utility functions that are used throughout the application
 */

import { 
  isEmptyString, 
  safeTrim, 
  isValidEmailFormat, 
  isValidPhoneFormat 
} from '../string-utils';

describe('Utility Functions', () => {
  describe('isEmptyString', () => {
    it('should return true for empty string', async () => {
      const result = await isEmptyString('');
      expect(result).toBe(true);
    });

    it('should return true for whitespace-only string', async () => {
      expect(await isEmptyString('   ')).toBe(true);
      expect(await isEmptyString('\t')).toBe(true);
      expect(await isEmptyString('\n')).toBe(true);
      expect(await isEmptyString('  \t\n  ')).toBe(true);
    });

    it('should return true for null and undefined', async () => {
      expect(await isEmptyString(null)).toBe(true);
      expect(await isEmptyString(undefined)).toBe(true);
    });

    it('should return true for non-string values', async () => {
      expect(await isEmptyString(123)).toBe(true);
      expect(await isEmptyString({})).toBe(true);
      expect(await isEmptyString([])).toBe(true);
      expect(await isEmptyString(false)).toBe(true);
    });

    it('should return false for non-empty strings', async () => {
      expect(await isEmptyString('hello')).toBe(false);
      expect(await isEmptyString('  hello  ')).toBe(false);
      expect(await isEmptyString('0')).toBe(false);
    });
  });

  describe('safeTrim', () => {
    it('should trim whitespace from strings', async () => {
      expect(await safeTrim('  hello  ')).toBe('hello');
      expect(await safeTrim('\thello\n')).toBe('hello');
      expect(await safeTrim('hello')).toBe('hello');
    });

    it('should return empty string for non-string values', async () => {
      expect(await safeTrim(null)).toBe('');
      expect(await safeTrim(undefined)).toBe('');
      expect(await safeTrim(123)).toBe('');
      expect(await safeTrim({})).toBe('');
      expect(await safeTrim([])).toBe('');
    });

    it('should handle empty strings', async () => {
      expect(await safeTrim('')).toBe('');
      expect(await safeTrim('   ')).toBe('');
    });

    it('should preserve content while trimming', async () => {
      expect(await safeTrim('  hello world  ')).toBe('hello world');
      expect(await safeTrim('  multiple   spaces  ')).toBe('multiple   spaces');
    });
  });

  describe('isValidEmailFormat', () => {
    it('should validate correct email formats', async () => {
      expect(await isValidEmailFormat('test@example.com')).toBe(true);
      expect(await isValidEmailFormat('user.name@domain.co.uk')).toBe(true);
      expect(await isValidEmailFormat('user+tag@example.org')).toBe(true);
      expect(await isValidEmailFormat('123@numbers.com')).toBe(true);
    });

    it('should reject invalid email formats', async () => {
      expect(await isValidEmailFormat('invalid-email')).toBe(false);
      expect(await isValidEmailFormat('test@')).toBe(false);
      expect(await isValidEmailFormat('@example.com')).toBe(false);
      expect(await isValidEmailFormat('test.example.com')).toBe(false);
      expect(await isValidEmailFormat('test@example')).toBe(false);
      expect(await isValidEmailFormat('test @example.com')).toBe(false);
    });

    it('should handle edge cases', async () => {
      expect(await isValidEmailFormat('')).toBe(false);
      expect(await isValidEmailFormat('   ')).toBe(false);
      expect(await isValidEmailFormat('test@example.com ')).toBe(true); // Should trim
    });

    it('should reject non-string inputs', async () => {
      // @ts-ignore - Testing runtime behavior
      expect(await isValidEmailFormat(null)).toBe(false);
      // @ts-ignore - Testing runtime behavior
      expect(await isValidEmailFormat(undefined)).toBe(false);
      // @ts-ignore - Testing runtime behavior
      expect(await isValidEmailFormat(123)).toBe(false);
    });
  });

  describe('isValidPhoneFormat', () => {
    it('should validate correct 10-digit phone numbers', async () => {
      expect(await isValidPhoneFormat('1234567890')).toBe(true);
      expect(await isValidPhoneFormat('9876543210')).toBe(true);
      expect(await isValidPhoneFormat('0000000000')).toBe(true);
    });

    it('should reject invalid phone formats', async () => {
      expect(await isValidPhoneFormat('123456789')).toBe(false); // Too short
      expect(await isValidPhoneFormat('12345678901')).toBe(false); // Too long
      expect(await isValidPhoneFormat('123-456-7890')).toBe(false); // With dashes
      expect(await isValidPhoneFormat('(123) 456-7890')).toBe(false); // With formatting
      expect(await isValidPhoneFormat('123 456 7890')).toBe(false); // With spaces
      expect(await isValidPhoneFormat('abcdefghij')).toBe(false); // Letters
      expect(await isValidPhoneFormat('123abc7890')).toBe(false); // Mixed
    });

    it('should handle edge cases', async () => {
      expect(await isValidPhoneFormat('')).toBe(false);
      expect(await isValidPhoneFormat('   ')).toBe(false);
      expect(await isValidPhoneFormat(' 1234567890 ')).toBe(true); // Should trim
    });

    it('should reject non-string inputs', async () => {
      // @ts-ignore - Testing runtime behavior
      expect(await isValidPhoneFormat(null)).toBe(false);
      // @ts-ignore - Testing runtime behavior
      expect(await isValidPhoneFormat(undefined)).toBe(false);
      // @ts-ignore - Testing runtime behavior
      expect(await isValidPhoneFormat(1234567890)).toBe(false);
    });

    it('should handle phone numbers with leading zeros', async () => {
      expect(await isValidPhoneFormat('0123456789')).toBe(true);
      expect(await isValidPhoneFormat('0000000001')).toBe(true);
    });
  });
});
