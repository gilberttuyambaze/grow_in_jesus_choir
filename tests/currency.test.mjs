import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

function formatCurrency(amount, currency = 'RWF') {
  if (isNaN(amount)) return `0 ${currency}`
  const formatted = new Intl.NumberFormat('en-US').format(Math.round(amount))
  return `${formatted} ${currency}`
}

function parseCurrencyInput(val) {
  const cleaned = val.replace(/[^0-9]/g, '')
  return cleaned ? parseInt(cleaned, 10) : 0
}

describe('Currency Formatting & Minor Unit Parsing (Section 15)', () => {
  test('formats regular integer amounts with RWF suffix', () => {
    assert.equal(formatCurrency(50000), '50,000 RWF')
    assert.equal(formatCurrency(1845000), '1,845,000 RWF')
    assert.equal(formatCurrency(0), '0 RWF')
  })

  test('formats large numbers without precision loss', () => {
    assert.equal(formatCurrency(50000000), '50,000,000 RWF')
  })

  test('handles NaN or invalid inputs gracefully', () => {
    assert.equal(formatCurrency(NaN), '0 RWF')
  })

  test('correctly parses user string inputs with separators', () => {
    assert.equal(parseCurrencyInput('50,000'), 50000)
    assert.equal(parseCurrencyInput('1 845 000 RWF'), 1845000)
    assert.equal(parseCurrencyInput('invalid'), 0)
    assert.equal(parseCurrencyInput(''), 0)
  })
})
