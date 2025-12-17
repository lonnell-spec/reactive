/**
 * Unit tests for TextMagic utility functions
 * Tests phone/email formatting and validation
 */

import { formatPhoneToE164, validateEmailFormat } from './textmagic';

describe('TextMagic Utils', () => {
  describe('formatPhoneToE164', () => {
    it('should preserve numbers already in E.164 format', async () => {
      expect(await formatPhoneToE164('+11234567890')).toBe('+11234567890');
      expect(await formatPhoneToE164('+442071234567')).toBe('+442071234567');
      expect(await formatPhoneToE164('+33612345678')).toBe('+33612345678');
    });

    it('should prepend default country code +1 to plain digits', async () => {
      expect(await formatPhoneToE164('1234567890')).toBe('+11234567890');
      expect(await formatPhoneToE164('5551234567')).toBe('+15551234567');
    });

    it('should strip formatting characters and prepend country code', async () => {
      expect(await formatPhoneToE164('(123) 456-7890')).toBe('+11234567890');
      expect(await formatPhoneToE164('123-456-7890')).toBe('+11234567890');
      expect(await formatPhoneToE164('123.456.7890')).toBe('+11234567890');
      expect(await formatPhoneToE164('123 456 7890')).toBe('+11234567890');
    });

    it('should use custom country code when provided', async () => {
      expect(await formatPhoneToE164('1234567890', '+44')).toBe('+441234567890');
      expect(await formatPhoneToE164('612345678', '+33')).toBe('+33612345678');
    });

    it('should handle numbers with mixed formatting', async () => {
      expect(await formatPhoneToE164('+1 (555) 123-4567')).toBe('+1 (555) 123-4567');
      expect(await formatPhoneToE164('555-123-4567')).toBe('+15551234567');
    });

    it('should throw error for empty phone number', async () => {
      await expect(formatPhoneToE164('')).rejects.toThrow('Phone number is required');
    });

    it('should throw error for phone with no digits', async () => {
      await expect(formatPhoneToE164('---')).rejects.toThrow('Phone number must contain digits');
      await expect(formatPhoneToE164('abc')).rejects.toThrow('Phone number must contain digits');
    });
  });

  describe('validateEmailFormat', () => {
    it('should validate correct email formats', async () => {
      expect(await validateEmailFormat('test@example.com')).toBe('test@example.com');
      expect(await validateEmailFormat('user.name@domain.co.uk')).toBe('user.name@domain.co.uk');
      expect(await validateEmailFormat('user+tag@example.org')).toBe('user+tag@example.org');
    });

    it('should lowercase and trim email addresses', async () => {
      expect(await validateEmailFormat('TEST@EXAMPLE.COM')).toBe('test@example.com');
      expect(await validateEmailFormat('test@example.com')).toBe('test@example.com');
      expect(await validateEmailFormat('User@Domain.COM')).toBe('user@domain.com');
    });

    it('should reject invalid email formats', async () => {
      await expect(validateEmailFormat('invalid-email')).rejects.toThrow('Invalid email address format');
      await expect(validateEmailFormat('test@')).rejects.toThrow('Invalid email address format');
      await expect(validateEmailFormat('@example.com')).rejects.toThrow('Invalid email address format');
      await expect(validateEmailFormat('test.example.com')).rejects.toThrow('Invalid email address format');
      await expect(validateEmailFormat('test@example')).rejects.toThrow('Invalid email address format');
    });

    it('should reject empty email', async () => {
      await expect(validateEmailFormat('')).rejects.toThrow('Email address is required');
    });

    it('should reject email with spaces in middle', async () => {
      await expect(validateEmailFormat('test @example.com')).rejects.toThrow('Invalid email address format');
      await expect(validateEmailFormat('test@ example.com')).rejects.toThrow('Invalid email address format');
    });

    it('should handle complex valid email patterns', async () => {
      expect(await validateEmailFormat('user.name+tag@sub.domain.com')).toBe('user.name+tag@sub.domain.com');
      expect(await validateEmailFormat('123@numbers.com')).toBe('123@numbers.com');
      expect(await validateEmailFormat('a@b.co')).toBe('a@b.co');
    });

    it('should handle multiple dots in domain', async () => {
      expect(await validateEmailFormat('user@mail.example.co.uk')).toBe('user@mail.example.co.uk');
      expect(await validateEmailFormat('test@a.b.c.d.com')).toBe('test@a.b.c.d.com');
    });
  });
});

