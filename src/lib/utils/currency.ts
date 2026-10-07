/**
 * Reusable Currency Formatting Utilities
 * Standardizes monetary representation across the application.
 * All amounts are stored as integer units in RWF.
 */

export function formatCurrency(amount: number, currency: string = 'RWF'): string {
  if (isNaN(amount)) {
    return `0 ${currency}`
  }
  const formatted = new Intl.NumberFormat('en-US').format(Math.round(amount))
  return `${formatted} ${currency}`
}

export function parseCurrencyInput(val: string): number {
  const cleaned = val.replace(/[^0-9]/g, '')
  return cleaned ? parseInt(cleaned, 10) : 0
}

