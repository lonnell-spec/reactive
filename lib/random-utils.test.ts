/**
 * Unit tests for random utility functions
 * Tests ID generation and uniqueness checking
 */

import { 
  generateRandom9DigitInteger, 
  generateUniqueRandom9DigitInteger, 
  isValid9DigitInteger 
} from './random-utils';
import { vi } from 'vitest';

describe('Random Utils', () => {
  describe('generateRandom9DigitInteger', () => {
    it('should generate a 9-digit integer', async () => {
      const result = await generateRandom9DigitInteger();
      
      expect(result).toBeGreaterThanOrEqual(100000000);
      expect(result).toBeLessThanOrEqual(999999999);
      expect(Number.isInteger(result)).toBe(true);
    });

    it('should use custom random function when provided', async () => {
      const mockRandom = vi.fn(() => 0.5); // Middle of range
      
      const result = await generateRandom9DigitInteger(mockRandom);
      
      expect(mockRandom).toHaveBeenCalled();
      expect(result).toBeGreaterThanOrEqual(100000000);
      expect(result).toBeLessThanOrEqual(999999999);
    });

    it('should generate minimum value when random returns 0', async () => {
      const mockRandom = vi.fn(() => 0);
      
      const result = await generateRandom9DigitInteger(mockRandom);
      
      expect(result).toBe(100000000);
    });

    it('should generate near maximum value when random returns ~1', async () => {
      const mockRandom = vi.fn(() => 0.999999);
      
      const result = await generateRandom9DigitInteger(mockRandom);
      
      // With 0.999999, we get a value close to max but not exactly 999999999
      expect(result).toBeGreaterThanOrEqual(999999000);
      expect(result).toBeLessThanOrEqual(999999999);
    });
  });

  describe('generateUniqueRandom9DigitInteger', () => {
    it('should return value on first try if unique', async () => {
      const mockRandom = vi.fn(() => 0.5);
      const checkUnique = vi.fn().mockResolvedValue(true); // Always unique
      
      const result = await generateUniqueRandom9DigitInteger(
        checkUnique,
        10,
        mockRandom
      );
      
      expect(result).toBeGreaterThanOrEqual(100000000);
      expect(result).toBeLessThanOrEqual(999999999);
      expect(checkUnique).toHaveBeenCalledTimes(1);
      expect(checkUnique).toHaveBeenCalledWith(result);
    });

    it('should retry on collision and succeed', async () => {
      let callCount = 0;
      const mockRandom = vi.fn(() => 0.5);
      const checkUnique = vi.fn().mockImplementation(async () => {
        callCount++;
        return callCount > 2; // Fail first 2 attempts, succeed on 3rd
      });
      
      const result = await generateUniqueRandom9DigitInteger(
        checkUnique,
        10,
        mockRandom
      );
      
      expect(result).toBeGreaterThanOrEqual(100000000);
      expect(result).toBeLessThanOrEqual(999999999);
      expect(checkUnique).toHaveBeenCalledTimes(3);
    });

    it('should throw after maxRetries exhausted', async () => {
      const mockRandom = vi.fn(() => 0.5);
      const checkUnique = vi.fn().mockResolvedValue(false); // Always collision
      
      await expect(
        generateUniqueRandom9DigitInteger(checkUnique, 3, mockRandom)
      ).rejects.toThrow('Failed to generate unique 9-digit integer after 3 attempts');
      
      expect(checkUnique).toHaveBeenCalledTimes(3);
    });
  });

  describe('isValid9DigitInteger', () => {
    it('should validate correct 9-digit integers', async () => {
      expect(await isValid9DigitInteger(100000000)).toBe(true);
      expect(await isValid9DigitInteger(123456789)).toBe(true);
      expect(await isValid9DigitInteger(999999999)).toBe(true);
      expect(await isValid9DigitInteger(555555555)).toBe(true);
    });

    it('should reject numbers with wrong length', async () => {
      expect(await isValid9DigitInteger(99999999)).toBe(false); // 8 digits
      expect(await isValid9DigitInteger(1000000000)).toBe(false); // 10 digits
      expect(await isValid9DigitInteger(12345)).toBe(false); // 5 digits
      expect(await isValid9DigitInteger(0)).toBe(false); // 1 digit
    });

    it('should reject non-integers', async () => {
      expect(await isValid9DigitInteger(123456789.5)).toBe(false);
      expect(await isValid9DigitInteger(100000000.1)).toBe(false);
    });

    it('should reject negative numbers', async () => {
      expect(await isValid9DigitInteger(-123456789)).toBe(false);
      expect(await isValid9DigitInteger(-100000000)).toBe(false);
    });

    it('should handle boundary values correctly', async () => {
      expect(await isValid9DigitInteger(99999999)).toBe(false); // Just below min
      expect(await isValid9DigitInteger(100000000)).toBe(true); // Min
      expect(await isValid9DigitInteger(999999999)).toBe(true); // Max
      expect(await isValid9DigitInteger(1000000000)).toBe(false); // Just above max
    });
  });
});

