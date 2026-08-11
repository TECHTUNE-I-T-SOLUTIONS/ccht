/**
 * Timezone utilities for Nigerian time (WAT - UTC+1)
 */

// Nigerian timezone offset (UTC+1 in minutes)
const NIGERIA_OFFSET = 60;

/**
 * Convert a datetime-local input value to UTC ISO string for database storage
 * The input is treated as Nigerian time (UTC+1), so we convert to UTC
 * @param localDateTime - The datetime-local input value (YYYY-MM-DDTHH:MM)
 * @returns ISO string in UTC for database storage
 */
export function toNigerianTime(localDateTime: string): string {
  if (!localDateTime) return '';
  
  // Parse the datetime-local input (this is in local browser time - Nigerian time)
  const date = new Date(localDateTime);
  
  // Check if date is valid
  if (isNaN(date.getTime())) return '';
  
  // The datetime-local input is in the user's local timezone (Nigeria UTC+1)
  // When we create a Date from it, JavaScript automatically converts to UTC
  // So the ISO string will already be in UTC with the correct Nigerian time
  // Example: 10:36 PM (22:36) Nigerian time -> 21:36 UTC
  
  console.log('toNigerianTime - Converting Nigerian time to UTC:', {
    input: localDateTime,
    inputLocal: date.toLocaleString(),
    outputUTC: date.toISOString()
  });
  
  return date.toISOString();
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
  
  // The database stores UTC time (e.g., 21:36 UTC for 10:36 PM Nigerian time)
  // We need to convert it back to Nigerian time for the datetime-local input
  // Add 1 hour to convert UTC to Nigerian time
  const nigeriaDate = new Date(date.getTime() + (NIGERIA_OFFSET * 60000));
  
  console.log('fromNigerianTime - Converting UTC to Nigerian time:', {
    input: isoString,
    inputUTC: date.toISOString(),
    outputNigeria: nigeriaDate.toISOString(),
    outputFormatted: nigeriaDate.toISOString().slice(0, 16)
  });
  
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
    hour12: true, // Use 12-hour format for display (10:36 PM)
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
  // Add Nigerian offset to get current Nigerian time
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
  const start = convertToNigerianTimeDate(startDate);
  const end = convertToNigerianTimeDate(endDate);
  return now >= start && now <= end;
}

/**
 * Convert UTC ISO string to Nigerian time Date object for comparison
 * @param isoString - The ISO string from the database (UTC)
 * @returns Date object in Nigerian time
 */
export function convertToNigerianTimeDate(isoString: string): Date {
  const date = new Date(isoString);
  // Convert UTC to Nigerian time for comparison
  return new Date(date.getTime() + (NIGERIA_OFFSET * 60000));
}
