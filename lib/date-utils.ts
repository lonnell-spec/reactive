'use server'

/**
 * Formats a date string to a localized date string
 * Pure function for testability
 * 
 * @param dateString The date string to format
 * @param locale The locale to use (default: 'en-US')
 * @param options Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export async function formatDateString(
  dateString: string,
  locale: string = 'en-US',
  options: Intl.DateTimeFormatOptions = {}
): Promise<string> {
  if (!dateString) {
    throw new Error('Date string is required');
  }

  try {
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date string');
    }

    return date.toLocaleDateString(locale, options);
  } catch (error) {
    throw new Error(`Failed to format date: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Checks if a date string represents a valid date
 * Pure function for testability
 * 
 * @param dateString The date string to validate
 * @returns True if valid, false otherwise
 */
export async function isValidDateString(dateString: string): Promise<boolean> {
  if (!dateString || typeof dateString !== 'string') {
    return false;
  }

  try {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  } catch {
    return false;
  }
}
