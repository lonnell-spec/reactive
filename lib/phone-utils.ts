/**
 * Phone number formatting utilities for client-side masking
 */

/**
 * Formats a phone number string with US phone number formatting
 * @param value - Raw phone number string (can contain any characters)
 * @returns Formatted phone number string like (123) 456-7890
 */
export function formatPhoneNumber(value: string): string {
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, '')
  
  // Apply formatting based on length
  if (digits.length === 0) {
    return ''
  } else if (digits.length <= 3) {
    return `(${digits}`
  } else if (digits.length <= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  } else {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`
  }
}

/**
 * Strips all formatting from a phone number to get just digits
 * @param value - Formatted phone number string
 * @returns String containing only digits
 */
export function stripPhoneFormatting(value: string): string {
  return value.replace(/\D/g, '')
}

/**
 * Validates if a phone number (after stripping formatting) is exactly 10 digits
 * @param value - Phone number string (formatted or unformatted)
 * @returns True if exactly 10 digits after stripping formatting
 */
export function isValidPhoneLength(value: string): boolean {
  const digits = stripPhoneFormatting(value)
  return digits.length === 10
}

/**
 * Gets the cursor position after formatting a phone number
 * This helps maintain cursor position when user is typing
 * @param oldValue - Previous value
 * @param newValue - New formatted value
 * @param oldCursor - Previous cursor position
 * @returns New cursor position
 */
export function getFormattedCursorPosition(
  oldValue: string,
  newValue: string,
  oldCursor: number
): number {
  // Count digits before cursor in old value
  const digitsBefore = oldValue.slice(0, oldCursor).replace(/\D/g, '').length
  
  // Find position in new value that has same number of digits before it
  let newCursor = 0
  let digitsCount = 0
  
  for (let i = 0; i < newValue.length; i++) {
    if (/\d/.test(newValue[i])) {
      digitsCount++
      if (digitsCount === digitsBefore) {
        newCursor = i + 1
        break
      }
    } else if (digitsCount < digitsBefore) {
      newCursor = i + 1
    }
  }
  
  return Math.min(newCursor, newValue.length)
}
