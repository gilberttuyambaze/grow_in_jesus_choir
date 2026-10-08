/**
 * Reusable Date Formatting Utilities
 * Standardizes human-friendly date and time display.
 */

export const APP_TIME_ZONE = process.env.NEXT_PUBLIC_APP_TIME_ZONE || process.env.APP_TIME_ZONE || 'Africa/Kigali'

export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return dateString
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: APP_TIME_ZONE
    }).format(date)
  } catch {
    return dateString
  }
}

export function formatDateTime(dateString: string): string {
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return dateString
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: APP_TIME_ZONE
    }).format(date)
  } catch {
    return dateString
  }
}

export function getTodayISODate(): string {
  return new Date().toISOString().split('T')[0]
}

