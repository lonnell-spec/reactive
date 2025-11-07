/**
 * Utility functions for generating random values
 */

/**
 * Generates a random 9-digit integer
 * Pure function for testability
 * 
 * @param randomFn Optional random function for testing (defaults to Math.random)
 * @returns A 9-digit random integer
 */
export async function generateRandom9DigitInteger(
  randomFn: () => number = Math.random
): Promise<number> {
  // Generate a 9-digit number
  // Range: 100000000 to 999999999 (9 digits)
  const min = 100000000; // 10^8
  const max = 999999999; // 10^9 - 1
  
  // Generate random number in the range
  const randomValue = randomFn() * (max - min + 1) + min;
  
  // Floor to get integer and ensure it's exactly 9 digits
  return Math.floor(randomValue);
}

/**
 * Generates a unique 9-digit integer with collision checking
 * 
 * @param checkUniqueFn Function to check if the generated number is unique
 * @param maxRetries Maximum number of retry attempts (default: 10)
 * @param randomFn Optional random function for testing
 * @returns A unique 9-digit random integer
 */
export async function generateUniqueRandom9DigitInteger(
  checkUniqueFn: (value: number) => Promise<boolean>,
  maxRetries: number = 10,
  randomFn: () => number = Math.random
): Promise<number> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const randomInteger = await generateRandom9DigitInteger(randomFn);
    
    // Check if this integer is unique
    const isUnique = await checkUniqueFn(randomInteger);
    
    if (isUnique) {
      return randomInteger;
    }
    
    // If not unique, try again
    console.log(`Generated integer ${randomInteger} already exists, retrying... (attempt ${attempt + 1}/${maxRetries})`);
  }
  
  throw new Error(`Failed to generate unique 9-digit integer after ${maxRetries} attempts`);
}

/**
 * Validates that a number is a 9-digit integer
 * Pure function for testability
 * 
 * @param value The number to validate
 * @returns True if the number is a 9-digit integer
 */
export async function isValid9DigitInteger(value: number): Promise<boolean> {
  // Check if it's an integer
  if (!Number.isInteger(value)) {
    return false;
  }
  
  // Check if it's exactly 9 digits
  const str = value.toString();
  return str.length === 9 && value >= 100000000 && value <= 999999999;
}
