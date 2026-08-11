/**
 * Timezone utilities for Nigerian time (WAT - UTC+1)
 */

// Nigerian timezone offset (UTC+1 in minutes)
const NIGERIA_OFFSET = 60;

/**
 * Convert a datetime-local input value (treated as Nigerian time) to UTC ISO string
 * @param localDateTime - The datetime-local input value (YYYY-MM-DDTHH:MM) - this is treated as Nigerian time
 * @returns ISO string in UTC for database storage
 */
export function toNigerianTime(localDateTime: string): string {
  if (!localDateTime) return '';
  
  // Parse the local datetime (treat this as Nigerian time)
  const date = new Date(localDateTime);
  
  // Check if date is valid
  if (isNaN(date.getTime())) return '';
  
  // Since the input is in Nigerian time (UTC+1), we need to convert to UTC
  // by subtracting the Nigerian offset (1 hour = 60 minutes = 3600000 ms)
  const utcDate = new Date(date.getTime() - (NIGERIA_OFFSET * 60000));
  
  return utcDate.toISOString();
}

/**
 * Convert a UTC ISO string from database to Nigerian time for datetime-local input
 * @param isoString - The ISO string from the database (UTC)
 * @returns Formatted string for datetime-local input (YYYY-MM-DDTHH:MM) in Nigerian time
 */
export function fromNigerianTime(isoString: string | null): string {
  if (!isoString) return '';
  
  const date = new Date(isoString);
  
  // Check if date is valid
  if (isNaN(date.getTime())) return '';
  
  // Convert UTC to Nigerian time (UTC+1)
  const nigeriaDate = new Date(date.getTime() + (NIGERIA_OFFSET * 60000));
  
  // Format for datetime-local input
  return nigeriaDate.toISOString().slice(0, 16);
}

/**
 * Format a UTC ISO string from database to Nigerian time for display
 * @param isoString - The ISO string from the database (UTC)
 * @param formatOptions - Optional Intl.DateTimeFormatOptions
 * @returns Formatted date string in Nigerian time
 */
export function formatNigerianTime(
  isoString: string | null,
  formatOptions: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Africa/Lagos'
  }
): string {
  if (!isoString) return 'N/A';
  
  const date = new Date(isoString);
  
  // Check if date is valid
  if (isNaN(date.getTime())) return 'N/A';
  
  return date.toLocaleString('en-GB', formatOptions);
}

/**
 * Get current time in Nigerian time
 * @returns Current date/time in Nigerian time
 */
export function getNigerianTime(): Date {
  const now = new Date();
  return new Date(now.getTime() + (NIGERIA_OFFSET * 60000));
}

/**
 * Check if current time is within Nigerian time range
 * @param startDate - Start date ISO string (UTC)
 * @param endDate - End date ISO string (UTC)
 * @returns True if current Nigerian time is within range
 */
export function isWithinNigerianTimeRange(startDate: string, endDate: string): boolean {
  const now = getNigerianTime();
  const start = new Date(startDate);
  const end = new Date(endDate);
  return now >= start && now <= end;
}
