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

/**
 * Calculates the next Monday at 12:00 AM (midnight) after a given date
 * Pure function for testability
 * 
 * @param referenceDate The date to calculate from (e.g., visit_date)
 * @returns ISO string of next Monday at midnight after the reference date
 */
export async function calculateExpireDateTime(
  referenceDate: Date = new Date()
): Promise<string> {
  const date = new Date(referenceDate);
  
  // Get the day of the week for the reference date (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  const dayOfWeek = date.getDay();
  
  // Calculate days until the Monday AFTER the reference date
  let daysUntilNextMonday: number;
  
  if (dayOfWeek === 1) {
    // If reference date is Monday, we want the following Monday (7 days later)
    daysUntilNextMonday = 7;
  } else if (dayOfWeek === 0) {
    // If reference date is Sunday, next Monday is 1 day away
    daysUntilNextMonday = 1;
  } else {
    // For Tuesday (2) through Saturday (6)
    daysUntilNextMonday = 8 - dayOfWeek; // This gives us the days to next Monday
  }
  
  // Create new date for the Monday after the reference date
  const nextMonday = new Date(date);
  nextMonday.setDate(date.getDate() + daysUntilNextMonday);
  
  // Set to midnight (12:00 AM)
  nextMonday.setHours(0, 0, 0, 0);
  
  return nextMonday.toISOString();
}
