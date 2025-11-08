/**
 * Simple date utilities for the church application
 * 
 * Design Decision: 
 * - Visit dates are stored as simple date strings (YYYY-MM-DD) and displayed as calendar dates
 * - Expiry dates and other timestamps use timestamptz for timezone awareness
 * - Church timezone is configurable for expiry calculations
 */

// Default church timezone - can be overridden via environment variable
const CHURCH_TIMEZONE = process.env.CHURCH_TIMEZONE || 'America/Chicago' // CST/CDT

/**
 * Gets the church's timezone from environment or default
 */
export function getChurchTimezone(): string {
  return CHURCH_TIMEZONE
}

/**
 * Formats a visit date string (YYYY-MM-DD) for display
 * Simple calendar date - no timezone conversion
 * 
 * @param dateString Date string in YYYY-MM-DD format
 * @param options Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export function formatVisitDate(
  dateString: string,
  options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }
): string {
  if (!dateString) {
    return 'Unknown'
  }

  try {
    // Parse the date components to avoid timezone issues
    const [year, month, day] = dateString.split('-').map(Number)
    
    if (!year || !month || !day) {
      return 'Invalid Date'
    }

    // Create date in local timezone (month is 0-indexed)
    const date = new Date(year, month - 1, day)
    return date.toLocaleDateString('en-US', options)
  } catch (error) {
    console.error('Error formatting visit date:', error)
    return 'Invalid Date'
  }
}

/**
 * Calculates expiry date (next Monday after visit date) in church timezone
 * Takes a simple visit date and returns a timezone-aware expiry timestamp
 * 
 * @param visitDateString Visit date in YYYY-MM-DD format
 * @returns ISO string for database storage (expires at 11:59 PM in church timezone)
 */
export function calculateExpiryFromVisitDate(visitDateString: string): string {
  if (!visitDateString) {
    throw new Error('Visit date is required')
  }

  try {
    // Parse the visit date
    const [year, month, day] = visitDateString.split('-').map(Number)
    
    if (!year || !month || !day) {
      throw new Error('Invalid visit date format. Expected YYYY-MM-DD')
    }

    // Create the visit date at noon in church timezone
    // This ensures consistent expiry calculation regardless of server timezone
    const visitDate = new Date(year, month - 1, day, 12, 0, 0)
    
    // Get the day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    const dayOfWeek = visitDate.getDay()
    
    // Calculate days until the Monday AFTER the visit date
    let daysUntilNextMonday: number
    
    if (dayOfWeek === 1) {
      // If visit date is Monday, expire the following Monday (7 days later)
      daysUntilNextMonday = 7
    } else if (dayOfWeek === 0) {
      // If visit date is Sunday, expire next Monday (1 day later)
      daysUntilNextMonday = 1
    } else {
      // For Tuesday (2) through Saturday (6)
      daysUntilNextMonday = 8 - dayOfWeek
    }
    
    // Create expiry date
    const expiryDate = new Date(visitDate)
    expiryDate.setDate(visitDate.getDate() + daysUntilNextMonday)
    
    // Set to end of day (11:59 PM) in local timezone
    // The database will store this as timestamptz
    expiryDate.setHours(23, 59, 59, 999)
    
    return expiryDate.toISOString()
  } catch (error) {
    console.error('Error calculating expiry from visit date:', error)
    throw new Error('Failed to calculate expiry date')
  }
}

/**
 * Validates a date string format (YYYY-MM-DD)
 * 
 * @param dateString Date string to validate
 * @returns True if valid format and date
 */
export function isValidDateFormat(dateString: string): boolean {
  if (!dateString || typeof dateString !== 'string') {
    return false
  }

  // Check format with regex
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(dateString)) {
    return false
  }

  try {
    const [year, month, day] = dateString.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    
    // Check if the created date matches the input (catches invalid dates like 2025-02-30)
    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    )
  } catch {
    return false
  }
}

/**
 * Formats a timestamp (with timezone) for display
 * Used for expires_at, created_at, approved_at, etc.
 * 
 * @param timestampString ISO timestamp string (e.g., "2025-12-01T23:59:59.999Z")
 * @param options Intl.DateTimeFormatOptions
 * @param timezone Optional timezone for display (defaults to user's local timezone)
 * @returns Formatted timestamp string
 */
export function formatTimestamp(
  timestampString: string,
  options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  },
  timezone?: string
): string {
  if (!timestampString) {
    return 'Unknown'
  }

  try {
    const date = new Date(timestampString)
    if (isNaN(date.getTime())) {
      return 'Invalid Date'
    }
    
    const formatOptions = timezone ? { ...options, timeZone: timezone } : options
    return date.toLocaleString('en-US', formatOptions)
  } catch (error) {
    console.error('Error formatting timestamp:', error)
    return 'Invalid Date'
  }
}

/**
 * Formats a timestamp as a full date and time
 * 
 * @param timestampString ISO timestamp string
 * @param timezone Optional timezone for display
 * @returns Formatted date and time string
 */
export function formatFullTimestamp(timestampString: string, timezone?: string): string {
  return formatTimestamp(timestampString, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }, timezone)
}

/**
 * Formats a timestamp in the church's timezone
 * Useful for displaying church-related times consistently
 * 
 * @param timestampString ISO timestamp string
 * @param options Intl.DateTimeFormatOptions
 * @returns Formatted timestamp in church timezone
 */
export function formatChurchTimestamp(
  timestampString: string,
  options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }
): string {
  return formatTimestamp(timestampString, options, getChurchTimezone())
}

/**
 * Gets relative time from a timestamp (e.g., "2 hours ago")
 * 
 * @param timestampString ISO timestamp string
 * @returns Relative time string
 */
export function getRelativeTime(timestampString: string): string {
  if (!timestampString) return ''
  
  try {
    const date = new Date(timestampString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    
    // For older dates, show the actual date
    return formatTimestamp(timestampString, {
      month: 'short',
      day: 'numeric',
      year: diffDays > 365 ? 'numeric' : undefined
    })
  } catch (error) {
    console.error('Error calculating relative time:', error)
    return ''
  }
}

/**
 * Gets the current date in YYYY-MM-DD format
 * Useful for default values and date comparisons
 * 
 * @returns Current date string
 */
export function getCurrentDate(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Checks if a visit date is in the past
 * 
 * @param visitDateString Visit date in YYYY-MM-DD format
 * @returns True if the visit date is in the past
 */
export function isVisitDateInPast(visitDateString: string): boolean {
  try {
    const currentDate = getCurrentDate()
    return visitDateString < currentDate
  } catch (error) {
    console.error('Error checking if visit date is in past:', error)
    return false
  }
}

// Legacy aliases for backward compatibility
export const formatLocalDate = formatVisitDate
export const createLocalDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}