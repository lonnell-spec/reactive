'use server'

/**
 * Checks if a string is empty or whitespace
 * Pure function for testability
 * 
 * @param value The value to check
 * @returns True if empty or whitespace
 */
export async function isEmptyString(value: unknown): Promise<boolean> {
  return !value || typeof value !== 'string' || value.trim().length === 0;
}

/**
 * Safely trims a string
 * Pure function for testability
 * 
 * @param value The value to trim
 * @returns Trimmed string or empty string
 */
export async function safeTrim(value: unknown): Promise<string> {
  if (typeof value === 'string') {
    return value.trim();
  }
  return '';
}

/**
 * Validates email format (simple check)
 * Pure function for testability
 * 
 * @param email The email to validate
 * @returns True if email format is valid
 */
export async function isValidEmailFormat(email: string): Promise<boolean> {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validates phone number format (10 digits)
 * Pure function for testability
 * 
 * @param phone The phone number to validate
 * @returns True if phone format is valid
 */
export async function isValidPhoneFormat(phone: string): Promise<boolean> {
  if (!phone || typeof phone !== 'string') {
    return false;
  }
  
  const phoneRegex = /^\d{10}$/;
  return phoneRegex.test(phone.trim());
}
