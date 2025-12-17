/**
 * Unit tests for form utility functions
 * Tests form data parsing and extraction utilities
 */

import { parseFormBoolean, getFormString } from './form-utils';

describe('Form Utils', () => {
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

