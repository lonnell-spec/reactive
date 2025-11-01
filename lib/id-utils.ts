'use server'

/**
 * Generates a random alphanumeric string
 * Pure function for testability
 * 
 * @param length Length of the string to generate
 * @param randomFn Random function (defaults to Math.random)
 * @returns Random alphanumeric string
 */
export async function generateRandomString(
    length: number = 8,
    randomFn: () => number = Math.random
  ): Promise<string> {
  if (length <= 0) {
    throw new Error('Length must be positive');
  }
  
  if (length > 100) {
    throw new Error('Length too large (max 100)');
  }
  
    // Generate enough characters to guarantee we have `length` chars
    let result = '';
    while (result.length < length) {
      // Generate a random string and remove the "0." prefix
      const chunk = randomFn().toString(36).substring(2);
      result += chunk;
    }
  
    // Trim to exact length requested
    return result.substring(0, length);
  }

/**
 * Generates a mock development ID with timestamp
 * Pure function for testability
 * 
 * @param prefix Prefix for the ID
 * @param timestampFn Function to get timestamp (defaults to Date.now)
 * @returns Mock development ID
 */
export async function generateMockId(
  prefix: string = 'dev',
  timestampFn: () => number = Date.now
): Promise<string> {
  if (!prefix) {
    throw new Error('Prefix is required');
  }

  return `${prefix}-${timestampFn()}`;
}

/**
 * Generates a mock message ID for development
 * Pure function for testability
 * 
 * @param randomFn Random function (defaults to Math.random)
 * @returns Mock message ID
 */
export async function generateMockMessageId(
  randomFn: () => number = Math.random
): Promise<string> {
  const randomString = await generateRandomString(8, randomFn);
  return `dev-msg-${randomString}`;
}
