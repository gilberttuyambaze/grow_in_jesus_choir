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

export function formatCompactCurrency(amount: number): string {
  if (isNaN(amount) || amount === 0) return '0'
  const abs = Math.abs(amount)
  if (abs >= 1_000_000) {
    const val = (amount / 1_000_000).toFixed(2)
    return `${val.endsWith('.00') ? val.slice(0, -3) : val}M`
  }
  if (abs >= 1_000) {
    const val = (amount / 1_000).toFixed(1)
    return `${val.endsWith('.0') ? val.slice(0, -2) : val}K`
  }
  return amount.toLocaleString('en-US')
}

